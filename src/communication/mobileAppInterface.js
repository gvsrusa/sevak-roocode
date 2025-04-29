/**
 * Sevak Mini Tractor - Mobile App Interface
 *
 * Manages communication between the tractor control system and the mobile app.
 * Implements a secure WebSocket server with TLS for real-time bidirectional communication.
 * Uses certificate-based authentication and encrypted data transmission.
 */

const WebSocket = require('ws');
const https = require('https');
const crypto = require('crypto');
const Logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');
const config = require('../config');
const SecurityManager = require('../utils/security');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const zlib = require('zlib');  // For message compression

// Message compression threshold in bytes
const COMPRESSION_THRESHOLD = 1024;

// Cache TTL in milliseconds
const CACHE_TTL = 5000; // 5 seconds

class MobileAppInterface {
  constructor() {
    this.logger = new Logger('MobileAppInterface');
    
    // Security manager
    this.securityManager = new SecurityManager();
    
    // WebSocket server
    this.wss = null;
    
    // Socket.IO server
    this.io = null;
    
    // HTTPS server
    this.httpsServer = null;
    
    // Connected clients
    this.clients = new Map(); // Maps WebSocket/Socket.IO socket to client info
    
    // Connection status
    this.isConnected = false;
    
    // Last command received
    this.lastCommand = {
      type: null,
      data: null,
      timestamp: 0
    };
    
    // Status cache to reduce redundant requests
    this.statusCache = {
      navigation: { data: null, timestamp: 0 },
      motor: { data: null, timestamp: 0 },
      sensor: { data: null, timestamp: 0 },
      safety: { data: null, timestamp: 0 }
    };
    
    // Message batching for broadcasts
    this.pendingBroadcasts = new Map(); // Maps client to pending messages
    this.broadcastTimer = null;
    
    // Command handlers
    this.commandHandlers = {
      'AUTH': this._handleAuthCommand.bind(this),
      'MOVE': this._handleMoveCommand.bind(this),
      'NAVIGATE': this._handleNavigateCommand.bind(this),
      'STOP': this._handleStopCommand.bind(this),
      'EMERGENCY_STOP': this._handleEmergencyStopCommand.bind(this),
      'GET_STATUS': this._handleGetStatusCommand.bind(this),
      'SET_BOUNDARIES': this._handleSetBoundariesCommand.bind(this),
      'LOGOUT': this._handleLogoutCommand.bind(this)
    };
    
    // Event subscriptions
    this.eventSubscriptions = [];
    
    // Session cleanup interval
    this.sessionCleanupInterval = null;
    
    this.logger.info('Mobile App Interface initialized');
  }
  
