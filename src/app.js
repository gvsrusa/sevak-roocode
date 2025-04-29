/**
 * Sevak Mini Tractor - Main Application
 * 
 * Entry point for the Sevak mini tractor control system.
 * Initializes and coordinates all system components.
 */

const Logger = require('./utils/logger');
const eventBus = require('./utils/eventBus');
const config = require('./config');

const SensorManager = require('./sensors/sensorManager');
const MotorController = require('./motors/motorController');
const NavigationSystem = require('./navigation/navigationSystem');
const SafetyMonitor = require('./safety/safetyMonitor');
const MobileAppInterface = require('./communication/mobileAppInterface');
const { initMonitoring } = require('./monitoring');

class SevakApp {
  constructor() {
    this.logger = new Logger('SevakApp');
    
    // System components
    this.sensorManager = new SensorManager();
    this.motorController = new MotorController();
    this.navigationSystem = null; // Will be initialized after sensor manager
    this.safetyMonitor = new SafetyMonitor();
    this.mobileAppInterface = new MobileAppInterface();
    
    // Monitoring components
    this.monitoring = null; // Will be initialized during initialize()
    
    // System state
    this.isRunning = false;
    this.isInitialized = false;
    
    // Command handlers
    this._registerCommandHandlers();
    
    this.logger.info('Sevak App initialized');
  }
  
