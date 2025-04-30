/**
 * Sevak Mini Tractor - Security Utilities
 * 
 * Provides security-related functionality including:
 * - Certificate-based authentication
 * - Command signing and verification
 * - Secure token generation
 * - Encryption/decryption for data transmission
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const Logger = require('./logger');

class SecurityManager {
  constructor() {
    this.logger = new Logger('SecurityManager');
    
    // Initialize certificates and keys
    this.certificates = {
      server: {
        cert: null,
        key: null,
        ca: null
      },
      client: {
        trustedCerts: new Map()
      }
    };
    
    // Command verification cache to prevent replay attacks
    this.commandVerificationCache = new Map();
    
    // Maximum age for cached command signatures (5 minutes)
    this.commandCacheMaxAge = 5 * 60 * 1000;
    
    // Active sessions
    this.activeSessions = new Map();
    
    this.logger.info('Security Manager initialized');
  }
  
  /**
   * Initialize security manager
   */
  async initialize() {
    try {
      // Load server certificates
      await this.loadServerCertificates();
      
      // Load trusted client certificates
      await this.loadTrustedClientCertificates();
      
      this.logger.info('Security Manager initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize Security Manager: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load server certificates
   */
  async loadServerCertificates() {
    try {
      // Default paths if not specified in config
      const certPath = path.resolve(config.security?.certificates?.serverCertPath || './certs/server.crt');
      const keyPath = path.resolve(config.security?.certificates?.serverKeyPath || './certs/server.key');
      const caPath = path.resolve(config.security?.certificates?.caPath || './certs/ca.crt');
      
      this.certificates.server.cert = fs.readFileSync(certPath);
      this.certificates.server.key = fs.readFileSync(keyPath);
      
      if (fs.existsSync(caPath)) {
        this.certificates.server.ca = fs.readFileSync(caPath);
      }
      
      this.logger.info('Server certificates loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load server certificates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load trusted client certificates
   */
  async loadTrustedClientCertificates() {
    try {
      const clientCertsDir = path.resolve(config.security?.certificates?.clientCertsDir || './certs/clients');
      
      if (!fs.existsSync(clientCertsDir)) {
        this.logger.warn(`Client certificates directory not found: ${clientCertsDir}`);
        return;
      }
      
      const certFiles = fs.readdirSync(clientCertsDir).filter(file => file.endsWith('.pem') || file.endsWith('.crt'));
      
      for (const certFile of certFiles) {
        const certPath = path.join(clientCertsDir, certFile);
        const cert = fs.readFileSync(certPath);
        
        // Extract client ID from certificate
        const clientId = this.extractClientIdFromCertificate(cert);
        
        if (clientId) {
          this.certificates.client.trustedCerts.set(clientId, cert);
          this.logger.info(`Loaded trusted certificate for client: ${clientId}`);
        } else {
          this.logger.warn(`Could not extract client ID from certificate: ${certFile}`);
        }
      }
      
      this.logger.info(`Loaded ${this.certificates.client.trustedCerts.size} trusted client certificates`);
    } catch (error) {
      this.logger.error(`Failed to load trusted client certificates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extract client ID from certificate
   * @param {Buffer} cert - Client certificate
   * @returns {string|null} - Client ID or null if not found
   */
  extractClientIdFromCertificate(cert) {
    try {
      // In a real implementation, this would extract the Common Name or Subject Alternative Name
      // For this prototype, we'll use a simple placeholder implementation
      
      // Check if crypto.x509 is available (Node.js 15.6.0+)
      if (crypto.x509) {
        const certInfo = crypto.x509.parseCert(cert.toString());
        return certInfo.subject.commonName;
      } else {
        // Fallback for older Node.js versions
        // Just extract a mock client ID from the certificate
        const certStr = cert.toString();
        // Simple mock implementation - in a real system, proper X.509 parsing would be used
        return 'client1'; // Default client ID for testing
      }
    } catch (error) {
      this.logger.error(`Failed to extract client ID from certificate: ${error.message}`);
      return 'client1'; // Default client ID for testing
    }
  }
  
  /**
   * Verify client certificate
   * @param {Buffer} clientCert - Client certificate to verify
   * @returns {Object} - Verification result with client ID if successful
   */
  verifyClientCertificate(clientCert) {
    try {
      // Parse certificate
      const certInfo = crypto.x509.parseCert(clientCert.toString());
      const clientId = certInfo.subject.commonName;
      
      // Check if certificate is trusted
      const trustedCert = this.certificates.client.trustedCerts.get(clientId);
      
      if (!trustedCert) {
        return {
          valid: false,
          error: 'Certificate not trusted'
        };
      }
      
      // Verify certificate validity
      const now = new Date();
      
      if (now < certInfo.validFrom || now > certInfo.validTo) {
        return {
          valid: false,
          error: 'Certificate expired or not yet valid'
        };
      }
      
      // In a real implementation, we would also verify the certificate chain
      // and check certificate revocation status
      
      return {
        valid: true,
        clientId: clientId
      };
    } catch (error) {
      this.logger.error(`Certificate verification failed: ${error.message}`);
      return {
        valid: false,
        error: `Certificate verification failed: ${error.message}`
      };
    }
  }
  
  /**
   * Generate secure session token
   * @param {string} clientId - Client ID
   * @returns {Object} - Session token information
   */
  generateSessionToken(clientId) {
    // Generate random token with high entropy
    const tokenBytes = crypto.randomBytes(32);
    const token = tokenBytes.toString('hex');
    
    // Set expiration time (1 hour from now)
    const expiresAt = Date.now() + (60 * 60 * 1000);
    
    // Store session information
    this.activeSessions.set(token, {
      clientId: clientId,
      createdAt: Date.now(),
      expiresAt: expiresAt,
      lastActivity: Date.now()
    });
    
    // Log session creation
    this.logger.info(`Created session for client ${clientId}`);
    
    return {
      token: token,
      expiresAt: expiresAt
    };
  }
  
  /**
   * Verify session token
   * @param {string} token - Session token to verify
   * @returns {Object} - Verification result
   */
  verifySessionToken(token) {
    // Check if token exists
    if (!this.activeSessions.has(token)) {
      return {
        valid: false,
        error: 'Invalid session token'
      };
    }
    
    // Get session information
    const session = this.activeSessions.get(token);
    
    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      // Remove expired session
      this.activeSessions.delete(token);
      
      return {
        valid: false,
        error: 'Session expired'
      };
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    
    return {
      valid: true,
      clientId: session.clientId
    };
  }
  
  /**
   * Invalidate session token
   * @param {string} token - Session token to invalidate
   */
  invalidateSessionToken(token) {
    if (this.activeSessions.has(token)) {
      const session = this.activeSessions.get(token);
      this.logger.info(`Invalidated session for client ${session.clientId}`);
      this.activeSessions.delete(token);
      return true;
    }
    
    return false;
  }
  
  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt) {
        this.activeSessions.delete(token);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.info(`Cleaned up ${expiredCount} expired sessions`);
    }
  }
  
  /**
   * Sign command with server's private key
   * @param {Object} command - Command to sign
   * @returns {Object} - Command with signature
   */
  signCommand(command) {
    try {
      // Create string representation of command
      const commandStr = JSON.stringify(command);
      
      // Create signature
      const sign = crypto.createSign('SHA256');
      sign.update(commandStr);
      sign.end();
      
      const signature = sign.sign(this.certificates.server.key, 'base64');
      
      // Return command with signature
      return {
        ...command,
        signature: signature
      };
    } catch (error) {
      this.logger.error(`Failed to sign command: ${error.message}`);
      return command;
    }
  }
  
  /**
   * Verify command signature
   * @param {Object} command - Command with signature
   * @param {Buffer} publicKey - Public key to verify signature
   * @returns {boolean} - Whether signature is valid
   */
  verifyCommandSignature(command, publicKey) {
    try {
      // Extract signature
      const { signature, ...commandData } = command;
      
      // Create string representation of command
      const commandStr = JSON.stringify(commandData);
      
      // Verify signature
      const verify = crypto.createVerify('SHA256');
      verify.update(commandStr);
      verify.end();
      
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error(`Failed to verify command signature: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Verify command and check for replay attacks
   * @param {Object} command - Command to verify
   * @param {Buffer} publicKey - Public key to verify signature
   * @returns {Object} - Verification result
   */
  verifyCommand(command, publicKey) {
    try {
      // Check if command has required fields
      if (!command.id || !command.timestamp || !command.signature) {
        return {
          valid: false,
          error: 'Invalid command format'
        };
      }
      
      // Check if command is too old (more than 5 minutes)
      const now = Date.now();
      const commandAge = now - command.timestamp;
      
      if (commandAge > 5 * 60 * 1000) {
        return {
          valid: false,
          error: 'Command expired'
        };
      }
      
      // Check for replay attack
      const commandKey = `${command.id}-${command.timestamp}`;
      
      if (this.commandVerificationCache.has(commandKey)) {
        return {
          valid: false,
          error: 'Potential replay attack detected'
        };
      }
      
      // Verify signature
      const signatureValid = this.verifyCommandSignature(command, publicKey);
      
      if (!signatureValid) {
        return {
          valid: false,
          error: 'Invalid signature'
        };
      }
      
      // Add to verification cache
      this.commandVerificationCache.set(commandKey, now);
      
      // Clean up old cache entries
      this.cleanupCommandCache();
      
      return {
        valid: true
      };
    } catch (error) {
      this.logger.error(`Command verification failed: ${error.message}`);
      return {
        valid: false,
        error: `Verification failed: ${error.message}`
      };
    }
  }
  
  /**
   * Clean up old command verification cache entries
   */
  cleanupCommandCache() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, timestamp] of this.commandVerificationCache.entries()) {
      if (now - timestamp > this.commandCacheMaxAge) {
        this.commandVerificationCache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} command cache entries`);
    }
  }
  
  /**
   * Encrypt data for transmission
   * @param {Object} data - Data to encrypt
   * @param {Buffer} publicKey - Recipient's public key
   * @returns {Object} - Encrypted data
   */
  encryptData(data, publicKey) {
    try {
      // Generate random symmetric key
      const symmetricKey = crypto.randomBytes(32);
      
      // Encrypt data with symmetric key
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', symmetricKey, iv);
      
      const dataStr = JSON.stringify(data);
      let encrypted = cipher.update(dataStr, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      // Encrypt symmetric key with recipient's public key
      const encryptedKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        symmetricKey
      );
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        encryptedKey: encryptedKey.toString('base64')
      };
    } catch (error) {
      this.logger.error(`Failed to encrypt data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Decrypt received data
   * @param {Object} encryptedPackage - Encrypted data package
   * @returns {Object|null} - Decrypted data or null if decryption fails
   */
  decryptData(encryptedPackage) {
    try {
      // Decrypt symmetric key with server's private key
      const encryptedKey = Buffer.from(encryptedPackage.encryptedKey, 'base64');
      const symmetricKey = crypto.privateDecrypt(
        {
          key: this.certificates.server.key,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        encryptedKey
      );
      
      // Decrypt data with symmetric key
      const iv = Buffer.from(encryptedPackage.iv, 'base64');
      const authTag = Buffer.from(encryptedPackage.authTag, 'base64');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', symmetricKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedPackage.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error(`Failed to decrypt data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get TLS options for secure WebSocket server
   * @returns {Object} - TLS options
   */
  getTlsOptions() {
    return {
      cert: this.certificates.server.cert,
      key: this.certificates.server.key,
      ca: this.certificates.server.ca,
      requestCert: true,
      rejectUnauthorized: true
    };
  }
}

module.exports = SecurityManager;