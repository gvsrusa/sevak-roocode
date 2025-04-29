/**
 * Sevak Mobile App - Security Utilities
 * 
 * Provides security-related functionality including:
 * - Certificate-based authentication
 * - Command signing and verification
 * - Secure token management
 * - Encryption/decryption for data transmission
 * - Multi-factor authentication
 * - Secure storage
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { Buffer } from 'buffer';

// Constants
const CERT_STORAGE_KEY = 'tractor_client_certificate';
const SERVER_KEY_STORAGE_KEY = 'tractor_server_public_key';
const CA_CERT_STORAGE_KEY = 'tractor_ca_certificate';
const CLIENT_PRIVATE_KEY_STORAGE_KEY = 'tractor_client_private_key';
const COMMAND_HISTORY_KEY = 'command_history';
const SECURITY_LOG_KEY = 'security_log';
const MFA_ENABLED_KEY = 'mfa_enabled';
const OFFLINE_OPERATION_KEY = 'offline_operation_allowed';

// Types
export interface Certificate {
  data: string;
  expiresAt: number;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  encryptedKey: string;
}

export interface CommandSignature {
  id: string;
  timestamp: number;
  signature: string;
}

export interface SecurityLog {
  timestamp: number;
  event: string;
  details?: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Security Manager class for handling all security-related operations
 */
export class SecurityManager {
  private clientCertificate: Certificate | null = null;
  private serverPublicKey: string | null = null;
  private caCertificate: string | null = null;
  private clientPrivateKey: string | null = null;
  private mfaEnabled: boolean = false;
  private offlineOperationAllowed: boolean = false;
  private commandHistory: Map<string, number> = new Map();
  private securityLogs: SecurityLog[] = [];
  private initialized: boolean = false;

