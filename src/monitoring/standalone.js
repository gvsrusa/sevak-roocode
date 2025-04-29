/**
 * Standalone Monitoring System
 * 
 * Run the monitoring system as a standalone service.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const Logger = require('../utils/logger');
const config = require('../config');
const { initMonitoring } = require('./index');

// Create logger
const logger = new Logger('MonitoringService');

// Create Express app
const app = express();
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Serve static files for the dashboard
app.use(express.static(path.join(__dirname, '../../examples/public')));

// Initialize monitoring system
logger.info('Initializing monitoring system...');
const monitoring = initMonitoring(config, logger, app, server);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Monitoring server running on port ${PORT}`);
  logger.info(`Dashboard available at http://localhost:${PORT}`);
});

// Handle process signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

/**
 * Handle graceful shutdown
 */
async function handleShutdown() {
  logger.info('Shutdown signal received, shutting down...');
  
  try {
    // Stop monitoring system
    if (monitoring && monitoring.monitoringSystem) {
      await monitoring.monitoringSystem.stop();
    }
    
    // Close WebSocket connections
    if (monitoring && monitoring.monitoringWebSocket) {
      monitoring.monitoringWebSocket.close();
    }
    
    // Close server
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    
    // Force exit after 3 seconds if server doesn't close
    setTimeout(() => {
      logger.warn('Forcing exit after timeout');
      process.exit(1);
    }, 3000);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException(error) {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.error(error.stack);
  
  // Attempt to shutdown gracefully
  handleShutdown();
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(reason, promise) {
  logger.error(`Unhandled promise rejection: ${reason}`);
  
  // Attempt to shutdown gracefully
  handleShutdown();
}