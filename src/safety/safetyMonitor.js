/**
 * Sevak Mini Tractor - Safety Monitor
 * 
 * Monitors system safety parameters and implements fail-safe behaviors
 * when unsafe conditions are detected.
 */

const Logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');
const config = require('../config');

class SafetyMonitor {
  constructor() {
    this.logger = new Logger('SafetyMonitor');
    
    // Safety state
    this.safetyState = {
      emergencyStopActive: false,
      safetyViolations: [],
      currentViolations: {
        obstacleProximity: false,
        humanProximity: false,
        boundaryViolation: false,
        motorOverheat: false,
        motorOvercurrent: false,
        batteryLow: false,
        batteryCritical: false,
        tiltExceeded: false,
        communicationLoss: false,
        watchdogTimeout: false
      },
      failSafeMode: config.safety.failSafeMode,
      lastEmergencyStop: null,
      lastSafetyCheck: Date.now()
    };
    
    // Safety thresholds
    this.thresholds = {
      obstacleSafeDistance: config.safety.obstacleSafeDistance,
      humanSafeDistance: config.safety.humanSafeDistance,
      maxSlopeAngle: config.safety.maxSlopeAngle,
      batteryLowThreshold: config.safety.batteryLowThreshold,
      batteryCriticalThreshold: config.safety.batteryCriticalThreshold,
      watchdogTimeout: config.safety.watchdogTimeout
    };
    
    // Watchdog timer
    this.watchdogTimer = null;
    this.lastWatchdogReset = Date.now();
    
    // Safety check interval
    this.safetyCheckInterval = null;
    
    this.logger.info('Safety Monitor initialized');
  }
  
