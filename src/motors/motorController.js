/**
 * Sevak Mini Tractor - Motor Controller
 * 
 * Manages the electric motors that drive the tractor, providing interfaces
 * for speed control, steering, and motor health monitoring.
 */

const Logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');
const config = require('../config');

class MotorController {
  constructor() {
    this.logger = new Logger('MotorController');
    
    // Motor state
    this.motors = {
      frontLeft: {
        speed: 0,         // Current speed (0-1)
        targetSpeed: 0,   // Target speed (0-1)
        current: 0,       // Current draw (amps)
        temperature: 0,   // Temperature (°C)
        health: 'good'    // Motor health status
      },
      frontRight: {
        speed: 0,
        targetSpeed: 0,
        current: 0,
        temperature: 0,
        health: 'good'
      },
      rearLeft: {
        speed: 0,
        targetSpeed: 0,
        current: 0,
        temperature: 0,
        health: 'good'
      },
      rearRight: {
        speed: 0,
        targetSpeed: 0,
        current: 0,
        temperature: 0,
        health: 'good'
      }
    };
    
    // Vehicle motion state
    this.motion = {
      speed: 0,              // Current speed in m/s
      targetSpeed: 0,        // Target speed in m/s
      direction: 0,          // Direction in radians (0 = forward)
      targetDirection: 0,    // Target direction in radians
      acceleration: 0,       // Current acceleration in m/s²
      maxSpeed: config.motors.maxSpeed / 3.6, // Convert km/h to m/s
      maxAcceleration: config.motors.maxAcceleration,
      maxDeceleration: config.motors.maxDeceleration
    };
    
    // PID controller parameters
    this.pid = {
      kp: config.motors.motorControllerParams.kp,
      ki: config.motors.motorControllerParams.ki,
      kd: config.motors.motorControllerParams.kd,
      integral: 0,
      previousError: 0,
      dt: 0.02  // 50Hz control loop
    };
    
    // Safety flags
    this.safetyFlags = {
      emergencyStop: false,
      overTemperature: false,
      overCurrent: false,
      motorFault: false
    };
    
    // Control loop interval
    this.controlLoopInterval = null;
    
    this.logger.info('Motor Controller initialized');
  }
  