  /**
   * Initialize the system
   */
  async initialize() {
    this.logger.info('Initializing Sevak system...');
    
    try {
      // Initialize components in order
      this.logger.info('Initializing Sensor Manager...');
      await this.sensorManager.initialize();
      
      this.logger.info('Initializing Motor Controller...');
      await this.motorController.initialize();
      
      this.logger.info('Initializing Navigation System...');
      this.navigationSystem = new NavigationSystem(this.sensorManager);
      await this.navigationSystem.initialize();
      
      this.logger.info('Initializing Safety Monitor...');
      await this.safetyMonitor.initialize();
      
      this.logger.info('Initializing Mobile App Interface...');
      await this.mobileAppInterface.initialize();
      
      this.logger.info('Initializing Monitoring System...');
      // Initialize monitoring system with the mobile app interface's express app and server
      this.monitoring = initMonitoring(
        config,
        this.logger,
        this.mobileAppInterface.app,
        this.mobileAppInterface.server
      );
      
      // Register request handlers
      this._registerRequestHandlers();
      
      // Mark as initialized
      this.isInitialized = true;
      
      this.logger.info('Sevak system initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize Sevak system: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Start the system
   */
  async start() {
    if (!this.isInitialized) {
      this.logger.error('Cannot start system: not initialized');
      return false;
    }
    
    if (this.isRunning) {
      this.logger.warn('System is already running');
      return true;
    }
    
    this.logger.info('Starting Sevak system...');
    
    try {
      // Reset watchdog
      this.safetyMonitor.resetWatchdog();
      
      // Mark as running
      this.isRunning = true;
      
      // Start watchdog reset interval
      this.watchdogInterval = setInterval(() => {
        this.safetyMonitor.resetWatchdog();
      }, 500); // Reset every 500ms
      
      // Start monitoring system if enabled
      if (config.monitoring?.enabled && this.monitoring) {
        this.logger.info('Starting monitoring system...');
        // The monitoring system is already started during initialization
      }
      
      this.logger.info('Sevak system started successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to start Sevak system: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Stop the system
   */
  async stop() {
    if (!this.isRunning) {
      this.logger.warn('System is not running');
      return true;
    }
    
    this.logger.info('Stopping Sevak system...');
    
    try {
      // Stop watchdog reset interval
      if (this.watchdogInterval) {
        clearInterval(this.watchdogInterval);
        this.watchdogInterval = null;
      }
      
      // Stop navigation
      await this.navigationSystem.stopNavigation();
      
      // Stop motors
      await this.motorController.setTargetSpeed(0);
      
      // Stop monitoring system if running
      if (config.monitoring?.enabled && this.monitoring?.monitoringSystem?.isRunning) {
        this.logger.info('Stopping monitoring system...');
        await this.monitoring.monitoringSystem.stop();
      }
      
      // Mark as not running
      this.isRunning = false;
      
      this.logger.info('Sevak system stopped successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to stop Sevak system: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Shutdown the system
   */
  async shutdown() {
    this.logger.info('Shutting down Sevak system...');
    
    try {
      // Stop system if running
      if (this.isRunning) {
        await this.stop();
      }
      
      // Shutdown components in reverse order
      this.logger.info('Shutting down Mobile App Interface...');
      await this.mobileAppInterface.shutdown();
      
      this.logger.info('Shutting down Safety Monitor...');
      await this.safetyMonitor.shutdown();
      
      this.logger.info('Shutting down Navigation System...');
      await this.navigationSystem.shutdown();
      
      this.logger.info('Shutting down Motor Controller...');
      await this.motorController.shutdown();
      
      this.logger.info('Shutting down Sensor Manager...');
      await this.sensorManager.shutdown();
      
      this.logger.info('Shutting down Monitoring System...');
      if (this.monitoring?.monitoringSystem) {
        await this.monitoring.monitoringSystem.shutdown();
      }
      
      // Close WebSocket connections if active
      if (this.monitoring?.monitoringWebSocket) {
        this.monitoring.monitoringWebSocket.close();
      }
      
      // Mark as not initialized
      this.isInitialized = false;
      
      this.logger.info('Sevak system shut down successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to shut down Sevak system: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Register command handlers
   * @private
   */
  _registerCommandHandlers() {
    // Handle move command
    eventBus.subscribe('command.move', (data) => {
      this._handleMoveCommand(data);
    });
    
    // Handle navigate command
    eventBus.subscribe('command.navigate', (data) => {
      this._handleNavigateCommand(data);
    });
    
    // Handle stop command
    eventBus.subscribe('command.stop', (data) => {
      this._handleStopCommand(data);
    });
    
    // Handle emergency stop command
    eventBus.subscribe('command.emergencyStop', (data) => {
      this._handleEmergencyStopCommand(data);
    });
    
    // Handle set boundaries command
    eventBus.subscribe('command.setBoundaries', (data) => {
      this._handleSetBoundariesCommand(data);
    });
  }
  
  /**
   * Register request handlers
   * @private
   */
  _registerRequestHandlers() {
    // Handle navigation status request
    eventBus.registerRequestHandler('navigation.getStatus', async (data) => {
      return this.navigationSystem.getStatus();
    });
    
    // Handle motor status request
    eventBus.registerRequestHandler('motor.getStatus', async (data) => {
      return this.motorController.getStatus();
    });
    
    // Handle sensor status request
    eventBus.registerRequestHandler('sensor.getStatus', async (data) => {
      return this.sensorManager.getSensorStatus();
    });
    
    // Handle safety status request
    eventBus.registerRequestHandler('safety.getStatus', async (data) => {
      return this.safetyMonitor.getStatus();
    });
    
    // Handle monitoring status request
    eventBus.registerRequestHandler('monitoring.getStatus', async (data) => {
      if (this.monitoring?.monitoringSystem) {
        return this.monitoring.monitoringSystem.getStatus();
      }
      return { isRunning: false };
    });
    
    // Handle monitoring metrics request
    eventBus.registerRequestHandler('monitoring.getMetrics', async (data) => {
      if (this.monitoring?.monitoringSystem) {
        return this.monitoring.monitoringSystem.getMetrics(data.type, data.timeRange);
      }
      return {};
    });
    
    // Handle monitoring alerts request
    eventBus.registerRequestHandler('monitoring.getAlerts', async (data) => {
      if (this.monitoring?.monitoringSystem) {
        return this.monitoring.monitoringSystem.getAlerts();
      }
      return [];
    });
    
    // Handle monitoring maintenance request
    eventBus.registerRequestHandler('monitoring.getMaintenanceSchedule', async (data) => {
      if (this.monitoring?.monitoringSystem) {
        return this.monitoring.monitoringSystem.getMaintenanceSchedule();
      }
      return [];
    });
    
    // Handle run diagnostics request
    eventBus.registerRequestHandler('monitoring.runDiagnostics', async (data) => {
      if (this.monitoring?.monitoringSystem) {
        return this.monitoring.monitoringSystem.runDiagnostics(data.components);
      }
      return { error: 'Monitoring system not available' };
    });
  }
  
  /**
   * Handle move command
   * @private
   */
  _handleMoveCommand(data) {
    this.logger.info(`Received move command: speed=${data.speed}, direction=${data.direction}`);
    
    // Check if system is running
    if (!this.isRunning) {
      this.logger.error('Cannot execute move command: system is not running');
      return;
    }
    
    // Check if it's safe to operate
    if (!this.safetyMonitor.isSafeToOperate()) {
      this.logger.error('Cannot execute move command: safety violation');
      return;
    }
    
    // Set motor speed and direction
    this.motorController.setTargetSpeed(data.speed);
    this.motorController.setTargetDirection(data.direction);
  }
  
  /**
   * Handle navigate command
   * @private
   */
  _handleNavigateCommand(data) {
    this.logger.info(`Received navigate command with ${data.waypoints.length} waypoints`);
    
    // Check if system is running
    if (!this.isRunning) {
      this.logger.error('Cannot execute navigate command: system is not running');
      return;
    }
    
    // Check if it's safe to operate
    if (!this.safetyMonitor.isSafeToOperate()) {
      this.logger.error('Cannot execute navigate command: safety violation');
      return;
    }
    
    // Set waypoints and start navigation
    this.navigationSystem.setWaypoints(data.waypoints);
    this.navigationSystem.startNavigation();
  }
  
  /**
   * Handle stop command
   * @private
   */
  _handleStopCommand(data) {
    this.logger.info('Received stop command');
    
    // Stop navigation
    this.navigationSystem.stopNavigation();
    
    // Stop motors
    this.motorController.setTargetSpeed(0);
  }
  
  /**
   * Handle emergency stop command
   * @private
   */
  _handleEmergencyStopCommand(data) {
    this.logger.info(`Received emergency stop command: ${data.reason}`);
    
    // Trigger emergency stop
    this.motorController.emergencyStop();
  }
  
  /**
   * Handle set boundaries command
   * @private
   */
  _handleSetBoundariesCommand(data) {
    this.logger.info(`Received set boundaries command with ${data.points.length} points`);
    
    // Set field boundaries
    this.navigationSystem.setFieldBoundaries(data.points);
  }
}

// Create and export app instance
const app = new SevakApp();

module.exports = app;