  /**
   * Initialize the safety monitor
   */
  async initialize() {
    this.logger.info('Initializing safety monitor...');
    
    try {
      // Subscribe to safety-related events
      this._subscribeToEvents();
      
      // Start watchdog timer
      this._startWatchdog();
      
      // Start safety check loop
      this._startSafetyCheckLoop();
      
      this.logger.info('Safety monitor initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize safety monitor: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Subscribe to safety-related events
   * @private
   */
  _subscribeToEvents() {
    // Subscribe to obstacle detection events
    eventBus.subscribe('navigation.obstacleAvoidance.started', (data) => {
      this._handleObstacleDetection(data);
    });
    
    // Subscribe to boundary violation events
    eventBus.subscribe('navigation.boundaryViolation', (data) => {
      this._handleBoundaryViolation(data);
    });
    
    // Subscribe to motor status events
    eventBus.subscribe('motor.status.updated', (data) => {
      this._handleMotorStatus(data);
    });
    
    // Subscribe to power monitoring events
    eventBus.subscribe('sensor.powerMonitors.updated', (data) => {
      this._handlePowerStatus(data);
    });
    
    // Subscribe to orientation events
    eventBus.subscribe('sensor.imu.updated', (data) => {
      this._handleOrientationData(data);
    });
    
    // Subscribe to emergency stop events
    eventBus.subscribe('safety.emergencyStop.triggered', (data) => {
      this._handleEmergencyStop(data);
    });
    
    // Subscribe to emergency stop command events
    eventBus.subscribe('command.emergencyStop', (data) => {
      this.triggerEmergencyStop(data.reason, data.source);
    });
  }
  
  /**
   * Start watchdog timer
   * @private
   */
  _startWatchdog() {
    this.logger.info('Starting watchdog timer');
    
    // Clear any existing watchdog timer
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
    
    // Start new watchdog timer
    this.watchdogTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceReset = now - this.lastWatchdogReset;
      
      if (timeSinceReset > this.thresholds.watchdogTimeout) {
        this.logger.critical('Watchdog timeout detected', true);
        this._triggerSafetyViolation('watchdogTimeout', 'Watchdog timer expired');
      }
    }, Math.floor(this.thresholds.watchdogTimeout / 2)); // Check at half the timeout period
    
    // Initial reset
    this.resetWatchdog();
  }
  
  /**
   * Reset watchdog timer
   */
  resetWatchdog() {
    this.lastWatchdogReset = Date.now();
    
    // Clear watchdog timeout violation if it was active
    if (this.safetyState.currentViolations.watchdogTimeout) {
      this.safetyState.currentViolations.watchdogTimeout = false;
      this.logger.info('Watchdog timeout violation cleared');
    }
  }
  
  /**
   * Start safety check loop
   * @private
   */
  _startSafetyCheckLoop() {
    this.logger.info('Starting safety check loop');
    
    // Clear any existing safety check interval
    if (this.safetyCheckInterval) {
      clearInterval(this.safetyCheckInterval);
    }
    
    // Start new safety check interval (run at 5Hz)
    this.safetyCheckInterval = setInterval(() => {
      this._performSafetyCheck();
    }, 200);
  }
  
  /**
   * Perform regular safety check
   * @private
   */
  _performSafetyCheck() {
    const now = Date.now();
    this.safetyState.lastSafetyCheck = now;
    
    // Check for communication loss
    const timeSinceWatchdogReset = now - this.lastWatchdogReset;
    if (timeSinceWatchdogReset > (this.thresholds.watchdogTimeout * 0.8) && 
        !this.safetyState.currentViolations.communicationLoss) {
      this.logger.warn('Communication delay detected');
      this.safetyState.currentViolations.communicationLoss = true;
    } else if (timeSinceWatchdogReset < (this.thresholds.watchdogTimeout * 0.5) && 
               this.safetyState.currentViolations.communicationLoss) {
      this.logger.info('Communication delay resolved');
      this.safetyState.currentViolations.communicationLoss = false;
    }
    
    // Publish safety status
    this._publishSafetyStatus();
  }
  
  /**
   * Handle obstacle detection
   * @private
   */
  _handleObstacleDetection(data) {
    // Check if any obstacles are too close
    const criticalObstacles = data.obstacles.filter(obstacle => {
      // Calculate distance to obstacle
      const dx = obstacle.position.x - data.position.x;
      const dy = obstacle.position.y - data.position.y;
      const dz = obstacle.position.z - data.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Check if obstacle is within safe distance
      return distance < this.thresholds.obstacleSafeDistance;
    });
    
    // Update safety state
    const wasViolation = this.safetyState.currentViolations.obstacleProximity;
    this.safetyState.currentViolations.obstacleProximity = criticalObstacles.length > 0;
    
    // Handle violation state change
    if (this.safetyState.currentViolations.obstacleProximity && !wasViolation) {
      this._triggerSafetyViolation('obstacleProximity', 'Obstacle too close to tractor');
    } else if (!this.safetyState.currentViolations.obstacleProximity && wasViolation) {
      this._clearSafetyViolation('obstacleProximity');
    }
  }
  
  /**
   * Handle boundary violation
   * @private
   */
  _handleBoundaryViolation(data) {
    // Update safety state
    const wasViolation = this.safetyState.currentViolations.boundaryViolation;
    this.safetyState.currentViolations.boundaryViolation = true;
    
    // Handle violation state change
    if (!wasViolation) {
      this._triggerSafetyViolation('boundaryViolation', 'Tractor outside defined boundaries');
    }
  }
  
  /**
   * Handle motor status update
   * @private
   */
  _handleMotorStatus(data) {
    // Check for motor overheating
    let motorOverheat = false;
    let motorOvercurrent = false;
    
    // Check each motor
    Object.keys(data.motors).forEach(motorName => {
      const motor = data.motors[motorName];
      
      // Check temperature
      if (motor.temperature > config.sensors.temperatureSensors.criticalThreshold) {
        motorOverheat = true;
      }
      
      // Check current (threshold would be defined in a real implementation)
      if (motor.current > 10) { // Example threshold
        motorOvercurrent = true;
      }
    });
    
    // Update safety state for overheating
    const wasOverheatViolation = this.safetyState.currentViolations.motorOverheat;
    this.safetyState.currentViolations.motorOverheat = motorOverheat;
    
    // Handle overheat violation state change
    if (motorOverheat && !wasOverheatViolation) {
      this._triggerSafetyViolation('motorOverheat', 'Motor temperature critical');
    } else if (!motorOverheat && wasOverheatViolation) {
      this._clearSafetyViolation('motorOverheat');
    }
    
    // Update safety state for overcurrent
    const wasOvercurrentViolation = this.safetyState.currentViolations.motorOvercurrent;
    this.safetyState.currentViolations.motorOvercurrent = motorOvercurrent;
    
    // Handle overcurrent violation state change
    if (motorOvercurrent && !wasOvercurrentViolation) {
      this._triggerSafetyViolation('motorOvercurrent', 'Motor current too high');
    } else if (!motorOvercurrent && wasOvercurrentViolation) {
      this._clearSafetyViolation('motorOvercurrent');
    }
  }
  
  /**
   * Handle power status update
   * @private
   */
  _handlePowerStatus(data) {
    // Check battery level
    const batteryLevel = data.batteryLevel;
    
    // Check for low battery
    const wasLowBattery = this.safetyState.currentViolations.batteryLow;
    this.safetyState.currentViolations.batteryLow = 
      batteryLevel <= this.thresholds.batteryLowThreshold;
    
    // Handle low battery state change
    if (this.safetyState.currentViolations.batteryLow && !wasLowBattery) {
      this._triggerSafetyViolation('batteryLow', 'Battery level low');
    } else if (!this.safetyState.currentViolations.batteryLow && wasLowBattery) {
      this._clearSafetyViolation('batteryLow');
    }
    
    // Check for critical battery
    const wasCriticalBattery = this.safetyState.currentViolations.batteryCritical;
    this.safetyState.currentViolations.batteryCritical = 
      batteryLevel <= this.thresholds.batteryCriticalThreshold;
    
    // Handle critical battery state change
    if (this.safetyState.currentViolations.batteryCritical && !wasCriticalBattery) {
      this._triggerSafetyViolation('batteryCritical', 'Battery level critical');
    } else if (!this.safetyState.currentViolations.batteryCritical && wasCriticalBattery) {
      this._clearSafetyViolation('batteryCritical');
    }
  }
  
  /**
   * Handle orientation data
   * @private
   */
  _handleOrientationData(data) {
    // Calculate tilt angle from roll and pitch
    const roll = data.orientation.roll;
    const pitch = data.orientation.pitch;
    const tiltAngle = Math.sqrt(roll * roll + pitch * pitch) * (180 / Math.PI); // Convert to degrees
    
    // Check if tilt exceeds maximum slope angle
    const wasTiltExceeded = this.safetyState.currentViolations.tiltExceeded;
    this.safetyState.currentViolations.tiltExceeded = tiltAngle > this.thresholds.maxSlopeAngle;
    
    // Handle tilt violation state change
    if (this.safetyState.currentViolations.tiltExceeded && !wasTiltExceeded) {
      this._triggerSafetyViolation('tiltExceeded', 'Maximum safe tilt angle exceeded');
    } else if (!this.safetyState.currentViolations.tiltExceeded && wasTiltExceeded) {
      this._clearSafetyViolation('tiltExceeded');
    }
  }
  
  /**
   * Handle emergency stop event
   * @private
   */
  _handleEmergencyStop(data) {
    this.logger.critical(`Emergency stop triggered: ${data.reason}`, true);
    
    // Update safety state
    this.safetyState.emergencyStopActive = true;
    this.safetyState.lastEmergencyStop = {
      timestamp: Date.now(),
      reason: data.reason,
      source: data.source
    };
    
    // Add to violations list
    this.safetyState.safetyViolations.push({
      type: 'emergencyStop',
      timestamp: Date.now(),
      message: `Emergency stop triggered: ${data.reason}`,
      source: data.source
    });
    
    // Publish emergency stop event
    eventBus.publish('safety.emergencyStop.activated', {
      timestamp: Date.now(),
      reason: data.reason,
      source: data.source
    });
  }
  
  /**
   * Trigger safety violation
   * @private
   */
  _triggerSafetyViolation(violationType, message) {
    this.logger.warn(`Safety violation: ${message}`);
    
    // Add to violations list
    this.safetyState.safetyViolations.push({
      type: violationType,
      timestamp: Date.now(),
      message: message
    });
    
    // Determine severity
    let severity = 'warning';
    let requiresEmergencyStop = false;
    
    // Define critical violations that require emergency stop
    const criticalViolations = [
      'humanProximity',
      'tiltExceeded',
      'watchdogTimeout',
      'batteryCritical'
    ];
    
    if (criticalViolations.includes(violationType)) {
      severity = 'critical';
      requiresEmergencyStop = true;
    }
    
    // Publish safety violation event
    eventBus.publish('safety.violation', {
      type: violationType,
      message: message,
      severity: severity,
      timestamp: Date.now()
    });
    
    // Trigger emergency stop for critical violations
    if (requiresEmergencyStop && !this.safetyState.emergencyStopActive) {
      this.triggerEmergencyStop(message, 'safetyMonitor');
    }
  }
  
  /**
   * Clear safety violation
   * @private
   */
  _clearSafetyViolation(violationType) {
    this.logger.info(`Safety violation cleared: ${violationType}`);
    
    // Publish safety violation cleared event
    eventBus.publish('safety.violation.cleared', {
      type: violationType,
      timestamp: Date.now()
    });
  }
  
  /**
   * Publish safety status
   * @private
   */
  _publishSafetyStatus() {
    const status = {
      emergencyStopActive: this.safetyState.emergencyStopActive,
      currentViolations: { ...this.safetyState.currentViolations },
      hasActiveViolations: Object.values(this.safetyState.currentViolations).some(v => v),
      failSafeMode: this.safetyState.failSafeMode,
      lastSafetyCheck: this.safetyState.lastSafetyCheck,
      timestamp: Date.now()
    };
    
    eventBus.publish('safety.status.updated', status);
  }
  
  /**
   * Trigger emergency stop
   * @param {string} reason - Reason for emergency stop
   * @param {string} source - Source of emergency stop trigger
   */
  triggerEmergencyStop(reason, source) {
    if (this.safetyState.emergencyStopActive) {
      return; // Already in emergency stop
    }
    
    this.logger.critical(`Triggering emergency stop: ${reason}`, true);
    
    // Update safety state
    this.safetyState.emergencyStopActive = true;
    this.safetyState.lastEmergencyStop = {
      timestamp: Date.now(),
      reason: reason,
      source: source
    };
    
    // Publish emergency stop event
    eventBus.publish('safety.emergencyStop.triggered', {
      reason: reason,
      source: source,
      timestamp: Date.now()
    });
  }
  
  /**
   * Reset emergency stop
   * @returns {boolean} Success
   */
  resetEmergencyStop() {
    if (!this.safetyState.emergencyStopActive) {
      return true; // Not in emergency stop
    }
    
    // Check if it's safe to reset
    if (this._hasCriticalViolations()) {
      this.logger.error('Cannot reset emergency stop: critical safety violations still present');
      return false;
    }
    
    this.logger.info('Resetting emergency stop');
    
    // Update safety state
    this.safetyState.emergencyStopActive = false;
    
    // Publish emergency stop reset event
    eventBus.publish('safety.emergencyStop.reset', {
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * Check if there are any critical safety violations
   * @private
   */
  _hasCriticalViolations() {
    // Define critical violations
    const criticalViolations = [
      'humanProximity',
      'tiltExceeded',
      'watchdogTimeout',
      'batteryCritical'
    ];
    
    // Check if any critical violations are active
    return criticalViolations.some(violation => 
      this.safetyState.currentViolations[violation]
    );
  }
  
  /**
   * Check if it's safe to operate
   * @returns {boolean} True if safe to operate
   */
  isSafeToOperate() {
    // Not safe if emergency stop is active
    if (this.safetyState.emergencyStopActive) {
      return false;
    }
    
    // Not safe if there are critical violations
    if (this._hasCriticalViolations()) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get current safety status
   * @returns {object} Safety status
   */
  getStatus() {
    return {
      emergencyStopActive: this.safetyState.emergencyStopActive,
      currentViolations: { ...this.safetyState.currentViolations },
      hasActiveViolations: Object.values(this.safetyState.currentViolations).some(v => v),
      failSafeMode: this.safetyState.failSafeMode,
      isSafeToOperate: this.isSafeToOperate(),
      lastSafetyCheck: this.safetyState.lastSafetyCheck
    };
  }
  
  /**
   * Shutdown the safety monitor
   */
  async shutdown() {
    this.logger.info('Shutting down safety monitor...');
    
    // Stop watchdog timer
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    
    // Stop safety check loop
    if (this.safetyCheckInterval) {
      clearInterval(this.safetyCheckInterval);
      this.safetyCheckInterval = null;
    }
    
    // Unsubscribe from events
    // In a real implementation, we would unsubscribe from all events
    
    this.logger.info('Safety monitor shut down');
    return true;
  }
}

module.exports = SafetyMonitor;