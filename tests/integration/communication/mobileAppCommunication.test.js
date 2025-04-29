/**
 * Integration test for communication between tractor control system and mobile app
 * Tests both WebSocket and Socket.IO interfaces
 */

const WebSocket = require('ws');
const { io } = require('socket.io-client');
const https = require('https');
const fs = require('fs');
const path = require('path');
const MobileAppInterface = require('../../../src/communication/mobileAppInterface');
const SecurityManager = require('../../../src/utils/security');
const eventBus = require('../../../src/utils/eventBus');
const config = require('../../../src/config');

// Test configuration
const TEST_PORT = 8081; // Use a different port for testing
const TEST_HOST = 'localhost';
const TEST_URL = `wss://${TEST_HOST}:${TEST_PORT}`;

// Override config for testing
config.communication.mobileApp.port = TEST_PORT;

// Test certificates
const CA_CERT_PATH = path.resolve(__dirname, '../../../certs/ca.crt');
const CLIENT_CERT_PATH = path.resolve(__dirname, '../../../certs/clients/client1.crt');
const CLIENT_KEY_PATH = path.resolve(__dirname, '../../../certs/clients/client1.key');

describe('Mobile App Communication Integration Tests', () => {
  let mobileAppInterface;
  let securityManager;
  let wsClient;
  let socketIoClient;
  
  // Load certificates
  const caCert = fs.readFileSync(CA_CERT_PATH);
  const clientCert = fs.readFileSync(CLIENT_CERT_PATH);
  const clientKey = fs.readFileSync(CLIENT_KEY_PATH);
  
  beforeAll(async () => {
    // Initialize security manager
    securityManager = new SecurityManager();
    await securityManager.initialize();
    
    // Initialize mobile app interface
    mobileAppInterface = new MobileAppInterface();
    await mobileAppInterface.initialize();
    
    // Set up event handlers for testing
    eventBus.subscribe('command.move', (data) => {
      // Simulate motor controller processing the command
      setTimeout(() => {
        eventBus.publish('motor.status.updated', {
          speed: data.speed,
          direction: data.direction,
          timestamp: Date.now()
        });
      }, 100);
    });
    
    eventBus.subscribe('command.stop', () => {
      // Simulate motor controller stopping
      setTimeout(() => {
        eventBus.publish('motor.status.updated', {
          speed: 0,
          direction: 0,
          timestamp: Date.now()
        });
      }, 100);
    });
    
    // Set up request handlers
    eventBus.registerRequestHandler('navigation.getStatus', () => {
      return {
        position: { x: 10, y: 20, z: 0 },
        orientation: { roll: 0, pitch: 0, yaw: 45 },
        speed: 0.5,
        timestamp: Date.now()
      };
    });
    
    eventBus.registerRequestHandler('motor.getStatus', () => {
      return {
        speed: 0.5,
        direction: 0,
        temperature: 35,
        current: 2.5,
        timestamp: Date.now()
      };
    });
    
    eventBus.registerRequestHandler('sensor.getStatus', () => {
      return {
        gps: { connected: true, satellites: 8 },
        imu: { connected: true },
        camera: { connected: true },
        lidar: { connected: true },
        timestamp: Date.now()
      };
    });
    
    eventBus.registerRequestHandler('safety.getStatus', () => {
      return {
        emergencyStopActive: false,
        safetySystemsActive: true,
        warnings: [],
        timestamp: Date.now()
      };
    });
  });
  
  afterAll(async () => {
    // Clean up
    if (wsClient) {
      wsClient.close();
    }
    
    if (socketIoClient) {
      socketIoClient.close();
    }
    
    await mobileAppInterface.shutdown();
  });
  
  describe('WebSocket Interface', () => {
    beforeEach(async () => {
      // Create WebSocket client with certificates
      const httpsAgent = new https.Agent({
        ca: caCert,
        cert: clientCert,
        key: clientKey,
        rejectUnauthorized: true
      });
      
      return new Promise((resolve) => {
        wsClient = new WebSocket(TEST_URL, {
          agent: httpsAgent,
          rejectUnauthorized: true,
          ca: caCert,
          cert: clientCert,
          key: clientKey
        });
        
        wsClient.on('open', () => {
          resolve();
        });
        
        wsClient.on('error', (error) => {
          console.error('WebSocket client error:', error);
          resolve();
        });
      });
    });
    
    afterEach(() => {
      if (wsClient) {
        wsClient.close();
        wsClient = null;
      }
    });
    
    test('should receive welcome message', (done) => {
      wsClient.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        expect(parsedMessage.type).toBe('WELCOME');
        expect(parsedMessage.data.requiresAuth).toBe(true);
        done();
      });
    });
    
    test('should authenticate successfully', (done) => {
      // Set up message handler
      wsClient.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'WELCOME') {
          // Send authentication message
          wsClient.send(JSON.stringify({
            type: 'AUTH',
            data: {
              clientId: parsedMessage.data.clientId
            }
          }));
        } else if (parsedMessage.type === 'AUTH_SUCCESS') {
          expect(parsedMessage.data.sessionToken).toBeDefined();
          expect(parsedMessage.data.expiresAt).toBeDefined();
          done();
        }
      });
    });
    
    test('should send and receive commands', (done) => {
      let authenticated = false;
      let commandSent = false;
      
      // Set up message handler
      wsClient.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'WELCOME') {
          // Send authentication message
          wsClient.send(JSON.stringify({
            type: 'AUTH',
            data: {
              clientId: parsedMessage.data.clientId
            }
          }));
        } else if (parsedMessage.type === 'AUTH_SUCCESS') {
          authenticated = true;
          
          // Send MOVE command
          wsClient.send(JSON.stringify({
            type: 'MOVE',
            data: {
              speed: 0.5,
              direction: 0
            },
            id: 'test-command-1',
            timestamp: Date.now()
          }));
          
          commandSent = true;
        } else if (parsedMessage.type === 'COMMAND_ACCEPTED' && commandSent) {
          expect(parsedMessage.data.command).toBe('MOVE');
        } else if (parsedMessage.type === 'MOTOR_STATUS' && authenticated && commandSent) {
          expect(parsedMessage.data.speed).toBe(0.5);
          expect(parsedMessage.data.direction).toBe(0);
          done();
        }
      });
    });
    
    test('should get status information', (done) => {
      let authenticated = false;
      
      // Set up message handler
      wsClient.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'WELCOME') {
          // Send authentication message
          wsClient.send(JSON.stringify({
            type: 'AUTH',
            data: {
              clientId: parsedMessage.data.clientId
            }
          }));
        } else if (parsedMessage.type === 'AUTH_SUCCESS') {
          authenticated = true;
          
          // Send GET_STATUS command
          wsClient.send(JSON.stringify({
            type: 'GET_STATUS',
            data: {},
            id: 'test-status-1',
            timestamp: Date.now()
          }));
        } else if (parsedMessage.type === 'STATUS' && authenticated) {
          expect(parsedMessage.data.navigation).toBeDefined();
          expect(parsedMessage.data.motor).toBeDefined();
          expect(parsedMessage.data.sensor).toBeDefined();
          expect(parsedMessage.data.safety).toBeDefined();
          done();
        }
      });
    });
  });
  
  describe('Socket.IO Interface', () => {
    beforeEach(async () => {
      // Create Socket.IO client
      socketIoClient = io(TEST_URL, {
        rejectUnauthorized: true,
        ca: caCert,
        cert: clientCert,
        key: clientKey,
        auth: {
          token: config.communication.mobileApp.authToken
        }
      });
      
      return new Promise((resolve) => {
        socketIoClient.on('connect', () => {
          resolve();
        });
        
        socketIoClient.on('connect_error', (error) => {
          console.error('Socket.IO client error:', error);
          resolve();
        });
      });
    });
    
    afterEach(() => {
      if (socketIoClient) {
        socketIoClient.close();
        socketIoClient = null;
      }
    });
    
    test('should receive welcome message', (done) => {
      socketIoClient.on('WELCOME', (data) => {
        expect(data.requiresAuth).toBe(true);
        done();
      });
    });
    
    test('should authenticate successfully', (done) => {
      socketIoClient.on('WELCOME', () => {
        // Send authentication message
        socketIoClient.emit('AUTH', {
          token: config.communication.mobileApp.authToken
        });
      });
      
      socketIoClient.on('AUTH_SUCCESS', (data) => {
        expect(data.sessionToken).toBeDefined();
        expect(data.expiresAt).toBeDefined();
        done();
      });
    });
    
    test('should send and receive commands', (done) => {
      let authenticated = false;
      
      socketIoClient.on('WELCOME', () => {
        // Send authentication message
        socketIoClient.emit('AUTH', {
          token: config.communication.mobileApp.authToken
        });
      });
      
      socketIoClient.on('AUTH_SUCCESS', () => {
        authenticated = true;
        
        // Send MOVE command
        socketIoClient.emit('MOVE', {
          speed: 0.5,
          direction: 0
        });
      });
      
      socketIoClient.on('COMMAND_ACCEPTED', (data) => {
        expect(data.command).toBe('MOVE');
      });
      
      socketIoClient.on('MOTOR_STATUS', (data) => {
        if (authenticated) {
          expect(data.speed).toBe(0.5);
          expect(data.direction).toBe(0);
          done();
        }
      });
    });
    
    test('should get status information', (done) => {
      socketIoClient.on('WELCOME', () => {
        // Send authentication message
        socketIoClient.emit('AUTH', {
          token: config.communication.mobileApp.authToken
        });
      });
      
      socketIoClient.on('AUTH_SUCCESS', () => {
        // Send GET_STATUS command
        socketIoClient.emit('GET_STATUS', {});
      });
      
      socketIoClient.on('STATUS', (data) => {
        expect(data.navigation).toBeDefined();
        expect(data.motor).toBeDefined();
        expect(data.sensor).toBeDefined();
        expect(data.safety).toBeDefined();
        done();
      });
    });
  });
});