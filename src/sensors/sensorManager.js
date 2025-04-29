/**
 * Sevak Mini Tractor - Sensor Manager
 * 
 * Manages all sensors on the tractor, including data acquisition,
 * processing, and distribution to other system components.
 */

const Logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');
const config = require('../config');
const SensorFusion = require('../utils/sensorFusion');

class SensorManager {
  constructor() {
    this.logger = new Logger('SensorManager');
    
    // Initialize sensor fusion
    this.sensorFusion = new SensorFusion();
    
    // Sensor states
    this.sensors = {
      gps: {
        connected: false,
        lastUpdate: 0,
        data: {
          latitude: 0,
          longitude: 0,
          altitude: 0,
          accuracy: 0,
          speed: 0,
          heading: 0
        }
      },
      imu: {
        connected: false,
        lastUpdate: 0,
        data: {
          acceleration: { x: 0, y: 0, z: 0 },
          gyroscope: { x: 0, y: 0, z: 0 },
          magnetometer: { x: 0, y: 0, z: 0 },
          orientation: { roll: 0, pitch: 0, yaw: 0 }
        }
      },
      lidar: {
        connected: false,
        lastUpdate: 0,
        data: {
          points: [],
          scanTime: 0
        }
      },
      ultrasonicSensors: {
        connected: false,
        lastUpdate: 0,
        data: {
          sensors: [
            { id: 'front_left', distance: 0, maxRange: 4.0 },
            { id: 'front_center', distance: 0, maxRange: 4.0 },
            { id: 'front_right', distance: 0, maxRange: 4.0 },
            { id: 'rear_left', distance: 0, maxRange: 4.0 },
            { id: 'rear_center', distance: 0, maxRange: 4.0 },
            { id: 'rear_right', distance: 0, maxRange: 4.0 },
            { id: 'left_center', distance: 0, maxRange: 4.0 },
            { id: 'right_center', distance: 0, maxRange: 4.0 }
          ]
        }
      },
      temperatureSensors: {
        connected: false,
        lastUpdate: 0,
        data: {
          ambient: 0,
          motorFrontLeft: 0,
          motorFrontRight: 0,
          motorRearLeft: 0,
          motorRearRight: 0,
          controllerMain: 0,
          batteryPack: 0
        }
      },
      powerMonitors: {
        connected: false,
        lastUpdate: 0,
        data: {
          batteryVoltage: 0,
          batteryCurrent: 0,
          batteryLevel: 0, // Percentage
          motorCurrents: {
            frontLeft: 0,
            frontRight: 0,
            rearLeft: 0,
            rearRight: 0
          },
          powerConsumption: 0 // Watts
        }
      },
      camera: {
        connected: false,
        lastUpdate: 0,
        data: {
          imageAvailable: false,
          resolution: { width: 0, height: 0 }
        }
      }
    };
    
    // Sensor update intervals (in milliseconds)
    this.updateIntervals = {
      gps: config.sensors.gps.updateInterval,
      imu: config.sensors.imu.updateInterval,
      lidar: config.sensors.lidar.updateInterval,
      ultrasonicSensors: config.sensors.ultrasonicSensors.updateInterval,
/**
   * Initialize all sensors
   */
  async initialize() {
    this.logger.info('Initializing sensors...');
    
    try {
      // Initialize each sensor type
      await this._initializeGPS();
      await this._initializeIMU();
      await this._initializeLidar();
      await this._initializeUltrasonicSensors();
      await this._initializeTemperatureSensors();
      await this._initializePowerMonitors();
      await this._initializeCamera();
      
      // Start sensor update loops
      this._startSensorUpdateLoops();
      
      // Check connection status
      this._updateConnectionStatus();
      
      this.logger.info('Sensors initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize sensors: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Initialize GPS sensor
   * @private
   */
  async _initializeGPS() {
    this.logger.info('Initializing GPS...');
    
    try {
      // In a real implementation, this would initialize the actual GPS hardware
      // For this prototype, we'll simulate the GPS
      
      // Simulate successful connection
      this.sensors.gps.connected = true;
      
      // Reset error counter
      this.errorCounters.gps = 0;
      
      this.logger.info('GPS initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize GPS: ${error.message}`);
      this.sensors.gps.connected = false;
      return false;
    }
  }
  
  /**
   * Initialize IMU sensor
   * @private
   */
  async _initializeIMU() {
    this.logger.info('Initializing IMU...');
    
    try {
      // In a real implementation, this would initialize the actual IMU hardware
      // For this prototype, we'll simulate the IMU
      
      // Simulate successful connection
      this.sensors.imu.connected = true;
      
      // Reset error counter
      this.errorCounters.imu = 0;
      
      this.logger.info('IMU initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize IMU: ${error.message}`);
      this.sensors.imu.connected = false;
      return false;
    }
  }
  
  /**
   * Initialize LIDAR sensor
   * @private
   */
  async _initializeLidar() {
    this.logger.info('Initializing LIDAR...');
    
    try {
      // In a real implementation, this would initialize the actual LIDAR hardware
      // For this prototype, we'll simulate the LIDAR
      
      // Simulate successful connection
      this.sensors.lidar.connected = true;
      
      // Reset error counter
      this.errorCounters.lidar = 0;
      
      this.logger.info('LIDAR initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize LIDAR: ${error.message}`);
      this.sensors.lidar.connected = false;
      return false;
    }
  }
  
  /**
   * Initialize ultrasonic sensors
   * @private
   */
  async _initializeUltrasonicSensors() {
    this.logger.info('Initializing ultrasonic sensors...');
    
    try {
      // In a real implementation, this would initialize the actual ultrasonic sensors
      // For this prototype, we'll simulate the ultrasonic sensors
      
      // Simulate successful connection
      this.sensors.ultrasonicSensors.connected = true;
      
      // Reset error counter
      this.errorCounters.ultrasonicSensors = 0;
      
      this.logger.info('Ultrasonic sensors initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize ultrasonic sensors: ${error.message}`);
      this.sensors.ultrasonicSensors.connected = false;
      return false;
    }
  }
  
  /**
   * Initialize temperature sensors
   * @private
   */
  async _initializeTemperatureSensors() {
    this.logger.info('Initializing temperature sensors...');
    
    try {
      // In a real implementation, this would initialize the actual temperature sensors
      // For this prototype, we'll simulate the temperature sensors
      
      // Simulate successful connection
      this.sensors.temperatureSensors.connected = true;
      
      // Reset error counter
      this.errorCounters.temperatureSensors = 0;
      
      this.logger.info('Temperature sensors initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize temperature sensors: ${error.message}`);
      this.sensors.temperatureSensors.connected = false;
      return false;
    }
  }
  
  /**
   * Initialize power monitors
   * @private
   */
  async _initializePowerMonitors() {
    this.logger.info('Initializing power monitors...');
    
    try {
      // In a real implementation, this would initialize the actual power monitors
      // For this prototype, we'll simulate the power monitors
      
      // Simulate successful connection
      this.sensors.powerMonitors.connected = true;
      
      // Reset error counter
      this.errorCounters.powerMonitors = 0;
      
      this.logger.info('Power monitors initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize power monitors: ${error.message}`);
      this.sensors.powerMonitors.connected = false;
      return false;
    }
  }
  
  /**
   * Initialize camera
   * @private
   */
  async _initializeCamera() {
    this.logger.info('Initializing camera...');
    
    try {
      // In a real implementation, this would initialize the actual camera
      // For this prototype, we'll simulate the camera
      
      // Simulate successful connection
      this.sensors.camera.connected = true;
      
      // Reset error counter
      this.errorCounters.camera = 0;
      
      this.logger.info('Camera initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize camera: ${error.message}`);
      this.sensors.camera.connected = false;
      return false;
    }
  }
/**
   * Start sensor update loops
   * @private
   */
  _startSensorUpdateLoops() {
    this.logger.info('Starting sensor update loops...');
    
    // Start update loops for each sensor type
    this._startGPSUpdateLoop();
    this._startIMUUpdateLoop();
    this._startLidarUpdateLoop();
    this._startUltrasonicSensorsUpdateLoop();
    this._startTemperatureSensorsUpdateLoop();
    this._startPowerMonitorsUpdateLoop();
    this._startCameraUpdateLoop();
    
    this.logger.info('Sensor update loops started');
  }
  
  /**
   * Start GPS update loop
   * @private
   */
  _startGPSUpdateLoop() {
    // Clear any existing timer
    if (this.updateTimers.gps) {
      clearInterval(this.updateTimers.gps);
    }
    
    // Start new update loop
    this.updateTimers.gps = setInterval(() => {
      this._updateGPS();
    }, this.updateIntervals.gps);
  }
  
  /**
   * Start IMU update loop
   * @private
   */
  _startIMUUpdateLoop() {
    // Clear any existing timer
    if (this.updateTimers.imu) {
      clearInterval(this.updateTimers.imu);
    }
    
    // Start new update loop
    this.updateTimers.imu = setInterval(() => {
      this._updateIMU();
    }, this.updateIntervals.imu);
  }
  
  /**
   * Start LIDAR update loop
   * @private
   */
  _startLidarUpdateLoop() {
    // Clear any existing timer
    if (this.updateTimers.lidar) {
      clearInterval(this.updateTimers.lidar);
    }
    
    // Start new update loop
    this.updateTimers.lidar = setInterval(() => {
      this._updateLidar();
    }, this.updateIntervals.lidar);
  }
  
  /**
   * Start ultrasonic sensors update loop
   * @private
   */
  _startUltrasonicSensorsUpdateLoop() {
    // Clear any existing timer
    if (this.updateTimers.ultrasonicSensors) {
      clearInterval(this.updateTimers.ultrasonicSensors);
    }
    
    // Start new update loop
    this.updateTimers.ultrasonicSensors = setInterval(() => {
      this._updateUltrasonicSensors();
    }, this.updateIntervals.ultrasonicSensors);
  }
  
  /**
   * Start temperature sensors update loop
   * @private
   */
  _startTemperatureSensorsUpdateLoop() {
    // Clear any existing timer
    if (this.updateTimers.temperatureSensors) {
      clearInterval(this.updateTimers.temperatureSensors);
    }
    
    // Start new update loop
    this.updateTimers.temperatureSensors = setInterval(() => {
      this._updateTemperatureSensors();
    }, this.updateIntervals.temperatureSensors);
  }
  
  /**
   * Start power monitors update loop
   * @private
   */
  _startPowerMonitorsUpdateLoop() {
    // Clear any existing timer
    if (this.updateTimers.powerMonitors) {
      clearInterval(this.updateTimers.powerMonitors);
    }
    
    // Start new update loop
    this.updateTimers.powerMonitors = setInterval(() => {
      this._updatePowerMonitors();
    }, this.updateIntervals.powerMonitors);
  }
  
  /**
   * Start camera update loop
   * @private
   */
  _startCameraUpdateLoop() {
    // Clear any existing timer
    if (this.updateTimers.camera) {
      clearInterval(this.updateTimers.camera);
    }
    
    // Start new update loop
    this.updateTimers.camera = setInterval(() => {
      this._updateCamera();
    }, this.updateIntervals.camera);
  }
/**
   * Update GPS data
   * @private
   */
  _updateGPS() {
    // Skip if not connected
    if (!this.sensors.gps.connected) {
      return;
    }
    
    try {
      // In a real implementation, this would read data from the actual GPS hardware
      // For this prototype, we'll simulate GPS data
      
      // Simulate GPS data
      const now = Date.now();
      const data = {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.0001,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.0001,
        altitude: 10 + Math.random() * 2,
        accuracy: 2 + Math.random() * 1,
        speed: 1 + Math.random() * 0.5,
        heading: 45 + (Math.random() - 0.5) * 5,
        timestamp: now
      };
      
      // Update sensor data
      this.sensors.gps.data = data;
      this.sensors.gps.lastUpdate = now;
      
      // Reset error counter
      this.errorCounters.gps = 0;
      
      // Publish sensor data
      eventBus.publish('sensor.gps.updated', data);
      
      // Update sensor fusion
      this.sensorFusion.updateGPS(data);
    } catch (error) {
      this.logger.error(`Failed to update GPS: ${error.message}`);
      
      // Increment error counter
      this.errorCounters.gps = (this.errorCounters.gps || 0) + 1;
      
      // Check if too many errors
      if (this.errorCounters.gps > 5) {
        this.logger.error('Too many GPS errors, marking as disconnected');
        this.sensors.gps.connected = false;
      }
    }
  }
  
  /**
   * Update IMU data
   * @private
   */
  _updateIMU() {
    // Skip if not connected
    if (!this.sensors.imu.connected) {
      return;
    }
    
    try {
      // In a real implementation, this would read data from the actual IMU hardware
      // For this prototype, we'll simulate IMU data
      
      // Simulate IMU data
      const now = Date.now();
      const data = {
        acceleration: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
          z: 9.8 + (Math.random() - 0.5) * 0.2
        },
        gyroscope: {
          x: (Math.random() - 0.5) * 0.1,
          y: (Math.random() - 0.5) * 0.1,
          z: (Math.random() - 0.5) * 0.1
        },
        magnetometer: {
          x: 20 + (Math.random() - 0.5) * 2,
          y: 0 + (Math.random() - 0.5) * 2,
          z: 40 + (Math.random() - 0.5) * 2
        },
        orientation: {
          roll: (Math.random() - 0.5) * 0.05,
          pitch: (Math.random() - 0.5) * 0.05,
          yaw: 0.785 + (Math.random() - 0.5) * 0.05 // ~45 degrees
        },
        timestamp: now
      };
      
      // Update sensor data
      this.sensors.imu.data = data;
      this.sensors.imu.lastUpdate = now;
      
      // Reset error counter
      this.errorCounters.imu = 0;
      
      // Publish sensor data
      eventBus.publish('sensor.imu.updated', data);
      
      // Update sensor fusion
      this.sensorFusion.updateIMU(data);
    } catch (error) {
      this.logger.error(`Failed to update IMU: ${error.message}`);
      
      // Increment error counter
      this.errorCounters.imu = (this.errorCounters.imu || 0) + 1;
      
      // Check if too many errors
      if (this.errorCounters.imu > 5) {
        this.logger.error('Too many IMU errors, marking as disconnected');
        this.sensors.imu.connected = false;
      }
    }
  }
  
  /**
   * Update LIDAR data
   * @private
   */
  _updateLidar() {
    // Skip if not connected
    if (!this.sensors.lidar.connected) {
      return;
    }
    
    try {
      // In a real implementation, this would read data from the actual LIDAR hardware
      // For this prototype, we'll simulate LIDAR data
      
      // Simulate LIDAR data
      const now = Date.now();
      const points = [];
      
      // Generate simulated LIDAR points
      const numPoints = 360; // One point per degree
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        
        // Base distance (5-20 meters)
        let distance = 10 + Math.random() * 10;
        
        // Add some obstacles
        if (i > 30 && i < 50) {
          distance = 3 + Math.random() * 2; // Obstacle at 3-5 meters
        } else if (i > 180 && i < 200) {
          distance = 4 + Math.random() * 3; // Obstacle at 4-7 meters
        }
        
        points.push({
          angle: angle,
          distance: distance,
          intensity: 100 + Math.random() * 100
        });
      }
      
      const data = {
        points: points,
        scanTime: 100, // ms
        timestamp: now
      };
      
      // Update sensor data
      this.sensors.lidar.data = data;
      this.sensors.lidar.lastUpdate = now;
      
      // Reset error counter
      this.errorCounters.lidar = 0;
      
      // Publish sensor data
      eventBus.publish('sensor.lidar.updated', data);
      
      // Update sensor fusion
      this.sensorFusion.updateLidar(data);
    } catch (error) {
      this.logger.error(`Failed to update LIDAR: ${error.message}`);
      
      // Increment error counter
      this.errorCounters.lidar = (this.errorCounters.lidar || 0) + 1;
      
      // Check if too many errors
      if (this.errorCounters.lidar > 5) {
        this.logger.error('Too many LIDAR errors, marking as disconnected');
        this.sensors.lidar.connected = false;
      }
    }
  }
/**
   * Update ultrasonic sensors data
   * @private
   */
  _updateUltrasonicSensors() {
    // Skip if not connected
    if (!this.sensors.ultrasonicSensors.connected) {
      return;
    }
    
    try {
      // In a real implementation, this would read data from the actual ultrasonic sensors
      // For this prototype, we'll simulate ultrasonic sensor data
      
      // Simulate ultrasonic sensor data
      const now = Date.now();
      const sensors = this.sensors.ultrasonicSensors.data.sensors.map(sensor => {
        // Base distance (2-4 meters)
        let distance = 3 + Math.random();
        
        // Add some obstacles
        if (sensor.id === 'front_left' || sensor.id === 'front_center') {
          // 20% chance of detecting an obstacle
          if (Math.random() < 0.2) {
            distance = 0.5 + Math.random() * 1.5; // Obstacle at 0.5-2 meters
          }
        }
        
        return {
          ...sensor,
          distance: distance
        };
      });
      
      const data = {
        sensors: sensors,
        timestamp: now
      };
      
      // Update sensor data
      this.sensors.ultrasonicSensors.data = data;
      this.sensors.ultrasonicSensors.lastUpdate = now;
      
      // Reset error counter
      this.errorCounters.ultrasonicSensors = 0;
      
      // Publish sensor data
      eventBus.publish('sensor.ultrasonic.updated', data);
      
      // Update sensor fusion
      this.sensorFusion.updateUltrasonic(data);
    } catch (error) {
      this.logger.error(`Failed to update ultrasonic sensors: ${error.message}`);
      
      // Increment error counter
      this.errorCounters.ultrasonicSensors = (this.errorCounters.ultrasonicSensors || 0) + 1;
      
      // Check if too many errors
      if (this.errorCounters.ultrasonicSensors > 5) {
        this.logger.error('Too many ultrasonic sensor errors, marking as disconnected');
        this.sensors.ultrasonicSensors.connected = false;
      }
    }
  }
  
  /**
   * Update temperature sensors data
   * @private
   */
  _updateTemperatureSensors() {
    // Skip if not connected
    if (!this.sensors.temperatureSensors.connected) {
      return;
    }
    
    try {
      // In a real implementation, this would read data from the actual temperature sensors
      // For this prototype, we'll simulate temperature sensor data
      
      // Simulate temperature sensor data
      const now = Date.now();
      const data = {
        ambient: 25 + (Math.random() - 0.5) * 2,
        motorFrontLeft: 40 + (Math.random() - 0.5) * 5,
        motorFrontRight: 42 + (Math.random() - 0.5) * 5,
        motorRearLeft: 41 + (Math.random() - 0.5) * 5,
        motorRearRight: 43 + (Math.random() - 0.5) * 5,
        controllerMain: 35 + (Math.random() - 0.5) * 3,
        batteryPack: 30 + (Math.random() - 0.5) * 2,
        timestamp: now
      };
      
      // Update sensor data
      this.sensors.temperatureSensors.data = data;
      this.sensors.temperatureSensors.lastUpdate = now;
      
      // Reset error counter
      this.errorCounters.temperatureSensors = 0;
      
      // Publish sensor data
      eventBus.publish('sensor.temperatureSensors.updated', data);
    } catch (error) {
      this.logger.error(`Failed to update temperature sensors: ${error.message}`);
      
      // Increment error counter
      this.errorCounters.temperatureSensors = (this.errorCounters.temperatureSensors || 0) + 1;
      
      // Check if too many errors
      if (this.errorCounters.temperatureSensors > 5) {
        this.logger.error('Too many temperature sensor errors, marking as disconnected');
        this.sensors.temperatureSensors.connected = false;
      }
    }
  }
  
  /**
   * Update power monitors data
   * @private
   */
  _updatePowerMonitors() {
    // Skip if not connected
    if (!this.sensors.powerMonitors.connected) {
      return;
    }
    
    try {
      // In a real implementation, this would read data from the actual power monitors
      // For this prototype, we'll simulate power monitor data
      
      // Simulate power monitor data
      const now = Date.now();
      const data = {
        batteryVoltage: 48 + (Math.random() - 0.5) * 2,
        batteryCurrent: 10 + (Math.random() - 0.5) * 5,
        batteryLevel: 75 + (Math.random() - 0.5) * 2, // Percentage
        motorCurrents: {
          frontLeft: 5 + (Math.random() - 0.5) * 2,
          frontRight: 5.2 + (Math.random() - 0.5) * 2,
          rearLeft: 4.8 + (Math.random() - 0.5) * 2,
          rearRight: 5.1 + (Math.random() - 0.5) * 2
        },
        powerConsumption: 500 + (Math.random() - 0.5) * 100, // Watts
        timestamp: now
      };
      
      // Update sensor data
      this.sensors.powerMonitors.data = data;
      this.sensors.powerMonitors.lastUpdate = now;
      
      // Reset error counter
      this.errorCounters.powerMonitors = 0;
      
      // Publish sensor data
      eventBus.publish('sensor.powerMonitors.updated', data);
    } catch (error) {
      this.logger.error(`Failed to update power monitors: ${error.message}`);
      
      // Increment error counter
      this.errorCounters.powerMonitors = (this.errorCounters.powerMonitors || 0) + 1;
      
      // Check if too many errors
      if (this.errorCounters.powerMonitors > 5) {
        this.logger.error('Too many power monitor errors, marking as disconnected');
        this.sensors.powerMonitors.connected = false;
      }
    }
  }
/**
   * Update camera data
   * @private
   */
  _updateCamera() {
    // Skip if not connected
    if (!this.sensors.camera.connected) {
      return;
    }
    
    try {
      // In a real implementation, this would read data from the actual camera
      // For this prototype, we'll simulate camera data
      
      // Simulate camera data
      const now = Date.now();
      const data = {
        imageAvailable: true,
        resolution: { width: 1280, height: 720 },
        timestamp: now
      };
      
      // Update sensor data
      this.sensors.camera.data = data;
      this.sensors.camera.lastUpdate = now;
      
      // Reset error counter
      this.errorCounters.camera = 0;
      
      // Publish sensor data
      eventBus.publish('sensor.camera.updated', data);
    } catch (error) {
      this.logger.error(`Failed to update camera: ${error.message}`);
      
      // Increment error counter
      this.errorCounters.camera = (this.errorCounters.camera || 0) + 1;
      
      // Check if too many errors
      if (this.errorCounters.camera > 5) {
        this.logger.error('Too many camera errors, marking as disconnected');
        this.sensors.camera.connected = false;
      }
    }
  }
  
  /**
   * Update connection status
   * @private
   */
  _updateConnectionStatus() {
    // Check if all sensors are connected
    const allSensors = [
      this.sensors.gps.connected,
      this.sensors.imu.connected,
      this.sensors.lidar.connected,
      this.sensors.ultrasonicSensors.connected,
      this.sensors.temperatureSensors.connected,
      this.sensors.powerMonitors.connected,
      this.sensors.camera.connected
    ];
    
    const allSensorsConnected = allSensors.every(connected => connected);
    
    // Check if critical sensors are connected
    const criticalSensors = [
      this.sensors.gps.connected,
      this.sensors.imu.connected,
      this.sensors.lidar.connected,
      this.sensors.ultrasonicSensors.connected,
      this.sensors.powerMonitors.connected
    ];
    
    const criticalSensorsConnected = criticalSensors.every(connected => connected);
    
    // Update connection status
    this.connectionStatus.allSensorsConnected = allSensorsConnected;
    this.connectionStatus.criticalSensorsConnected = criticalSensorsConnected;
    
    // Publish connection status
    eventBus.publish('sensor.connectionStatus.updated', {
      allSensorsConnected: allSensorsConnected,
      criticalSensorsConnected: criticalSensorsConnected,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get position and orientation data
   * @returns {object} Position and orientation data
   */
  getPositionAndOrientation() {
    return this.sensorFusion.getPositionAndOrientation();
  }
  
  /**
   * Get sensor status
   * @returns {object} Sensor status
   */
  getSensorStatus() {
    return {
      gps: {
        connected: this.sensors.gps.connected,
        lastUpdate: this.sensors.gps.lastUpdate
      },
      imu: {
        connected: this.sensors.imu.connected,
        lastUpdate: this.sensors.imu.lastUpdate
      },
      lidar: {
        connected: this.sensors.lidar.connected,
        lastUpdate: this.sensors.lidar.lastUpdate
      },
      ultrasonicSensors: {
        connected: this.sensors.ultrasonicSensors.connected,
        lastUpdate: this.sensors.ultrasonicSensors.lastUpdate
      },
      temperatureSensors: {
        connected: this.sensors.temperatureSensors.connected,
        lastUpdate: this.sensors.temperatureSensors.lastUpdate
      },
      powerMonitors: {
        connected: this.sensors.powerMonitors.connected,
        lastUpdate: this.sensors.powerMonitors.lastUpdate
      },
      camera: {
        connected: this.sensors.camera.connected,
        lastUpdate: this.sensors.camera.lastUpdate
      },
      connectionStatus: { ...this.connectionStatus }
    };
  }
  
  /**
   * Shutdown all sensors
   */
  async shutdown() {
    this.logger.info('Shutting down sensors...');
    
    // Stop all update loops
    Object.keys(this.updateTimers).forEach(timer => {
      clearInterval(this.updateTimers[timer]);
    });
    
    // Clear update timers
    this.updateTimers = {};
    
    // Mark all sensors as disconnected
    Object.keys(this.sensors).forEach(sensor => {
      this.sensors[sensor].connected = false;
    });
    
    // Update connection status
    this._updateConnectionStatus();
    
    this.logger.info('Sensors shut down');
    return true;
  }
}

module.exports = SensorManager;
      temperatureSensors: config.sensors.temperatureSensors.updateInterval,
      powerMonitors: config.sensors.powerMonitors.updateInterval,
      camera: config.sensors.camera.updateInterval
    };
    
    // Sensor update timers
    this.updateTimers = {};
    
    // Sensor error counters
    this.errorCounters = {};
    
    // Sensor connection status
    this.connectionStatus = {
      allSensorsConnected: false,
      criticalSensorsConnected: false
    };
    
    this.logger.info('Sensor Manager initialized');
  }