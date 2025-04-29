/**
 * Sevak Mini Tractor - Entry Point
 * 
 * Main entry point for the Sevak mini tractor control system.
 * Initializes and starts the application.
 */

const app = require('./app');
const Logger = require('./utils/logger');

// Create logger
const logger = new Logger('Main');

// Handle process signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

// Start the application
startApp();

/**
 * Start the application
 */
async function startApp() {
  logger.info('Starting Sevak Mini Tractor Control System...');
  
  try {
    // Initialize the application
    logger.info('Initializing application...');
    const initResult = await app.initialize();
    
    if (!initResult) {
      logger.error('Failed to initialize application');
      process.exit(1);
    }
    
    // Start the application
    logger.info('Starting application...');
    const startResult = await app.start();
    
    if (!startResult) {
      logger.error('Failed to start application');
      process.exit(1);
    }
    
    logger.info('Sevak Mini Tractor Control System started successfully');
  } catch (error) {
    logger.critical(`Failed to start application: ${error.message}`, true);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
async function handleShutdown() {
  logger.info('Shutdown signal received, shutting down...');
  
  try {
    // Shutdown the application
    await app.shutdown();
    
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException(error) {
  logger.critical(`Uncaught exception: ${error.message}`, true);
  logger.error(error.stack);
  
  // Attempt to shutdown gracefully
  handleShutdown().catch(() => {
    process.exit(1);
  });
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(reason, promise) {
  logger.critical(`Unhandled promise rejection: ${reason}`, true);
  
  // Attempt to shutdown gracefully
  handleShutdown().catch(() => {
    process.exit(1);
  });
}