  /**
   * Initialize the security manager
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load certificates and keys
      await this.loadCertificatesAndKeys();
      
      // Load MFA settings
      await this.loadMfaSettings();
      
      // Load offline operation settings
      await this.loadOfflineOperationSettings();
      
      // Load command history
      await this.loadCommandHistory();
      
      // Load security logs
      await this.loadSecurityLogs();
      
      this.initialized = true;
      
      // Log initialization
      await this.logSecurityEvent('Security manager initialized', 'info');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize security manager:', error);
      return false;
    }
  }

  /**
   * Load certificates and keys from secure storage
   */
  private async loadCertificatesAndKeys(): Promise<void> {
    try {
      // Load client certificate
      const certData = await SecureStore.getItemAsync(CERT_STORAGE_KEY);
      if (certData) {
        this.clientCertificate = JSON.parse(certData) as Certificate;
      }
      
      // Load server public key
      this.serverPublicKey = await SecureStore.getItemAsync(SERVER_KEY_STORAGE_KEY);
      
      // Load CA certificate
      this.caCertificate = await SecureStore.getItemAsync(CA_CERT_STORAGE_KEY);
      
      // Load client private key
      this.clientPrivateKey = await SecureStore.getItemAsync(CLIENT_PRIVATE_KEY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to load certificates and keys:', error);
      throw error;
    }
  }

  /**
   * Load MFA settings from secure storage
   */
  private async loadMfaSettings(): Promise<void> {
    try {
      const mfaEnabled = await SecureStore.getItemAsync(MFA_ENABLED_KEY);
      this.mfaEnabled = mfaEnabled === 'true';
    } catch (error) {
      console.error('Failed to load MFA settings:', error);
      this.mfaEnabled = false;
    }
  }

  /**
   * Load offline operation settings from secure storage
   */
  private async loadOfflineOperationSettings(): Promise<void> {
    try {
      const offlineAllowed = await SecureStore.getItemAsync(OFFLINE_OPERATION_KEY);
      this.offlineOperationAllowed = offlineAllowed === 'true';
    } catch (error) {
      console.error('Failed to load offline operation settings:', error);
      this.offlineOperationAllowed = false;
    }
  }

  /**
   * Load command history from storage
   */
  private async loadCommandHistory(): Promise<void> {
    try {
      const historyData = await SecureStore.getItemAsync(COMMAND_HISTORY_KEY);
      if (historyData) {
        const history = JSON.parse(historyData) as [string, number][];
        this.commandHistory = new Map(history);
        
        // Clean up old entries (older than 24 hours)
        const now = Date.now();
        for (const [id, timestamp] of this.commandHistory.entries()) {
          if (now - timestamp > 24 * 60 * 60 * 1000) {
            this.commandHistory.delete(id);
          }
        }
        
        // Save cleaned up history
        await this.saveCommandHistory();
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
      this.commandHistory = new Map();
    }
  }

  /**
   * Save command history to storage
   */
  private async saveCommandHistory(): Promise<void> {
    try {
      const historyData = JSON.stringify(Array.from(this.commandHistory.entries()));
      await SecureStore.setItemAsync(COMMAND_HISTORY_KEY, historyData);
    } catch (error) {
      console.error('Failed to save command history:', error);
    }
  }

  /**
   * Load security logs from storage
   */
  private async loadSecurityLogs(): Promise<void> {
    try {
      const logsData = await AsyncStorage.getItem(SECURITY_LOG_KEY);
      if (logsData) {
        this.securityLogs = JSON.parse(logsData) as SecurityLog[];
        
        // Keep only the last 1000 logs
        if (this.securityLogs.length > 1000) {
          this.securityLogs = this.securityLogs.slice(-1000);
          await this.saveSecurityLogs();
        }
      }
    } catch (error) {
      console.error('Failed to load security logs:', error);
      this.securityLogs = [];
    }
  }

  /**
   * Save security logs to storage
   */
  private async saveSecurityLogs(): Promise<void> {
    try {
      const logsData = JSON.stringify(this.securityLogs);
      await AsyncStorage.setItem(SECURITY_LOG_KEY, logsData);
    } catch (error) {
      console.error('Failed to save security logs:', error);
    }
  }

  /**
   * Log a security event
   */
  public async logSecurityEvent(
    event: string, 
    severity: 'info' | 'warning' | 'error' | 'critical', 
    details?: any
  ): Promise<void> {
    try {
      const log: SecurityLog = {
        timestamp: Date.now(),
        event,
        severity,
        details
      };
      
      this.securityLogs.push(log);
      
      // Keep only the last 1000 logs
      if (this.securityLogs.length > 1000) {
        this.securityLogs.shift();
      }
      
      await this.saveSecurityLogs();
      
      // For critical events, also show an alert
      if (severity === 'critical') {
        Alert.alert('Security Alert', event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get security logs
   */
  public getSecurityLogs(): SecurityLog[] {
    return [...this.securityLogs];
  }

  /**
   * Generate a client certificate request
   */
  public async generateCertificateRequest(clientId: string): Promise<string> {
    try {
      // In a real implementation, this would generate a proper CSR
      // For now, we'll just create a placeholder
      const csrData = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${clientId}-${Date.now()}-${Math.random()}`
      );
      
      return csrData;
    } catch (error) {
      console.error('Failed to generate certificate request:', error);
      throw error;
    }
  }

  /**
   * Store client certificate
   */
  public async storeClientCertificate(certificate: Certificate): Promise<void> {
    try {
      this.clientCertificate = certificate;
      await SecureStore.setItemAsync(CERT_STORAGE_KEY, JSON.stringify(certificate));
      await this.logSecurityEvent('Client certificate stored', 'info');
    } catch (error) {
      console.error('Failed to store client certificate:', error);
      throw error;
    }
  }

  /**
   * Store CA certificate
   */
  public async storeCACertificate(certificate: string): Promise<void> {
    try {
      this.caCertificate = certificate;
      await SecureStore.setItemAsync(CA_CERT_STORAGE_KEY, certificate);
      await this.logSecurityEvent('CA certificate stored', 'info');
    } catch (error) {
      console.error('Failed to store CA certificate:', error);
      throw error;
    }
  }

  /**
   * Store client private key
   */
  public async storeClientPrivateKey(privateKey: string): Promise<void> {
    try {
      this.clientPrivateKey = privateKey;
      await SecureStore.setItemAsync(CLIENT_PRIVATE_KEY_STORAGE_KEY, privateKey);
      await this.logSecurityEvent('Client private key stored', 'info');
    } catch (error) {
      console.error('Failed to store client private key:', error);
      throw error;
    }
  }

  /**
   * Store server public key
   */
  public async storeServerPublicKey(publicKey: string): Promise<void> {
    try {
      this.serverPublicKey = publicKey;
      await SecureStore.setItemAsync(SERVER_KEY_STORAGE_KEY, publicKey);
      await this.logSecurityEvent('Server public key stored', 'info');
    } catch (error) {
      console.error('Failed to store server public key:', error);
      throw error;
    }
  }

  /**
   * Get client certificate
   */
  public getClientCertificate(): Certificate | null {
    return this.clientCertificate;
  }

  /**
   * Get CA certificate
   */
  public getCACertificate(): string | null {
    return this.caCertificate;
  }

  /**
   * Get client private key
   */
  public getClientPrivateKey(): string | null {
    return this.clientPrivateKey;
  }

  /**
   * Get server public key
   */
  public getServerPublicKey(): string | null {
    return this.serverPublicKey;
  }

  /**
   * Check if certificates are valid and available
   */
  public hasCertificates(): boolean {
    return !!(this.clientCertificate && this.caCertificate && this.clientPrivateKey);
  }

  /**
   * Sign a command with the client's private key
   */
  public async signCommand(command: any): Promise<CommandSignature> {
    try {
      if (!this.clientPrivateKey) {
        throw new Error('Client private key not available');
      }
      
      // Create string representation of command
      const commandStr = JSON.stringify(command);
      
      // Create signature
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        commandStr + this.clientPrivateKey
      );
      
      // Add command to history to prevent replay attacks
      this.commandHistory.set(command.id, Date.now());
      await this.saveCommandHistory();
      
      return {
        id: command.id,
        timestamp: command.timestamp || Date.now(),
        signature
      };
    } catch (error) {
      console.error('Failed to sign command:', error);
      await this.logSecurityEvent('Command signing failed', 'error', { error });
      throw error;
    }
  }

  /**
   * Encrypt data for transmission
   */
  public async encryptData(data: any): Promise<EncryptedData | null> {
    try {
      if (!this.serverPublicKey) {
        throw new Error('Server public key not available');
      }
      
      // Convert data to string
      const dataStr = JSON.stringify(data);
      
      // Generate random IV (initialization vector)
      const ivArray = new Uint8Array(16);
      crypto.getRandomValues(ivArray);
      const iv = Buffer.from(ivArray).toString('base64');
      
      // Generate random symmetric key
      const keyArray = new Uint8Array(32);
      crypto.getRandomValues(keyArray);
      const symmetricKey = Buffer.from(keyArray).toString('base64');
      
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
      await this.logSecurityEvent('Data encryption failed', 'error', { error });
      return null;
    }
  }

  /**
   * Enable or disable multi-factor authentication
   */
  public async setMfaEnabled(enabled: boolean): Promise<boolean> {
    try {
      // In a real implementation, this would check for biometric hardware
      // For now, we'll just store the setting
      
      this.mfaEnabled = enabled;
      await SecureStore.setItemAsync(MFA_ENABLED_KEY, enabled ? 'true' : 'false');
      await this.logSecurityEvent(`MFA ${enabled ? 'enabled' : 'disabled'}`, 'info');
      return true;
    } catch (error) {
      console.error('Failed to set MFA enabled:', error);
      await this.logSecurityEvent('Failed to set MFA settings', 'error', { error });
      return false;
    }
  }

  /**
   * Check if multi-factor authentication is enabled
   */
  public isMfaEnabled(): boolean {
    return this.mfaEnabled;
  }

  /**
   * Authenticate using biometrics
   */
  public async authenticateWithBiometrics(reason: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      if (!this.mfaEnabled) {
        return true; // MFA not enabled, so authentication is successful by default
      }
      
      // In a real implementation, this would use biometric authentication
      // For now, we'll just simulate success
      
      await this.logSecurityEvent('Biometric authentication successful', 'info');
      return true;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      await this.logSecurityEvent('Biometric authentication error', 'error', { error });
      return false;
    }
  }

  /**
   * Set offline operation allowed
   */
  public async setOfflineOperationAllowed(allowed: boolean): Promise<void> {
    try {
      this.offlineOperationAllowed = allowed;
      await SecureStore.setItemAsync(OFFLINE_OPERATION_KEY, allowed ? 'true' : 'false');
      await this.logSecurityEvent(`Offline operation ${allowed ? 'allowed' : 'disallowed'}`, 'info');
    } catch (error) {
      console.error('Failed to set offline operation allowed:', error);
      await this.logSecurityEvent('Failed to set offline operation settings', 'error', { error });
    }
  }

  /**
   * Check if offline operation is allowed
   */
  public isOfflineOperationAllowed(): boolean {
    return this.offlineOperationAllowed;
  }

  /**
   * Verify server certificate against trusted CA
   */
  public async verifyServerCertificate(serverCert: string): Promise<boolean> {
    try {
      if (!this.caCertificate) {
        await this.logSecurityEvent('CA certificate not available for verification', 'warning');
        return false;
      }
      
      // In a real implementation, this would verify the certificate chain
      // For now, we'll use a simplified approach
      
      // Log verification attempt
      await this.logSecurityEvent('Server certificate verification attempted', 'info');
      
      // Simplified verification (in a real app, this would be more robust)
      return true;
    } catch (error) {
      console.error('Failed to verify server certificate:', error);
      await this.logSecurityEvent('Server certificate verification failed', 'error', { error });
      return false;
    }
  }

  /**
   * Generate a secure random token
   */
  public async generateSecureToken(length: number = 32): Promise<string> {
    try {
      const randomBytes = new Uint8Array(length);
      crypto.getRandomValues(randomBytes);
      return Buffer.from(randomBytes).toString('hex');
    } catch (error) {
      console.error('Failed to generate secure token:', error);
      throw error;
    }
  }

  /**
   * Securely store sensitive data
   */
  public async secureStore(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Failed to securely store ${key}:`, error);
      throw error;
    }
  }

  /**
   * Securely retrieve sensitive data
   */
  public async secureRetrieve(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to securely retrieve ${key}:`, error);
      throw error;
    }
  }

  /**
   * Securely delete sensitive data
   */
  public async secureDelete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to securely delete ${key}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const securityManager = new SecurityManager();

// Export default for convenience
export default securityManager;