  /**
   * Initialize the motor controller
   */
  async initialize() {
    this.logger.info('Initializing motor controller...');
    
    try {
      // In a real implementation, this would initialize actual motor hardware
      // For this prototype, we'll simulate the motors
      
      // Start control loop
      this.startControlLoop();
      
      // Subscribe to sensor updates
      this._subscribeToSensorUpdates();
      
      this.logger.info('Motor controller initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize motor controller: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Subscribe to relevant sensor updates
   * @private
   */
  _subscribeToSensorUpdates() {
    // Subscribe to temperature sensor updates
    eventBus.subscribe('sensor.temperatureSensors.updated', (data) => {
      this._updateMotorTemperatures(data);
    });
    
    // Subscribe to power monitor updates
    eventBus.subscribe('sensor.powerMonitors.updated', (data) => {
      this._updateMotorCurrents(data);
    });
  }
  
  /**
   * Update motor temperatures from sensor data
   * @private
   */
  _updateMotorTemperatures(data) {
    this.motors.frontLeft.temperature = data.motorFrontLeft;
    this.motors.frontRight.temperature = data.motorFrontRight;
    this.motors.rearLeft.temperature = data.motorRearLeft;
    this.motors.rearRight.temperature = data.motorRearRight;
    
    // Check for overtemperature conditions
    const warningThreshold = config.sensors.temperatureSensors.warningThreshold;
    const criticalThreshold = config.sensors.temperatureSensors.criticalThreshold;
    
    let overTemp = false;
    
    Object.keys(this.motors).forEach(motor => {
      const temp = this.motors[motor].temperature;
      
      if (temp > criticalThreshold) {
        this.motors[motor].health = 'critical';
        overTemp = true;
        this.logger.error(`Critical temperature in ${motor} motor: ${temp}°C`);
      } else if (temp > warningThreshold) {
        this.motors[motor].health = 'warning';
        this.logger.warn(`High temperature in ${motor} motor: ${temp}°C`);
      } else {
        this.motors[motor].health = 'good';
      }
    });
    
    // Update safety flag
    if (this.safetyFlags.overTemperature !== overTemp) {
      this.safetyFlags.overTemperature = overTemp;
      
      if (overTemp) {
        // Trigger safety measures
        this._handleSafetyEvent('overTemperature');
      }
    }
  }
  
  /**
   * Update motor currents from sensor data
   * @private
   */
  _updateMotorCurrents(data) {
    this.motors.frontLeft.current = data.motorCurrents.frontLeft;
    this.motors.frontRight.current = data.motorCurrents.frontRight;
    this.motors.rearLeft.current = data.motorCurrents.rearLeft;
    this.motors.rearRight.current = data.motorCurrents.rearRight;
    
    // Check for overcurrent conditions
    const currentThreshold = 10; // Amps, would be from config in real implementation
    
    let overCurrent = false;
    
    Object.keys(this.motors).forEach(motor => {
      const current = this.motors[motor].current;
      
      if (current > currentThreshold) {
        overCurrent = true;
        this.logger.warn(`High current in ${motor} motor: ${current}A`);
      }
    });
    
    // Update safety flag
    if (this.safetyFlags.overCurrent !== overCurrent) {
      this.safetyFlags.overCurrent = overCurrent;
      
      if (overCurrent) {
        // Trigger safety measures
        this._handleSafetyEvent('overCurrent');
      }
    }
  }
  
  /**
   * Start the motor control loop
   */
  startControlLoop() {
    this.logger.info('Starting motor control loop');
    
    // Run control loop at 50Hz
    this.controlLoopInterval = setInterval(() => {
      this._controlLoop();
    }, this.pid.dt * 1000);
  }
  
  /**
   * Stop the motor control loop
   */
  stopControlLoop() {
    this.logger.info('Stopping motor control loop');
    
    if (this.controlLoopInterval) {
      clearInterval(this.controlLoopInterval);
      this.controlLoopInterval = null;
    }
  }
  
  /**
   * Main control loop for motor control
   * @private
   */
  _controlLoop() {
    // Skip if emergency stop is active
    if (this.safetyFlags.emergencyStop) {
      this._setAllMotorSpeeds(0);
      return;
    }
    
    // Update vehicle speed using PID control
    this._updateVehicleSpeed();
    
    // Calculate individual motor speeds based on direction
    this._calculateMotorSpeeds();
    
    // Apply motor speeds
    this._applyMotorSpeeds();
    
    // Publish motor status
    this._publishMotorStatus();
  }
  
  /**
   * Update vehicle speed using PID control
   * @private
   */
  _updateVehicleSpeed() {
    // Calculate error
    const error = this.motion.targetSpeed - this.motion.speed;
    
    // Calculate PID terms
    const p = this.pid.kp * error;
    this.pid.integral += error * this.pid.dt;
    const i = this.pid.ki * this.pid.integral;
    const d = this.pid.kd * (error - this.pid.previousError) / this.pid.dt;
    
    // Calculate acceleration
    let acceleration = p + i + d;
    
    // Limit acceleration
    if (acceleration > 0) {
      acceleration = Math.min(acceleration, this.motion.maxAcceleration);
    } else {
      acceleration = Math.max(acceleration, -this.motion.maxDeceleration);
    }
    
    // Update speed
    this.motion.speed += acceleration * this.pid.dt;
    
    // Limit speed
    this.motion.speed = Math.max(0, Math.min(this.motion.speed, this.motion.maxSpeed));
    
    // Update state
    this.motion.acceleration = acceleration;
    this.pid.previousError = error;
  }
  
  /**
   * Calculate individual motor speeds based on direction
   * @private
   */
  _calculateMotorSpeeds() {
    // Normalize speed to 0-1 range
    const normalizedSpeed = this.motion.speed / this.motion.maxSpeed;
    
    // Calculate steering factor (-1 to 1)
    // 0 = straight, positive = right turn, negative = left turn
    const steeringFactor = Math.sin(this.motion.targetDirection);
    
    // Calculate motor speeds based on steering
    if (steeringFactor > 0) {
      // Turning right
      this.motors.frontLeft.targetSpeed = normalizedSpeed;
      this.motors.rearLeft.targetSpeed = normalizedSpeed;
      this.motors.frontRight.targetSpeed = normalizedSpeed * (1 - steeringFactor);
      this.motors.rearRight.targetSpeed = normalizedSpeed * (1 - steeringFactor);
    } else if (steeringFactor < 0) {
      // Turning left
      this.motors.frontLeft.targetSpeed = normalizedSpeed * (1 + steeringFactor);
      this.motors.rearLeft.targetSpeed = normalizedSpeed * (1 + steeringFactor);
      this.motors.frontRight.targetSpeed = normalizedSpeed;
      this.motors.rearRight.targetSpeed = normalizedSpeed;
    } else {
      // Straight
      this.motors.frontLeft.targetSpeed = normalizedSpeed;
      this.motors.rearLeft.targetSpeed = normalizedSpeed;
      this.motors.frontRight.targetSpeed = normalizedSpeed;
      this.motors.rearRight.targetSpeed = normalizedSpeed;
    }
  }
  
  /**
   * Apply calculated speeds to motors
   * @private
   */
  _applyMotorSpeeds() {
    // In a real implementation, this would send commands to actual motor controllers
    // For this prototype, we'll simulate motor behavior
    
    const motorNames = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];
    
    motorNames.forEach(motor => {
      // Simulate motor response (gradual approach to target speed)
      const diff = this.motors[motor].targetSpeed - this.motors[motor].speed;
      const step = Math.min(Math.abs(diff), 0.05) * Math.sign(diff);
      this.motors[motor].speed += step;
    });
  }
  
  /**
   * Set all motor speeds to the same value
   * @private
   */
  _setAllMotorSpeeds(speed) {
    Object.keys(this.motors).forEach(motor => {
      this.motors[motor].speed = speed;
      this.motors[motor].targetSpeed = speed;
    });
  }
  
  /**
   * Publish motor status to event bus
   * @private
   */
  _publishMotorStatus() {
    const status = {
      motors: { ...this.motors },
      motion: { ...this.motion },
      safetyFlags: { ...this.safetyFlags },
      timestamp: Date.now()
    };
    
    eventBus.publish('motor.status.updated', status);
  }
  
  /**
   * Handle safety events
   * @private
   */
  _handleSafetyEvent(eventType) {
    this.logger.warn(`Safety event triggered: ${eventType}`);
    
    switch (eventType) {
      case 'emergencyStop':
        // Immediately stop all motors
        this._setAllMotorSpeeds(0);
        this.motion.speed = 0;
        this.motion.targetSpeed = 0;
        break;
        
      case 'overTemperature':
        // Reduce power to affected motors
        this.motion.maxSpeed = this.motion.maxSpeed * 0.7;
        this.logger.warn('Reducing maximum speed due to high motor temperature');
        break;
        
      case 'overCurrent':
        // Reduce acceleration
        this.motion.maxAcceleration = this.motion.maxAcceleration * 0.7;
        this.logger.warn('Reducing maximum acceleration due to high motor current');
        break;
        
      case 'motorFault':
        // Enter limp mode
        this.motion.maxSpeed = this.motion.maxSpeed * 0.5;
        this.motion.maxAcceleration = this.motion.maxAcceleration * 0.5;
        this.logger.warn('Entering limp mode due to motor fault');
        break;
    }
    
    // Notify safety system
    eventBus.publish('safety.event', {
      source: 'motorController',
      eventType: eventType,
      severity: eventType === 'emergencyStop' ? 'critical' : 'warning',
      timestamp: Date.now()
    });
  }
  
  /**
   * Set target speed for the vehicle
   * @param {number} speed - Target speed in m/s
   */
  setTargetSpeed(speed) {
    // Validate input
    if (typeof speed !== 'number' || isNaN(speed)) {
      this.logger.error(`Invalid speed value: ${speed}`);
      return false;
    }
    
    // Limit to maximum speed
    const limitedSpeed = Math.max(0, Math.min(speed, this.motion.maxSpeed));
    
    if (limitedSpeed !== speed) {
      this.logger.warn(`Speed limited from ${speed} to ${limitedSpeed} m/s`);
    }
    
    this.motion.targetSpeed = limitedSpeed;
    this.logger.info(`Target speed set to ${limitedSpeed} m/s`);
    
    return true;
  }
  
  /**
   * Set target direction for the vehicle
   * @param {number} direction - Target direction in radians
   */
  setTargetDirection(direction) {
    // Validate input
    if (typeof direction !== 'number' || isNaN(direction)) {
      this.logger.error(`Invalid direction value: ${direction}`);
      return false;
    }
    
    // Normalize direction to -PI to PI
    const normalizedDirection = ((direction + Math.PI) % (2 * Math.PI)) - Math.PI;
    
    // Limit to maximum steering angle
    const maxAngle = config.motors.steeringMaxAngle * Math.PI / 180;
    const limitedDirection = Math.max(-maxAngle, Math.min(normalizedDirection, maxAngle));
    
    if (limitedDirection !== normalizedDirection) {
      this.logger.warn(`Direction limited from ${normalizedDirection} to ${limitedDirection} radians`);
    }
    
    this.motion.targetDirection = limitedDirection;
    this.logger.info(`Target direction set to ${limitedDirection} radians`);
    
    return true;
  }
  
  /**
   * Emergency stop
   */
  emergencyStop() {
    this.logger.critical('Emergency stop activated', true);
    
    this.safetyFlags.emergencyStop = true;
    this._handleSafetyEvent('emergencyStop');
    
    return true;
  }
  
  /**
   * Reset emergency stop
   */
  resetEmergencyStop() {
    if (!this.safetyFlags.emergencyStop) {
      return true;
    }
    
    this.logger.info('Resetting emergency stop');
    
    // Check if it's safe to reset
    if (this.safetyFlags.overTemperature || 
        this.safetyFlags.overCurrent || 
        this.safetyFlags.motorFault) {
      this.logger.error('Cannot reset emergency stop: safety issues still present');
      return false;
    }
    
    this.safetyFlags.emergencyStop = false;
    this.logger.info('Emergency stop reset');
    
    return true;
  }
  
  /**
   * Get current motor status
   * @returns {object} Current motor status
   */
  getStatus() {
    return {
      motors: { ...this.motors },
      motion: { ...this.motion },
      safetyFlags: { ...this.safetyFlags }
    };
  }
  
  /**
   * Get current vehicle speed
   * @returns {number} Current speed in m/s
   */
  getCurrentSpeed() {
    return this.motion.speed;
  }
  
  /**
   * Shutdown the motor controller
   */
  async shutdown() {
    this.logger.info('Shutting down motor controller...');
    
    // Stop control loop
    this.stopControlLoop();
    
    // Stop all motors
    this._setAllMotorSpeeds(0);
    
    // Unsubscribe from events
    // In a real implementation, we would unsubscribe from all events
    
    this.logger.info('Motor controller shut down');
    return true;
  }
}

module.exports = MotorController;