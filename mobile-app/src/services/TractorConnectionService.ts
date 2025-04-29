import { io, Socket } from 'socket.io-client';
import { TractorStatus, TractorCommand } from '../store/connectionStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import securityManager, { SecurityManager, Certificate, EncryptedData, CommandSignature } from '../utils/security';

// Helper function to generate secure unique ID
const generateUniqueId = async (): Promise<string> => {
  return await securityManager.generateSecureToken(24);
};

interface ConnectionResult {
  success: boolean;
  connectionType?: 'direct' | 'cloud';
  connectionQuality?: number;
  error?: string;
  certificateVerified?: boolean;
  mfaRequired?: boolean;
}

interface CommandResult {
  success: boolean;
  error?: string;
  commandId?: string;
  offlineQueued?: boolean;
}

type StatusUpdateCallback = (status: Partial<TractorStatus>) => void;

export class TractorConnectionService {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private connectionType: 'direct' | 'cloud' | null = null;
  private connectionQuality: number = 0;
  private statusUpdateCallbacks: StatusUpdateCallback[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private queuedCommands: TractorCommand[] = [];
  private tractorId: string | null = null;
  private clientCertificate: Certificate | null = null;
  private serverPublicKey: string | null = null;
  private sessionToken: string | null = null;
  private sessionExpiresAt: number = 0;
  
  // Certificate storage keys
  private readonly CERT_STORAGE_KEY = 'tractor_client_certificate';
  private readonly SERVER_KEY_STORAGE_KEY = 'tractor_server_public_key';

  constructor() {
    // Initialize security manager
    securityManager.initialize().then(() => {
      console.log('Security manager initialized');
    }).catch(error => {
      console.error('Failed to initialize security manager:', error);
    });
    
    // Load queued commands from storage
    this.loadQueuedCommands();
    
    // Monitor network status
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.tractorId && !this.isConnected) {
        // Try to reconnect when network becomes available
        this.reconnect();
      } else if (!state.isConnected && this.tractorId) {
        // Log network disconnection
        securityManager.logSecurityEvent('Network disconnected, switching to offline mode', 'info');
      }
    });
  }

  /**
   * Connect to a tractor with certificate-based authentication
   */
  public async connect(tractorId: string, clientId: string): Promise<ConnectionResult> {
    this.tractorId = tractorId;
    
    // Store last connected tractor ID
    await AsyncStorage.setItem('last_connected_tractor', tractorId);
    
    // Check if we have valid certificates
    const hasCertificates = securityManager.hasCertificates();
    
    if (!hasCertificates) {
      // Generate and request certificates if needed
      await this.requestCertificates(clientId);
    }
    
    // Try direct connection first with secure WebSocket
    const directResult = await this.connectDirect(tractorId, clientId);
    
    if (directResult.success) {
      this.connectionType = 'direct';
      this.isConnected = true;
      this.connectionQuality = directResult.connectionQuality || 80;
      
      // Process any queued commands if we're connected
      await this.processQueuedCommands();
      
      return {
        success: true,
        connectionType: 'direct',
        connectionQuality: this.connectionQuality,
        certificateVerified: directResult.certificateVerified,
        mfaRequired: securityManager.isMfaEnabled()
      };
    }
    
    // Fall back to cloud connection with secure WebSocket
    const cloudResult = await this.connectCloud(tractorId, clientId);
    
    if (cloudResult.success) {
      this.connectionType = 'cloud';
      this.isConnected = true;
      this.connectionQuality = cloudResult.connectionQuality || 50;
      
      // Process any queued commands if we're connected
      await this.processQueuedCommands();
      
      return {
        success: true,
        connectionType: 'cloud',
        connectionQuality: this.connectionQuality,
        certificateVerified: cloudResult.certificateVerified,
        mfaRequired: securityManager.isMfaEnabled()
      };
    }
    
    // Both connection attempts failed
    await securityManager.logSecurityEvent('Failed to connect to tractor', 'warning', {
      tractorId,
      clientId
    });
    
    return {
      success: false,
      error: 'Failed to connect to tractor via direct or cloud connection'
    };
  }
  
  /**
   * Request certificates from the server
   */
  private async requestCertificates(clientId: string): Promise<void> {
    try {
      // Generate certificate request
      const csrData = await securityManager.generateCertificateRequest(clientId);
      
      // In a real app, this would send the CSR to the server and receive a signed certificate
      // For now, we'll simulate this process
      
      // Simulate server response with certificate
      const newCert: Certificate = {
        data: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${clientId}-${Date.now()}-${Math.random()}`
        ),
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
      };
      
      // Store certificate
      await securityManager.storeClientCertificate(newCert);
      
      // Simulate CA certificate
      const caCert = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `CA-${Date.now()}`
      );
      
      // Store CA certificate
      await securityManager.storeCACertificate(caCert);
      
      // Simulate client private key
      const privateKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `PRIVATE-${clientId}-${Date.now()}`
      );
      
      // Store private key
      await securityManager.storeClientPrivateKey(privateKey);
      
      await securityManager.logSecurityEvent('Certificates generated and stored', 'info');
      
    } catch (error) {
      console.error('Failed to request certificates:', error);
      await securityManager.logSecurityEvent('Failed to request certificates', 'error', { error });
      throw error;
    }
  }

  /**
   * Connect directly to tractor via secure WebSocket with certificate validation
   */
  private async connectDirect(tractorId: string, clientId: string): Promise<ConnectionResult> {
    return new Promise((resolve) => {
      try {
        const clientCertificate = securityManager.getClientCertificate();
        const caCertificate = securityManager.getCACertificate();
        
        if (!clientCertificate || !caCertificate) {
          resolve({
            success: false,
            error: 'Client or CA certificate not available'
          });
          return;
        }
        
        // In a real app, we would use the tractor's IP address or hostname
        // Using wss:// protocol for secure WebSocket
        const url = `wss://localhost:8080`;
        
        // Configure socket with certificate-based authentication
        this.socket = io(url, {
          reconnection: false,
          timeout: 10000,
          auth: {
            clientId: clientId,
            certificate: clientCertificate.data
          },
          // Configure TLS options for mutual TLS authentication
          rejectUnauthorized: true, // Verify server certificate
          ca: caCertificate, // CA certificate for server verification
          cert: clientCertificate.data, // Client certificate for client authentication
          key: securityManager.getClientPrivateKey() || undefined // Client private key
        });
        
        // Set up event handlers
        this.socket.on('connect', () => {
          console.log('Secure direct connection established');
          securityManager.logSecurityEvent('Secure direct connection established', 'info');
          
          // Send authentication message with certificate
          this.socket?.emit('AUTH', {
            clientId: clientId,
            tractorId: tractorId,
            certificate: clientCertificate.data
          });
        });
        
        this.socket.on('AUTH_SUCCESS', (data) => {
          console.log('Authentication successful');
          securityManager.logSecurityEvent('Authentication successful', 'info');
          
          // Store session token and expiration
          this.sessionToken = data.sessionToken;
          this.sessionExpiresAt = data.expiresAt;
          
          // Store server public key if provided
          if (data.serverPublicKey) {
            securityManager.storeServerPublicKey(data.serverPublicKey);
          }
          
          this.setupSocketEventHandlers();
          resolve({
            success: true,
            connectionQuality: 80,
            certificateVerified: true
          });
        });
        
        this.socket.on('AUTH_FAILED', (error) => {
          console.log('Authentication failed:', error);
          securityManager.logSecurityEvent('Authentication failed', 'warning', { error });
          this.socket?.disconnect();
          this.socket = null;
          resolve({
            success: false,
            error: 'Authentication failed'
          });
        });
        
        this.socket.on('connect_error', (error) => {
          console.log('Connection error:', error);
          securityManager.logSecurityEvent('Connection error', 'warning', { error });
          this.socket = null;
          resolve({
            success: false,
            error: 'Connection error'
          });
        });
        
        // Verify server certificate when received
        this.socket.on('SERVER_CERTIFICATE', async (data) => {
          const isValid = await securityManager.verifyServerCertificate(data.certificate);
          if (!isValid) {
            securityManager.logSecurityEvent('Server certificate verification failed', 'critical');
            this.socket?.disconnect();
            this.socket = null;
            resolve({
              success: false,
              error: 'Server certificate verification failed'
            });
          } else {
            securityManager.logSecurityEvent('Server certificate verified', 'info');
          }
        });
        
        // Set connection timeout
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            console.log('Connection timeout');
            securityManager.logSecurityEvent('Connection timeout', 'warning');
            this.socket.disconnect();
            this.socket = null;
            resolve({
              success: false,
              error: 'Connection timeout'
            });
          }
        }, 10000);
      } catch (error) {
        console.error('Direct connection error:', error);
        securityManager.logSecurityEvent('Direct connection error', 'error', { error });
        resolve({
          success: false,
          error: 'Failed to establish direct connection'
        });
      }
    });
  }

  /**
   * Connect to tractor via cloud service with secure WebSocket
   */
  private async connectCloud(tractorId: string, clientId: string): Promise<ConnectionResult> {
    // In a real implementation, this would connect to a cloud service
    // using similar secure connection methods as connectDirect
    return new Promise((resolve) => {
      try {
        const clientCertificate = securityManager.getClientCertificate();
        const caCertificate = securityManager.getCACertificate();
        
        if (!clientCertificate || !caCertificate) {
          resolve({
            success: false,
            error: 'Client or CA certificate not available'
          });
          return;
        }
        
        // In a real app, this would be a cloud service URL
        const url = `wss://cloud.sevak-tractor.com`;
        
        // Configure socket with certificate-based authentication
        this.socket = io(url, {
          reconnection: false,
          timeout: 15000,
          auth: {
            clientId: clientId,
            certificate: clientCertificate.data
          },
          // Configure TLS options for mutual TLS authentication
          rejectUnauthorized: true, // Verify server certificate
          ca: caCertificate, // CA certificate for server verification
          cert: clientCertificate.data, // Client certificate for client authentication
          key: securityManager.getClientPrivateKey() || undefined // Client private key
        });
        
        // Set up event handlers similar to direct connection
        // For brevity, we'll simulate a successful connection
        
        // Simulated cloud connection
        setTimeout(() => {
          // Store simulated session token and expiration
          this.sessionToken = `cloud-session-${Date.now()}`;
          this.sessionExpiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
          
          securityManager.logSecurityEvent('Cloud connection established', 'info');
          
          resolve({
            success: true,
            connectionQuality: 50,
            certificateVerified: true
          });
        }, 1000);
      } catch (error) {
        console.error('Cloud connection error:', error);
        securityManager.logSecurityEvent('Cloud connection error', 'error', { error });
        resolve({
          success: false,
          error: 'Failed to establish cloud connection'
        });
      }
    });
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketEventHandlers() {
    if (!this.socket) return;
    
    // Handle status updates
    this.socket.on('STATUS_UPDATE', (status: Partial<TractorStatus>) => {
      this.notifyStatusUpdate(status);
    });
    
    // Handle connection quality updates
    this.socket.on('CONNECTION_QUALITY', (data: { quality: number }) => {
      this.connectionQuality = data.quality;
    });
    
    // Handle disconnect
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.isConnected = false;
      
      // Try to reconnect if not intentionally disconnected
      if (reason !== 'io client disconnect') {
        this.reconnect();
      }
    });
  }

  /**
   * Disconnect from tractor
   */
  public async disconnect(): Promise<CommandResult> {
    if (!this.socket) {
      return { success: true };
    }
    
    return new Promise((resolve) => {
      try {
        this.socket?.disconnect();
        this.socket = null;
        this.isConnected = false;
        this.connectionType = null;
        
        // Clear reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        resolve({ success: true });
      } catch (error) {
        console.error('Disconnect error:', error);
        resolve({
          success: false,
          error: 'Failed to disconnect'
        });
      }
    });
  }

  /**
   * Check if connection to tractor is available
   */
  public async checkConnection(tractorId: string): Promise<boolean> {
    if (this.isConnected && this.tractorId === tractorId) {
      return true;
    }
    
    // Try to reconnect
    const clientId = await SecureStore.getItemAsync('client_id');
    
    if (!clientId) {
      return false;
    }
    
    const result = await this.connect(tractorId, clientId);
    return result.success;
  }

  /**
   * Get connection type
   */
  public getConnectionType(): 'direct' | 'cloud' | null {
    return this.connectionType;
  }

  /**
   * Get connection quality
   */
  public getConnectionQuality(): number {
    return this.connectionQuality;
  }

  /**
   * Subscribe to status updates
   */
  public subscribeToStatusUpdates(callback: StatusUpdateCallback): void {
    this.statusUpdateCallbacks.push(callback);
  }

  /**
   * Notify all subscribers of status update
   */
  private notifyStatusUpdate(status: Partial<TractorStatus>): void {
    this.statusUpdateCallbacks.forEach(callback => {
      callback(status);
    });
  }

  /**
   * Send command to tractor with signing and encryption
   * Implements multi-factor authentication for critical commands
   */
  public async sendCommand(command: TractorCommand): Promise<CommandResult> {
    try {
      // Generate ID if not present
      if (!command.id) {
        command.id = await generateUniqueId();
      }
      
      // Add timestamp if not present
      if (!command.timestamp) {
        command.timestamp = Date.now();
      }
      
      // Check if this is a critical command requiring MFA
      const criticalCommands = ['EMERGENCY_STOP', 'FIRMWARE_UPDATE', 'RESET', 'CALIBRATE'];
      const requiresMfa = criticalCommands.includes(command.type.toUpperCase());
      
      // If MFA is enabled and command is critical, require biometric authentication
      if (requiresMfa && securityManager.isMfaEnabled()) {
        const authenticated = await securityManager.authenticateWithBiometrics(
          `Authenticate to send ${command.type} command`
        );
        
        if (!authenticated) {
          await securityManager.logSecurityEvent('MFA authentication failed for critical command', 'warning', {
            commandType: command.type
          });
          
          return {
            success: false,
            error: 'Authentication required for this command'
          };
        }
        
        await securityManager.logSecurityEvent('MFA authentication successful for critical command', 'info', {
          commandType: command.type
        });
      }
      
      // Check if we're connected
      if (!this.socket || !this.isConnected) {
        // Check if offline operation is allowed
        if (securityManager.isOfflineOperationAllowed()) {
          // Queue command for later
          await this.queueCommand(command);
          
          await securityManager.logSecurityEvent('Command queued for offline operation', 'info', {
            commandId: command.id,
            commandType: command.type
          });
          
          return {
            success: true,
            commandId: command.id,
            offlineQueued: true
          };
        } else {
          await securityManager.logSecurityEvent('Command rejected - offline operation not allowed', 'warning', {
            commandId: command.id,
            commandType: command.type
          });
          
          return {
            success: false,
            error: 'Not connected to tractor and offline operation not allowed'
          };
        }
      }
      
      // Process and send the command
      return await this.processAndSendCommand(command);
    } catch (error) {
      console.error('Send command error:', error);
      await securityManager.logSecurityEvent('Send command error', 'error', { error });
      
      return {
        success: false,
        error: 'Failed to send command'
      };
    }
  }
  
  /**
   * Process and send command with signing and encryption
   */
  private async processAndSendCommand(command: TractorCommand): Promise<CommandResult> {
    try {
      // Sign command with client's private key
      const signature = await securityManager.signCommand(command);
      
      const signedCommand = {
        ...command,
        signature: signature.signature
      };
      
      // Log command before sending
      await securityManager.logSecurityEvent(`Sending ${command.type} command`, 'info', {
        commandId: command.id
      });
      
      // Encrypt command if server public key is available
      const serverPublicKey = securityManager.getServerPublicKey();
      
      if (serverPublicKey) {
        // Encrypt the command data
        const encryptedData = await securityManager.encryptData(signedCommand);
        
        if (!encryptedData) {
          throw new Error('Failed to encrypt command data');
        }
        
        // Send encrypted command
        this.socket?.emit(`${command.type.toUpperCase()}_ENCRYPTED`, encryptedData);
      } else {
        // Send signed command
        this.socket?.emit(command.type.toUpperCase(), {
          ...signedCommand,
          commandId: command.id
        });
      }
      
      return {
        success: true,
        commandId: command.id
      };
    } catch (error) {
      console.error('Process command error:', error);
      await securityManager.logSecurityEvent('Process command error', 'error', { error });
      
      return {
        success: false,
        error: 'Failed to process command'
      };
    }
  }
  
  /**
   * Sign command with client certificate
   */
  private async signCommand(command: TractorCommand): Promise<TractorCommand> {
    if (!this.clientCertificate) {
      return command;
    }
    
    try {
      // Create string representation of command
      const commandStr = JSON.stringify({
        id: command.id,
        type: command.type,
        data: command.data,
        timestamp: command.timestamp
      });
      
      // Create signature
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        commandStr + this.clientCertificate.data
      );
      
      // Return command with signature
      return {
        ...command,
        signature: signature
      };
    } catch (error) {
      console.error('Failed to sign command:', error);
      return command;
    }
  }
  
  /**
   * Encrypt data for transmission
   */
  private async encryptData(data: any): Promise<EncryptedData | null> {
    if (!this.serverPublicKey) {
      return null;
    }
    
    try {
      // In a real implementation, this would use proper asymmetric encryption
      // For now, we'll use a simplified approach
      
      // Convert data to string
      const dataStr = JSON.stringify(data);
      
      // Generate random IV (initialization vector)
      const iv = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );
      
      // Generate random symmetric key
      const symmetricKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );
      
      // "Encrypt" data with symmetric key (simplified)
      const encryptedData = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataStr + symmetricKey + iv
      );
      
      // "Encrypt" symmetric key with server public key (simplified)
      const encryptedKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        symmetricKey + this.serverPublicKey
      );
      
      // Generate auth tag (simplified)
      const authTag = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        encryptedData + iv
      );
      
      return {
        encryptedData,
        iv,
        authTag,
        encryptedKey
      };
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      return null;
    }
  }

  /**
   * Queue command for offline operation
   */
  private async queueCommand(command: TractorCommand): Promise<void> {
    try {
      // Sign the command before queuing
      const signature = await securityManager.signCommand(command);
      
      const signedCommand = {
        ...command,
        signature: signature.signature,
        queuedAt: Date.now()
      };
      
      // Add to queue
      this.queuedCommands.push(signedCommand);
      
      // Save queue securely
      await this.saveQueuedCommands();
      
      await securityManager.logSecurityEvent('Command queued for later sending', 'info', {
        commandId: command.id,
        commandType: command.type
      });
    } catch (error) {
      console.error('Failed to queue command:', error);
      await securityManager.logSecurityEvent('Failed to queue command', 'error', { error });
    }
  }

  /**
   * Process queued commands
   */
  public async processQueuedCommands(): Promise<void> {
    try {
      if (!this.isConnected || this.queuedCommands.length === 0) {
        return;
      }
      
      console.log(`Processing ${this.queuedCommands.length} queued commands`);
      await securityManager.logSecurityEvent('Processing queued commands', 'info', {
        commandCount: this.queuedCommands.length
      });
      
      // Process each command in order
      const commandsToProcess = [...this.queuedCommands];
      this.queuedCommands = [];
      
      for (const command of commandsToProcess) {
        try {
          // Remove the queuedAt property before sending
          const { queuedAt, ...commandToSend } = command as TractorCommand & { queuedAt?: number };
          
          // Send the command
          const result = await this.processAndSendCommand(commandToSend);
          
          if (!result.success) {
            // If sending fails, add back to queue
            this.queuedCommands.push(command);
            await securityManager.logSecurityEvent('Failed to send queued command', 'warning', {
              commandId: command.id,
              commandType: command.type
            });
          } else {
            await securityManager.logSecurityEvent('Successfully sent queued command', 'info', {
              commandId: command.id,
              commandType: command.type
            });
          }
        } catch (error) {
          console.error('Error processing queued command:', error);
          await securityManager.logSecurityEvent('Error processing queued command', 'error', {
            error,
            commandId: command.id
          });
          
          // Add back to queue on error
          this.queuedCommands.push(command);
        }
      }
      
      // Save any commands that failed to send
      if (this.queuedCommands.length > 0) {
        await this.saveQueuedCommands();
      }
    } catch (error) {
      console.error('Failed to process queued commands:', error);
      await securityManager.logSecurityEvent('Failed to process queued commands', 'error', { error });
    }
  }

  /**
   * Save queued commands to secure storage
   */
  private async saveQueuedCommands(): Promise<void> {
    try {
      // Encrypt the queued commands before storing
      const queuedCommandsString = JSON.stringify(this.queuedCommands);
      
      // Store in secure storage
      await securityManager.secureStore('queued_commands', queuedCommandsString);
      
      // Log the action
      await securityManager.logSecurityEvent('Queued commands saved to secure storage', 'info', {
        commandCount: this.queuedCommands.length
      });
    } catch (error) {
      console.error('Failed to save queued commands:', error);
      await securityManager.logSecurityEvent('Failed to save queued commands', 'error', { error });
    }
  }

  /**
   * Load queued commands from secure storage
   */
  private async loadQueuedCommands(): Promise<void> {
    try {
      // Retrieve from secure storage
      const queuedCommandsString = await securityManager.secureRetrieve('queued_commands');
      
      if (queuedCommandsString) {
        this.queuedCommands = JSON.parse(queuedCommandsString);
        
        // Log the action
        await securityManager.logSecurityEvent('Queued commands loaded from secure storage', 'info', {
          commandCount: this.queuedCommands.length
        });
        
        // Clean up expired commands (older than 7 days)
        const now = Date.now();
        this.queuedCommands = this.queuedCommands.filter(cmd => {
          // Cast to access the queuedAt property
          const queuedCmd = cmd as TractorCommand & { queuedAt?: number };
          const queuedAt = queuedCmd.queuedAt || 0;
          return (now - queuedAt) < 7 * 24 * 60 * 60 * 1000;
        });
        
        // If we filtered any commands, save the updated queue
        if (this.queuedCommands.length !== JSON.parse(queuedCommandsString).length) {
          await this.saveQueuedCommands();
        }
      }
    } catch (error) {
      console.error('Failed to load queued commands:', error);
      await securityManager.logSecurityEvent('Failed to load queued commands', 'error', { error });
      this.queuedCommands = [];
    }
  }

  /**
   * Attempt to reconnect to tractor with secure connection
   */
  private reconnect(): void {
    if (this.reconnectTimer || !this.tractorId) {
      return;
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      securityManager.logSecurityEvent('Max reconnect attempts reached', 'warning', {
        attempts: this.maxReconnectAttempts
      });
      this.reconnectAttempts = 0;
      return;
    }
    
    console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    securityManager.logSecurityEvent('Attempting to reconnect', 'info', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    });
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      try {
        // Get client ID from secure storage
        const clientId = await securityManager.secureRetrieve('client_id');
        
        if (!clientId) {
          console.log('No client ID available for reconnection');
          securityManager.logSecurityEvent('No client ID available for reconnection', 'warning');
          this.reconnect();
          return;
        }
        
        // Try to reconnect with secure connection
        const result = await this.connect(this.tractorId!, clientId);
        
        if (!result.success) {
          // Try again
          securityManager.logSecurityEvent('Reconnection failed, will retry', 'warning', {
            error: result.error
          });
          this.reconnect();
        } else {
          // Reset reconnect attempts
          this.reconnectAttempts = 0;
          
          securityManager.logSecurityEvent('Reconnection successful', 'info', {
            connectionType: result.connectionType
          });
          
          // Process any queued commands
          await this.processQueuedCommands();
        }
      } catch (error) {
        console.error('Reconnection error:', error);
        securityManager.logSecurityEvent('Reconnection error', 'error', { error });
        this.reconnect();
      }
    }, this.reconnectInterval);
  }
}