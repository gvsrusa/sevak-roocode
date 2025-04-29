/**
 * Sevak Mini Tractor - Logger
 * 
 * Provides logging functionality with different log levels and formatting.
 * Supports console output and file logging.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

class Logger {
  /**
   * Create a new logger instance
   * @param {string} moduleName - Name of the module using this logger
   */
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.logLevel = config.logging.level;
    this.logToFile = config.logging.logToFile;
    this.logFilePath = config.logging.logFilePath;
    this.logRotationSize = config.logging.logRotationSize;
    
    // Log levels
    this.LOG_LEVELS = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };
    
    // Create log directory if it doesn't exist
    if (this.logToFile) {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }
  
  /**
   * Log a debug message
   * @param {string} message - Message to log
   */
  debug(message) {
    this._log('DEBUG', message);
  }
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   */
  info(message) {
    this._log('INFO', message);
  }
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   */
  warn(message) {
    this._log('WARN', message);
  }
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   */
  error(message) {
    this._log('ERROR', message);
  }
  
  /**
   * Log a critical message
   * @param {string} message - Message to log
   * @param {boolean} notifyOperator - Whether to notify the operator
   */
  critical(message, notifyOperator = false) {
    this._log('CRITICAL', message);
    
    if (notifyOperator) {
      this._notifyOperator(message);
    }
  }
  
  /**
   * Internal logging function
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @private
   */
  _log(level, message) {
    // Check if log level is enabled
    if (this.LOG_LEVELS[level] < this.LOG_LEVELS[this.logLevel]) {
      return;
    }
    
    // Format timestamp
    const timestamp = new Date().toISOString();
    
    // Format log message
    const formattedMessage = `${timestamp} [${level}] [${this.moduleName}] ${message}`;
    
    // Log to console
    this._logToConsole(level, formattedMessage);
    
    // Log to file
    if (this.logToFile) {
      this._logToFile(formattedMessage);
    }
  }
  
  /**
   * Log to console with color
   * @param {string} level - Log level
   * @param {string} message - Formatted message
   * @private
   */
  _logToConsole(level, message) {
    // ANSI color codes
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      CRITICAL: '\x1b[41m\x1b[37m' // White on red background
    };
    
    const resetColor = '\x1b[0m';
    
    // Log to console with color
    console.log(`${colors[level]}${message}${resetColor}`);
  }
  
  /**
   * Log to file
   * @param {string} message - Formatted message
   * @private
   */
  _logToFile(message) {
    try {
      // Check if log file exists
      const fileExists = fs.existsSync(this.logFilePath);
      
      // Check if log file needs rotation
      if (fileExists) {
        const stats = fs.statSync(this.logFilePath);
        
        if (stats.size > this.logRotationSize) {
          this._rotateLogFile();
        }
      }
      
      // Append to log file
      fs.appendFileSync(this.logFilePath, message + '\n');
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }
  
  /**
   * Rotate log file
   * @private
   */
  _rotateLogFile() {
    try {
      // Get log file name and extension
      const logDir = path.dirname(this.logFilePath);
      const logFileName = path.basename(this.logFilePath);
      const logFileExt = path.extname(logFileName);
      const logFileBase = logFileName.slice(0, -logFileExt.length);
      
      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      
      // Create new log file name
      const newLogFileName = `${logFileBase}_${timestamp}${logFileExt}`;
      const newLogFilePath = path.join(logDir, newLogFileName);
      
      // Rename log file
      fs.renameSync(this.logFilePath, newLogFilePath);
      
      // Create new log file
      fs.writeFileSync(this.logFilePath, '');
      
      console.log(`Log file rotated to ${newLogFileName}`);
    } catch (error) {
      console.error(`Failed to rotate log file: ${error.message}`);
    }
  }
  
  /**
   * Notify operator of critical issue
   * @param {string} message - Critical message
   * @private
   */
  _notifyOperator(message) {
    // In a real implementation, this would send a notification to the operator
    // For example, via SMS, email, or mobile app notification
    
    console.log('\x1b[41m\x1b[37m');
    console.log('!!! OPERATOR NOTIFICATION !!!');
    console.log(`CRITICAL ISSUE: ${message}`);
    console.log('!!! OPERATOR NOTIFICATION !!!');
    console.log('\x1b[0m');
    
    // In a real implementation, we would also trigger an alarm or other notification
  }
  
  /**
   * Set log level
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   */
  setLogLevel(level) {
    if (this.LOG_LEVELS[level] !== undefined) {
      this.logLevel = level;
    } else {
      console.error(`Invalid log level: ${level}`);
    }
  }
  
  /**
   * Enable or disable file logging
   * @param {boolean} enabled - Whether to enable file logging
   */
  setFileLogging(enabled) {
    this.logToFile = enabled;
  }
}

module.exports = Logger;