  /**
   * Initialize the mobile app interface
   */
  async initialize() {
    this.logger.info('Initializing mobile app interface...');
    
    try {
      // Initialize security manager
      await this.securityManager.initialize();
      
      // Start secure WebSocket server
      await this._startSecureWebSocketServer();
      
      // Subscribe to events
      this._subscribeToEvents();
      
      // Start session cleanup interval
      this._startSessionCleanup();
      
      this.logger.info('Mobile app interface initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize mobile app interface: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Start secure WebSocket server with TLS
   * @private
   */
  async _startSecureWebSocketServer() {
    return new Promise((resolve, reject) => {
      try {
        // Create HTTPS server with TLS options
        const tlsOptions = this.securityManager.getTlsOptions();
        
        // Create HTTPS server
        this.httpsServer = https.createServer(tlsOptions);
        
        // Create WebSocket server on top of HTTPS server
        this.wss = new WebSocket.Server({
          server: this.httpsServer,
          clientTracking: true
        });
        
        // Create Socket.IO server on top of HTTPS server
        this.io = socketIo(this.httpsServer, {
          cors: {
            origin: "*",
            methods: ["GET", "POST"]
          }
        });
        
        // Handle WebSocket connection events
        this.wss.on('connection', (ws, req) => {
          this._handleWebSocketConnection(ws, req);
        });
        
        // Handle Socket.IO connection events
        this.io.on('connection', (socket) => {
          this._handleSocketIOConnection(socket);
        });
        
        // Handle WebSocket server errors
        this.wss.on('error', (error) => {
          this.logger.error(`WebSocket server error: ${error.message}`);
        });
        
        // Start HTTPS server
        this.httpsServer.listen(config.communication.mobileApp.port, () => {
          this.logger.info(`Secure server listening on port ${config.communication.mobileApp.port} (WebSocket and Socket.IO)`);
          this.isConnected = true;
          resolve();
        });
        
        // Handle HTTPS server errors
        this.httpsServer.on('error', (error) => {
          this.logger.error(`HTTPS server error: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        this.logger.error(`Failed to start secure WebSocket server: ${error.message}`);
        reject(error);
      }
    });
  }
  
  /**
   * Start session cleanup interval
   * @private
   */
  _startSessionCleanup() {
    // Clean up expired sessions periodically
    this.sessionCleanupInterval = setInterval(() => {
      this.securityManager.cleanupExpiredSessions();
    }, config.security.session.sessionCleanupInterval);
  }
  
  /**
   * Subscribe to events
   * @private
   */
  _subscribeToEvents() {
    // Subscribe to navigation status updates
    this.eventSubscriptions.push(
      eventBus.subscribe('navigation.status.updated', (data) => {
        this._broadcastEvent('NAVIGATION_STATUS', data);
      })
    );
    
    // Subscribe to motor status updates
    this.eventSubscriptions.push(
      eventBus.subscribe('motor.status.updated', (data) => {
        this._broadcastEvent('MOTOR_STATUS', data);
      })
    );
    
    // Subscribe to sensor status updates
    this.eventSubscriptions.push(
      eventBus.subscribe('sensor.connectionStatus.updated', (data) => {
        this._broadcastEvent('SENSOR_STATUS', data);
      })
    );
    
    // Subscribe to safety status updates
    this.eventSubscriptions.push(
      eventBus.subscribe('safety.status.updated', (data) => {
        this._broadcastEvent('SAFETY_STATUS', data);
      })
    );
    
    // Subscribe to emergency stop events
    this.eventSubscriptions.push(
      eventBus.subscribe('safety.emergencyStop.activated', (data) => {
        this._broadcastEvent('EMERGENCY_STOP', data);
      })
    );
    
    // Subscribe to boundary violation events
    this.eventSubscriptions.push(
      eventBus.subscribe('navigation.boundaryViolation', (data) => {
        this._broadcastEvent('BOUNDARY_VIOLATION', data);
      })
    );
  }
  
  /**
   * Handle new WebSocket connection
   * @private
   */
  _handleWebSocketConnection(ws, req) {
    try {
      // Verify client certificate
      const clientCert = req.socket.getPeerCertificate();
      
      if (!clientCert || Object.keys(clientCert).length === 0) {
        this.logger.warn('WebSocket client connected without certificate');
        ws.close(4401, 'Certificate required');
        return;
      }
      
      // Convert certificate to Buffer for verification
      const certBuffer = Buffer.from(clientCert.raw, 'binary');
      
      // Verify certificate
      const verificationResult = this.securityManager.verifyClientCertificate(certBuffer);
      
      if (!verificationResult.valid) {
        this.logger.warn(`Certificate verification failed: ${verificationResult.error}`);
        ws.close(4403, 'Certificate verification failed');
        return;
      }
      
      // Get client IP
      const ip = req.socket.remoteAddress;
      
      // Check for compression support in headers
      const supportsCompression = req.headers['sec-websocket-extensions'] &&
                                 req.headers['sec-websocket-extensions'].includes('permessage-deflate');
      
      // Store client information
      const clientInfo = {
        id: verificationResult.clientId,
        ip: ip,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        authenticated: false,
        sessionToken: null,
        protocol: 'websocket',
        supportsCompression: supportsCompression
      };
      
      // Add client to map
      this.clients.set(ws, clientInfo);
      
      this.logger.info(`New WebSocket client connected: ${clientInfo.id} from ${ip}`);
      
      // Send welcome message
      this._sendToClient(ws, {
        type: 'WELCOME',
        data: {
          message: 'Welcome to Sevak Mini Tractor Control System',
          requiresAuth: true,
          version: config.version,
          clientId: clientInfo.id
        }
      });
      
      // Handle messages
      ws.on('message', (message) => {
        // Update last activity
        clientInfo.lastActivity = Date.now();
        
        // Handle message
        this._handleWebSocketMessage(ws, message);
      });
      
      // Handle close
      ws.on('close', () => {
        this._handleClose(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        this.logger.error(`WebSocket client error: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Error handling WebSocket connection: ${error.message}`);
      ws.close(4500, 'Internal server error');
    }
  }
  
  /**
   * Handle new Socket.IO connection
   * @private
   */
  _handleSocketIOConnection(socket) {
    try {
      // Get client IP
      const ip = socket.handshake.address;
      
      // Generate temporary client ID
      const tempClientId = `socketio-${crypto.randomBytes(8).toString('hex')}`;
      
      // Store client information
      const clientInfo = {
        id: tempClientId,
        ip: ip,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        authenticated: false,
        sessionToken: null,
        protocol: 'socketio'
      };
      
      // Add client to map
      this.clients.set(socket, clientInfo);
      
      this.logger.info(`New Socket.IO client connected from ${ip}`);
      
      // Send welcome message
      socket.emit('WELCOME', {
        message: 'Welcome to Sevak Mini Tractor Control System',
        requiresAuth: true,
        version: config.version,
        clientId: tempClientId
      });
      
      // Handle authentication
      socket.on('AUTH', (data) => {
        // Update last activity
        clientInfo.lastActivity = Date.now();
        
        // Handle authentication
        this._handleSocketIOAuth(socket, data);
      });
      
      // Set up event handlers for commands
      Object.keys(this.commandHandlers).forEach(commandType => {
        if (commandType !== 'AUTH') {
          socket.on(commandType, (data) => {
            // Update last activity
            clientInfo.lastActivity = Date.now();
            
            // Check if client is authenticated
            if (!clientInfo.authenticated) {
              socket.emit('ERROR', {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              });
              
              // Log security event
              if (config.security.logging.logFailedAuthAttempts) {
                this.logger.warn(`Unauthorized command attempt: ${commandType} from Socket.IO client ${clientInfo.id}`);
              }
              
              return;
            }
            
            // Create command object
            const command = {
              type: commandType,
              data: data,
              id: crypto.randomBytes(16).toString('hex'),
              timestamp: Date.now()
            };
            
            // Handle command
            this._handleSocketIOCommand(socket, command);
          });
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        this._handleClose(socket);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        this.logger.error(`Socket.IO client error: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      ws.close(4500, 'Internal server error');
    }
  }
  
  /**
   * Handle WebSocket message
   * @private
   */
  _handleWebSocketMessage(ws, message) {
    try {
      // Get client info
      const clientInfo = this.clients.get(ws);
      
      if (!clientInfo) {
        this.logger.warn('Message received from unknown client');
        ws.close(4404, 'Unknown client');
        return;
      }
      
      // Parse message
      const rawMessage = JSON.parse(message);
      
      // Check if message is compressed
      let parsedMessage;
      if (rawMessage.compressed && rawMessage.data) {
        // Decompress message
        try {
          const compressedData = Buffer.from(rawMessage.data, 'base64');
          const decompressedData = zlib.inflateSync(compressedData);
          parsedMessage = JSON.parse(decompressedData.toString());
          
          // Update client info to indicate compression support
          clientInfo.supportsCompression = true;
        } catch (error) {
          this.logger.error(`Failed to decompress message: ${error.message}`);
          this._sendError(ws, 'DECOMPRESSION_FAILED', 'Failed to decompress message');
          return;
        }
      } else {
        parsedMessage = rawMessage;
      }
      
      // Handle batch messages
      if (parsedMessage.type === 'BATCH' && Array.isArray(parsedMessage.data)) {
        // Process each message in the batch
        for (const batchedMessage of parsedMessage.data) {
          this._processMessage(ws, batchedMessage, clientInfo);
        }
        return;
      }
      
      // Validate message format
      if (!parsedMessage.type || !parsedMessage.data) {
        this._sendError(ws, 'INVALID_FORMAT', 'Invalid message format');
        return;
      }
      
      // Process single message
      this._processMessage(ws, parsedMessage, clientInfo);
    } catch (error) {
      this.logger.error(`Failed to handle message: ${error.message}`);
      this._sendError(ws, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
  
  /**
   * Process a single message
   * @private
   */
  _processMessage(ws, parsedMessage, clientInfo) {
    try {
      
      // Add command ID if not present
      if (!parsedMessage.id) {
        parsedMessage.id = this._generateCommandId();
      }
      
      // Add timestamp if not present
      if (!parsedMessage.timestamp) {
        parsedMessage.timestamp = Date.now();
      }
      
      // Update last command
      this.lastCommand = {
        type: parsedMessage.type,
        data: parsedMessage.data,
        timestamp: parsedMessage.timestamp,
        id: parsedMessage.id
      };
      
      // Check if command requires authentication
      const requiresAuth = parsedMessage.type !== 'AUTH';
      
      // Check if client is authenticated
      if (requiresAuth && !clientInfo.authenticated) {
        this._sendError(ws, 'UNAUTHORIZED', 'Authentication required');
        
        // Log security event
        if (config.security.logging.logFailedAuthAttempts) {
          this.logger.warn(`Unauthorized command attempt: ${parsedMessage.type} from client ${clientInfo.id}`);
        }
        
        return;
      }
      
      // Handle command
      const handler = this.commandHandlers[parsedMessage.type];
      
      if (handler) {
        handler(ws, parsedMessage.data, parsedMessage);
      } else {
        this._sendError(ws, 'UNKNOWN_COMMAND', `Unknown command: ${parsedMessage.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process message: ${error.message}`);
      this._sendError(ws, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
  
  /**
   * Handle WebSocket close
   * @private
   */
  _handleClose(ws) {
    // Get client info
    const clientInfo = this.clients.get(ws);
    
    if (clientInfo) {
      // Invalidate session token if authenticated
      if (clientInfo.authenticated && clientInfo.sessionToken) {
        this.securityManager.invalidateSessionToken(clientInfo.sessionToken);
      }
      
      this.logger.info(`Client disconnected: ${clientInfo.id}`);
      
      // Remove client from map
      this.clients.delete(ws);
    } else {
      this.logger.info('Unknown client disconnected');
    }
  }
  
  /**
   * Generate unique command ID
   * @private
   */
  _generateCommandId() {
    return crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * Send message to client with signature and compression for large messages
   * @private
   */
  _sendToClient(ws, message) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        // Get client info
        const clientInfo = this.clients.get(ws);
        
        if (!clientInfo) {
          this.logger.warn('Attempted to send message to unknown client');
          return;
        }
        
        // Add message ID and timestamp if not present
        if (!message.id) {
          message.id = this._generateCommandId();
        }
        
        if (!message.timestamp) {
          message.timestamp = Date.now();
        }
        
        // Sign message
        const signedMessage = this.securityManager.signCommand(message);
        
        // Convert to JSON string
        const jsonString = JSON.stringify(signedMessage);
        
        // Check if message is large enough to compress
        if (jsonString.length > COMPRESSION_THRESHOLD && clientInfo.supportsCompression) {
          // Compress message
          zlib.deflate(jsonString, (err, compressed) => {
            if (err) {
              // Fall back to uncompressed if compression fails
              ws.send(jsonString);
            } else {
              // Send compressed message with compression flag
              const compressedMessage = {
                compressed: true,
                data: compressed.toString('base64')
              };
              ws.send(JSON.stringify(compressedMessage));
            }
          });
        } else {
          // Send uncompressed message
          ws.send(jsonString);
        }
        
        // Update last activity
        clientInfo.lastActivity = Date.now();
      }
    } catch (error) {
      this.logger.error(`Failed to send message to client: ${error.message}`);
    }
  }
  
  /**
   * Send error to client
   * @private
   */
  _sendError(ws, code, message) {
    this._sendToClient(ws, {
      type: 'ERROR',
      data: {
        code: code,
        message: message
      }
    });
  }
  
  /**
   * Handle Socket.IO authentication
   * @private
   */
  _handleSocketIOAuth(socket, data) {
    try {
      // Get client info
      const clientInfo = this.clients.get(socket);
      
      if (!clientInfo) {
        socket.emit('ERROR', {
          code: 'UNKNOWN_CLIENT',
          message: 'Unknown client'
        });
        return;
      }
      
      // Validate authentication data
      if (!data || !data.token) {
        socket.emit('ERROR', {
          code: 'INVALID_AUTH',
          message: 'Invalid authentication data'
        });
        return;
      }
      
      // Verify token (in a real implementation, this would verify against a token database)
      if (data.token === config.communication.mobileApp.authToken) {
        // Generate secure session token
        const sessionInfo = this.securityManager.generateSessionToken(clientInfo.id);
        
        // Update client info
        clientInfo.authenticated = true;
        clientInfo.sessionToken = sessionInfo.token;
        clientInfo.sessionExpiresAt = sessionInfo.expiresAt;
        
        // Send success response
        socket.emit('AUTH_SUCCESS', {
          sessionToken: sessionInfo.token,
          expiresAt: sessionInfo.expiresAt,
          expiresIn: Math.floor((sessionInfo.expiresAt - Date.now()) / 1000) // in seconds
        });
        
        this.logger.info(`Socket.IO client authenticated successfully: ${clientInfo.id}`);
      } else {
        socket.emit('ERROR', {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        });
        
        // Log security event
        if (config.security.logging.logFailedAuthAttempts) {
          this.logger.warn(`Authentication failed for Socket.IO client ${clientInfo.id}`);
        }
      }
    } catch (error) {
      this.logger.error(`Socket.IO authentication error: ${error.message}`);
      socket.emit('ERROR', {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      });
    }
  }
  
  /**
   * Handle Socket.IO command
   * @private
   */
  _handleSocketIOCommand(socket, command) {
    try {
      // Get client info
      const clientInfo = this.clients.get(socket);
      
      if (!clientInfo) {
        socket.emit('ERROR', {
          code: 'UNKNOWN_CLIENT',
          message: 'Unknown client'
        });
        return;
      }
      
      // Process command based on type
      switch (command.type) {
        case 'MOVE':
          // Validate data
          if (typeof command.data.speed !== 'number' || typeof command.data.direction !== 'number') {
            socket.emit('ERROR', {
              code: 'INVALID_PARAMETERS',
              message: 'Invalid speed or direction'
            });
            return;
          }
          
          // Add safety checks
          if (command.data.speed > config.motors.maxSpeed) {
            command.data.speed = config.motors.maxSpeed;
          }
          
          // Add command metadata
          const moveCommandData = {
            speed: command.data.speed,
            direction: command.data.direction,
            timestamp: Date.now(),
            clientId: clientInfo.id,
            commandId: command.id
          };
          
          // Publish move command event
          eventBus.publish('command.move', moveCommandData);
          eventBus.publish('command.move.redundant', moveCommandData);
          
          // Send success response
          socket.emit('COMMAND_ACCEPTED', {
            command: 'MOVE',
            timestamp: Date.now(),
            commandId: command.id
          });
          
          this.logger.info(`MOVE command: speed=${command.data.speed}, direction=${command.data.direction} from Socket.IO client ${clientInfo.id}`);
          break;
          
        case 'STOP':
          // Add command metadata
          const stopCommandData = {
            timestamp: Date.now(),
            clientId: clientInfo.id,
            commandId: command.id
          };
          
          // Publish stop command event
          eventBus.publish('command.stop', stopCommandData);
          eventBus.publish('command.stop.redundant', stopCommandData);
          
          // Send success response
          socket.emit('COMMAND_ACCEPTED', {
            command: 'STOP',
            timestamp: Date.now(),
            commandId: command.id
          });
          
          this.logger.info(`STOP command from Socket.IO client ${clientInfo.id}`);
          break;
          
        case 'EMERGENCY_STOP':
          // Add command metadata
          const emergencyStopCommandData = {
            reason: command.data.reason || 'User initiated emergency stop',
            source: 'mobileApp',
            timestamp: Date.now(),
            clientId: clientInfo.id,
            commandId: command.id
          };
          
          // Publish emergency stop command event with triple redundancy
          eventBus.publish('command.emergencyStop', emergencyStopCommandData);
          eventBus.publish('command.emergencyStop.redundant', emergencyStopCommandData);
          eventBus.publish('command.emergencyStop.critical', emergencyStopCommandData);
          
          // Send success response
          socket.emit('COMMAND_ACCEPTED', {
            command: 'EMERGENCY_STOP',
            timestamp: Date.now(),
            commandId: command.id
          });
          
          this.logger.critical(`EMERGENCY_STOP command from Socket.IO client ${clientInfo.id}: ${command.data.reason || 'User initiated'}`);
          break;
          
        case 'NAVIGATE':
          // Validate data
          if (!Array.isArray(command.data.waypoints) || command.data.waypoints.length === 0) {
            socket.emit('ERROR', {
              code: 'INVALID_PARAMETERS',
              message: 'Invalid waypoints'
            });
            return;
          }
          
          // Add command metadata
          const navigateCommandData = {
            waypoints: command.data.waypoints,
            timestamp: Date.now(),
            clientId: clientInfo.id,
            commandId: command.id
          };
          
          // Publish navigate command event
          eventBus.publish('command.navigate', navigateCommandData);
          eventBus.publish('command.navigate.redundant', navigateCommandData);
          
          // Send success response
          socket.emit('COMMAND_ACCEPTED', {
            command: 'NAVIGATE',
            timestamp: Date.now(),
            commandId: command.id
          });
          
          this.logger.info(`NAVIGATE command: ${command.data.waypoints.length} waypoints from Socket.IO client ${clientInfo.id}`);
          break;
          
        case 'SET_BOUNDARIES':
          // Validate data
          if (!Array.isArray(command.data.points) || command.data.points.length < 3) {
            socket.emit('ERROR', {
              code: 'INVALID_PARAMETERS',
              message: 'Invalid boundary points'
            });
            return;
          }
          
          // Add command metadata
          const setBoundariesCommandData = {
            points: command.data.points,
            timestamp: Date.now(),
            clientId: clientInfo.id,
            commandId: command.id
          };
          
          // Publish set boundaries command event
          eventBus.publish('command.setBoundaries', setBoundariesCommandData);
          eventBus.publish('command.setBoundaries.redundant', setBoundariesCommandData);
          
          // Send success response
          socket.emit('COMMAND_ACCEPTED', {
            command: 'SET_BOUNDARIES',
            timestamp: Date.now(),
            commandId: command.id
          });
          
          this.logger.info(`SET_BOUNDARIES command: ${command.data.points.length} points from Socket.IO client ${clientInfo.id}`);
          break;
          
        case 'GET_STATUS':
          // Request status from various systems
          Promise.all([
            this._getNavigationStatus(),
            this._getMotorStatus(),
            this._getSensorStatus(),
            this._getSafetyStatus()
          ])
          .then(([navigationStatus, motorStatus, sensorStatus, safetyStatus]) => {
            // Prepare status data
            const statusData = {
              navigation: navigationStatus,
              motor: motorStatus,
              sensor: sensorStatus,
              safety: safetyStatus,
              timestamp: Date.now(),
              commandId: command.id
            };
            
            // Send status response
            socket.emit('STATUS', statusData);
            
            // Log status request
            this.logger.debug(`Status request from Socket.IO client ${clientInfo.id}`);
          })
          .catch(error => {
            this.logger.error(`Failed to get status: ${error.message}`);
            socket.emit('ERROR', {
              code: 'INTERNAL_ERROR',
              message: 'Failed to get status'
            });
          });
          break;
          
        default:
          socket.emit('ERROR', {
            code: 'UNKNOWN_COMMAND',
            message: `Unknown command: ${command.type}`
          });
      }
    } catch (error) {
      this.logger.error(`Socket.IO command processing error: ${error.message}`);
      socket.emit('ERROR', {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
  
  /**
   * Broadcast event to all authenticated clients
   * Uses batching for better performance
   * @private
   */
  _broadcastEvent(type, data) {
    const message = {
      type: type,
      data: data,
      id: this._generateCommandId(),
      timestamp: Date.now()
    };
    
    // Add message to pending broadcasts for each client
    for (const [client, clientInfo] of this.clients.entries()) {
      if (clientInfo.authenticated) {
        if (!this.pendingBroadcasts.has(client)) {
          this.pendingBroadcasts.set(client, []);
        }
        
        this.pendingBroadcasts.get(client).push({
          message,
          protocol: clientInfo.protocol
        });
      }
    }
    
    // Schedule broadcast if not already scheduled
    if (!this.broadcastTimer) {
      this.broadcastTimer = setTimeout(() => {
        this._processPendingBroadcasts();
      }, 50); // 50ms batching window
    }
  }
  
  /**
   * Process all pending broadcasts
   * @private
   */
  _processPendingBroadcasts() {
    // Clear timer
    this.broadcastTimer = null;
    
    // Process each client's pending broadcasts
    for (const [client, messages] of this.pendingBroadcasts.entries()) {
      if (messages.length === 0) continue;
      
      const protocol = messages[0].protocol;
      
      if (protocol === 'websocket') {
        // For WebSocket, we can batch multiple messages into one
        if (messages.length === 1) {
          // Single message, send normally
          this._sendToClient(client, messages[0].message);
        } else {
          // Multiple messages, batch them
          const batchMessage = {
            type: 'BATCH',
            data: messages.map(m => m.message),
            id: this._generateCommandId(),
            timestamp: Date.now()
          };
          
          this._sendToClient(client, batchMessage);
        }
      } else if (protocol === 'socketio') {
        // For Socket.IO, send each message individually
        for (const { message } of messages) {
          client.emit(message.type, message.data);
        }
      }
    }
    
    // Clear pending broadcasts
    this.pendingBroadcasts.clear();
  }
  
  /**
   * Handle AUTH command
   * @private
   */
  _handleAuthCommand(ws, data, command) {
    try {
      // Get client info
      const clientInfo = this.clients.get(ws);
      
      if (!clientInfo) {
        this._sendError(ws, 'UNKNOWN_CLIENT', 'Unknown client');
        return;
      }
      
      // Validate client ID
      if (data.clientId !== clientInfo.id) {
        this._sendError(ws, 'INVALID_CLIENT_ID', 'Invalid client ID');
        
        // Log security event
        if (config.security.logging.logFailedAuthAttempts) {
          this.logger.warn(`Authentication attempt with mismatched client ID: ${data.clientId} vs ${clientInfo.id}`);
        }
        
        return;
      }
      
      // Generate secure session token
      const sessionInfo = this.securityManager.generateSessionToken(clientInfo.id);
      
      // Update client info
      clientInfo.authenticated = true;
      clientInfo.sessionToken = sessionInfo.token;
      clientInfo.sessionExpiresAt = sessionInfo.expiresAt;
      
      // Send success response
      this._sendToClient(ws, {
        type: 'AUTH_SUCCESS',
        data: {
          sessionToken: sessionInfo.token,
          expiresAt: sessionInfo.expiresAt,
          expiresIn: Math.floor((sessionInfo.expiresAt - Date.now()) / 1000) // in seconds
        }
      });
      
      this.logger.info(`Client authenticated successfully: ${clientInfo.id}`);
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      this._sendError(ws, 'AUTH_ERROR', 'Authentication failed');
    }
  }
  
  /**
   * Handle LOGOUT command
   * @private
   */
  _handleLogoutCommand(ws, data, command) {
    try {
      // Get client info
      const clientInfo = this.clients.get(ws);
      
      if (!clientInfo) {
        this._sendError(ws, 'UNKNOWN_CLIENT', 'Unknown client');
        return;
      }
      
      // Invalidate session token
      if (clientInfo.sessionToken) {
        this.securityManager.invalidateSessionToken(clientInfo.sessionToken);
      }
      
      // Update client info
      clientInfo.authenticated = false;
      clientInfo.sessionToken = null;
      clientInfo.sessionExpiresAt = null;
      
      // Send success response
      this._sendToClient(ws, {
        type: 'LOGOUT_SUCCESS',
        data: {
          message: 'Logged out successfully'
        }
      });
      
      this.logger.info(`Client logged out: ${clientInfo.id}`);
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      this._sendError(ws, 'LOGOUT_ERROR', 'Logout failed');
    }
  }
  
  /**
   * Verify and process command
   * @private
   */
  _verifyAndProcessCommand(ws, commandType, data, command, processor) {
    try {
      // Get client info
      const clientInfo = this.clients.get(ws);
      
      if (!clientInfo) {
        this._sendError(ws, 'UNKNOWN_CLIENT', 'Unknown client');
        return false;
      }
      
      // Verify command signature
      const clientCert = this.securityManager.certificates.client.trustedCerts.get(clientInfo.id);
      
      if (!clientCert) {
        this._sendError(ws, 'CERTIFICATE_NOT_FOUND', 'Client certificate not found');
        
        // Log security event
        if (config.security.logging.logCommandVerificationFailures) {
          this.logger.warn(`Command verification failed - certificate not found: ${clientInfo.id}`);
        }
        
        return false;
      }
      
      // Verify command
      const verificationResult = this.securityManager.verifyCommand(command, clientCert);
      
      if (!verificationResult.valid) {
        this._sendError(ws, 'COMMAND_VERIFICATION_FAILED', verificationResult.error);
        
        // Log security event
        if (config.security.logging.logCommandVerificationFailures) {
          this.logger.warn(`Command verification failed: ${verificationResult.error} for client ${clientInfo.id}`);
        }
        
        return false;
      }
      
      // Process command
      const result = processor(data, clientInfo);
      
      if (result.success) {
        // Send success response
        this._sendToClient(ws, {
          type: 'COMMAND_ACCEPTED',
          data: {
            command: commandType,
            timestamp: Date.now(),
            commandId: command.id
          }
        });
        
        return true;
      } else {
        // Send error response
        this._sendError(ws, result.errorCode || 'COMMAND_FAILED', result.errorMessage || 'Command failed');
        return false;
      }
    } catch (error) {
      this.logger.error(`Command processing error: ${error.message}`);
      this._sendError(ws, 'INTERNAL_ERROR', 'Internal server error');
      return false;
    }
  }
  
  /**
   * Handle MOVE command
   * @private
   */
  _handleMoveCommand(ws, data, command) {
    return this._verifyAndProcessCommand(ws, 'MOVE', data, command, (data, clientInfo) => {
      // Validate data
      if (typeof data.speed !== 'number' || typeof data.direction !== 'number') {
        return {
          success: false,
          errorCode: 'INVALID_PARAMETERS',
          errorMessage: 'Invalid speed or direction'
        };
      }
      
      // Add safety checks
      if (data.speed > config.motors.maxSpeed) {
        data.speed = config.motors.maxSpeed;
      }
      
      // Add command metadata
      const commandData = {
        speed: data.speed,
        direction: data.direction,
        timestamp: Date.now(),
        clientId: clientInfo.id,
        commandId: command.id
      };
      
      // Publish move command event with redundancy
      // Primary channel
      eventBus.publish('command.move', commandData);
      
      // Secondary channel for critical commands
      eventBus.publish('command.move.redundant', commandData);
      
      // Log command
      this.logger.info(`MOVE command: speed=${data.speed}, direction=${data.direction} from client ${clientInfo.id}`);
      
      return { success: true };
    });
  }
  
  /**
   * Handle NAVIGATE command
   * @private
   */
  _handleNavigateCommand(ws, data, command) {
    return this._verifyAndProcessCommand(ws, 'NAVIGATE', data, command, (data, clientInfo) => {
      // Validate data
      if (!Array.isArray(data.waypoints) || data.waypoints.length === 0) {
        return {
          success: false,
          errorCode: 'INVALID_PARAMETERS',
          errorMessage: 'Invalid waypoints'
        };
      }
      
      // Validate each waypoint
      for (const waypoint of data.waypoints) {
        if (typeof waypoint.x !== 'number' || typeof waypoint.y !== 'number') {
          return {
            success: false,
            errorCode: 'INVALID_PARAMETERS',
            errorMessage: 'Invalid waypoint coordinates'
          };
        }
      }
      
      // Add command metadata
      const commandData = {
        waypoints: data.waypoints,
        timestamp: Date.now(),
        clientId: clientInfo.id,
        commandId: command.id
      };
      
      // Publish navigate command event with redundancy
      // Primary channel
      eventBus.publish('command.navigate', commandData);
      
      // Secondary channel for critical commands
      eventBus.publish('command.navigate.redundant', commandData);
      
      // Log command
      this.logger.info(`NAVIGATE command: ${data.waypoints.length} waypoints from client ${clientInfo.id}`);
      
      return { success: true };
    });
  }
  
  /**
   * Handle STOP command
   * @private
   */
  _handleStopCommand(ws, data, command) {
    return this._verifyAndProcessCommand(ws, 'STOP', data, command, (data, clientInfo) => {
      // Add command metadata
      const commandData = {
        timestamp: Date.now(),
        clientId: clientInfo.id,
        commandId: command.id
      };
      
      // Publish stop command event with redundancy
      // Primary channel
      eventBus.publish('command.stop', commandData);
      
      // Secondary channel for critical commands
      eventBus.publish('command.stop.redundant', commandData);
      
      // Log command
      this.logger.info(`STOP command from client ${clientInfo.id}`);
      
      return { success: true };
    });
  }
  
  /**
   * Handle EMERGENCY_STOP command
   * @private
   */
  _handleEmergencyStopCommand(ws, data, command) {
    return this._verifyAndProcessCommand(ws, 'EMERGENCY_STOP', data, command, (data, clientInfo) => {
      // Add command metadata
      const commandData = {
        reason: data.reason || 'User initiated emergency stop',
        source: 'mobileApp',
        timestamp: Date.now(),
        clientId: clientInfo.id,
        commandId: command.id
      };
      
      // Publish emergency stop command event with triple redundancy for safety-critical commands
      // Primary channel
      eventBus.publish('command.emergencyStop', commandData);
      
      // Secondary channel
      eventBus.publish('command.emergencyStop.redundant', commandData);
      
      // Tertiary channel
      eventBus.publish('command.emergencyStop.critical', commandData);
      
      // Log critical command
      this.logger.critical(`EMERGENCY_STOP command from client ${clientInfo.id}: ${data.reason || 'User initiated'}`);
      
      return { success: true };
    });
  }
  
  /**
   * Handle GET_STATUS command
   * @private
   */
  _handleGetStatusCommand(ws, data, command) {
    return this._verifyAndProcessCommand(ws, 'GET_STATUS', data, command, (data, clientInfo) => {
      // Request status from various systems
      Promise.all([
        this._getNavigationStatus(),
        this._getMotorStatus(),
        this._getSensorStatus(),
        this._getSafetyStatus()
      ])
      .then(([navigationStatus, motorStatus, sensorStatus, safetyStatus]) => {
        // Prepare status data
        const statusData = {
          navigation: navigationStatus,
          motor: motorStatus,
          sensor: sensorStatus,
          safety: safetyStatus,
          timestamp: Date.now(),
          commandId: command.id
        };
        
        // Send status response
        this._sendToClient(ws, {
          type: 'STATUS',
          data: statusData
        });
        
        // Log status request
        this.logger.debug(`Status request from client ${clientInfo.id}`);
      })
      .catch(error => {
        this.logger.error(`Failed to get status: ${error.message}`);
        this._sendError(ws, 'INTERNAL_ERROR', 'Failed to get status');
      });
      
      // Return success immediately, actual status will be sent asynchronously
      return { success: true };
    });
  }
  
  /**
   * Get navigation status with caching
   * @private
   */
  _getNavigationStatus() {
    return this._getCachedStatus('navigation', 'navigation.getStatus');
  }
  
  /**
   * Get motor status with caching
   * @private
   */
  _getMotorStatus() {
    return this._getCachedStatus('motor', 'motor.getStatus');
  }
  
  /**
   * Get sensor status with caching
   * @private
   */
  _getSensorStatus() {
    return this._getCachedStatus('sensor', 'sensor.getStatus');
  }
  
  /**
   * Get safety status with caching
   * @private
   */
  _getSafetyStatus() {
    return this._getCachedStatus('safety', 'safety.getStatus');
  }
  
  /**
   * Get status with caching to reduce redundant requests
   * @private
   */
  _getCachedStatus(type, requestType) {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const cache = this.statusCache[type];
      
      // Return cached data if it's fresh enough
      if (cache.data && (now - cache.timestamp < CACHE_TTL)) {
        return resolve(cache.data);
      }
      
      // Request fresh data
      eventBus.request(requestType, {}, 1000)
        .then(status => {
          // Update cache
          this.statusCache[type] = {
            data: status,
            timestamp: now
          };
          resolve(status);
        })
        .catch(error => {
          this.logger.error(`Failed to get ${type} status: ${error.message}`);
          resolve(null);
        });
    });
  }
  
  /**
   * Handle SET_BOUNDARIES command
   * @private
   */
  _handleSetBoundariesCommand(ws, data, command) {
    return this._verifyAndProcessCommand(ws, 'SET_BOUNDARIES', data, command, (data, clientInfo) => {
      // Validate data
      if (!Array.isArray(data.points) || data.points.length < 3) {
        return {
          success: false,
          errorCode: 'INVALID_PARAMETERS',
          errorMessage: 'Invalid boundary points'
        };
      }
      
      // Validate each point
      for (const point of data.points) {
        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
          return {
            success: false,
            errorCode: 'INVALID_PARAMETERS',
            errorMessage: 'Invalid boundary point coordinates'
          };
        }
      }
      
      // Add command metadata
      const commandData = {
        points: data.points,
        timestamp: Date.now(),
        clientId: clientInfo.id,
        commandId: command.id
      };
      
      // Publish set boundaries command event with redundancy
      // Primary channel
      eventBus.publish('command.setBoundaries', commandData);
      
      // Secondary channel for critical commands
      eventBus.publish('command.setBoundaries.redundant', commandData);
      
      // Log command
      this.logger.info(`SET_BOUNDARIES command: ${data.points.length} points from client ${clientInfo.id}`);
      
      return { success: true };
    });
  }
  
  /**
   * Shutdown the mobile app interface
   */
  async shutdown() {
    this.logger.info('Shutting down mobile app interface...');
    
    // Unsubscribe from events
    this.eventSubscriptions.forEach(subscription => {
      eventBus.unsubscribe(subscription);
    });
    
    // Clear session cleanup interval
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
      this.sessionCleanupInterval = null;
    }
    
    // Clear broadcast timer if active
    if (this.broadcastTimer) {
      clearTimeout(this.broadcastTimer);
      this.broadcastTimer = null;
    }
    
    // Process any pending broadcasts before shutdown
    if (this.pendingBroadcasts.size > 0) {
      try {
        this._processPendingBroadcasts();
      } catch (error) {
        this.logger.error(`Error processing pending broadcasts during shutdown: ${error.message}`);
      }
    }
    
    // Close all client connections
    for (const [ws, clientInfo] of this.clients.entries()) {
      try {
        // Invalidate session token if authenticated
        if (clientInfo.authenticated && clientInfo.sessionToken) {
          this.securityManager.invalidateSessionToken(clientInfo.sessionToken);
        }
        
        // Close connection based on protocol
        if (clientInfo.protocol === 'websocket') {
          ws.close(1001, 'Server shutting down');
        } else if (clientInfo.protocol === 'socketio') {
          ws.disconnect(true);
        }
      } catch (error) {
        this.logger.error(`Error closing client connection: ${error.message}`);
      }
    }
    
    // Clear clients map and caches
    this.clients.clear();
    this.pendingBroadcasts.clear();
    
    // Clear status cache
    Object.keys(this.statusCache).forEach(key => {
      this.statusCache[key] = { data: null, timestamp: 0 };
    });
    
    // Close WebSocket server
    if (this.wss) {
      await new Promise((resolve, reject) => {
        this.wss.close(err => {
          if (err) {
            this.logger.error(`Failed to close WebSocket server: ${err.message}`);
            reject(err);
          } else {
            this.logger.info('WebSocket server closed');
            resolve();
          }
        });
      });
    }
    
    // Close Socket.IO server
    if (this.io) {
      await new Promise((resolve) => {
        this.io.close(() => {
          this.logger.info('Socket.IO server closed');
          resolve();
        });
      });
    }
    
    // Close HTTPS server
    if (this.httpsServer) {
      await new Promise((resolve, reject) => {
        this.httpsServer.close(err => {
          if (err) {
            this.logger.error(`Failed to close HTTPS server: ${err.message}`);
            reject(err);
          } else {
            this.logger.info('HTTPS server closed');
            resolve();
          }
        });
      });
    }
    
    this.isConnected = false;
    
    this.logger.info('Mobile app interface shutdown complete');
    return true;
  }
}

module.exports = MobileAppInterface;