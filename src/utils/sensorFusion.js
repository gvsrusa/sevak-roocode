/**
 * Sevak Mini Tractor - Sensor Fusion
 * 
 * Combines data from multiple sensors to provide accurate position and orientation.
 * Implements an Extended Kalman Filter (EKF) for sensor fusion.
 */

const Logger = require('./logger');

class SensorFusion {
  constructor() {
    this.logger = new Logger('SensorFusion');
    
    // Position and orientation state
    this.state = {
      position: {
        x: 0,
        y: 0,
        z: 0,
        uncertainty: 10.0 // meters
      },
      orientation: {
        roll: 0,
        pitch: 0,
        yaw: 0,
        uncertainty: 0.1 // radians
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0,
        uncertainty: 0.5 // m/s
      },
      angularVelocity: {
        roll: 0,
        pitch: 0,
        yaw: 0,
        uncertainty: 0.05 // rad/s
      },
      lastUpdate: 0
    };
    
    // Sensor data timestamps
    this.lastSensorUpdate = {
      gps: 0,
      imu: 0,
      lidar: 0,
      ultrasonic: 0
    };
    
    // Kalman filter parameters
    this.kalmanFilter = {
      // Process noise covariance
      Q: [
        [0.01, 0, 0, 0, 0, 0],
        [0, 0.01, 0, 0, 0, 0],
        [0, 0, 0.01, 0, 0, 0],
        [0, 0, 0, 0.001, 0, 0],
        [0, 0, 0, 0, 0.001, 0],
        [0, 0, 0, 0, 0, 0.001]
      ],
      // Measurement noise covariance
      R: {
        gps: [
          [4.0, 0, 0],
          [0, 4.0, 0],
          [0, 0, 9.0]
        ],
        imu: [
          [0.01, 0, 0],
          [0, 0.01, 0],
          [0, 0, 0.01]
        ]
      },
      // State covariance
      P: [
        [10.0, 0, 0, 0, 0, 0],
        [0, 10.0, 0, 0, 0, 0],
        [0, 0, 10.0, 0, 0, 0],
        [0, 0, 0, 0.1, 0, 0],
        [0, 0, 0, 0, 0.1, 0],
        [0, 0, 0, 0, 0, 0.1]
      ]
    };
    
    this.logger.info('Sensor Fusion initialized');
  }
  
  /**
   * Update with GPS data
   * @param {object} gpsData - GPS data
   */
  updateGPS(gpsData) {
    const now = Date.now();
    
    // Skip if data is too old
    if (gpsData.timestamp < this.lastSensorUpdate.gps) {
      return;
    }
    
    // Update timestamp
    this.lastSensorUpdate.gps = gpsData.timestamp;
    
    // Convert GPS coordinates to local coordinates
    // In a real implementation, this would convert from lat/lon to a local coordinate system
    // For this prototype, we'll assume the GPS data is already in local coordinates
    
    // Extract position data
    const position = {
      x: gpsData.longitude * 111320, // Approximate conversion from degrees to meters
      y: gpsData.latitude * 110540,  // Approximate conversion from degrees to meters
      z: gpsData.altitude
    };
    
    // Calculate time delta
    const dt = (now - this.state.lastUpdate) / 1000; // seconds
    
    // Skip if this is the first update
    if (this.state.lastUpdate === 0) {
      // Initialize position
      this.state.position.x = position.x;
      this.state.position.y = position.y;
      this.state.position.z = position.z;
      this.state.position.uncertainty = gpsData.accuracy;
      
      this.state.lastUpdate = now;
      return;
    }
    
    // Apply Kalman filter
    this._applyKalmanFilterGPS(position, gpsData.accuracy, dt);
    
    // Update last update time
    this.state.lastUpdate = now;
  }
  
  /**
   * Update with IMU data
   * @param {object} imuData - IMU data
   */
  updateIMU(imuData) {
    const now = Date.now();
    
    // Skip if data is too old
    if (imuData.timestamp < this.lastSensorUpdate.imu) {
      return;
    }
    
    // Update timestamp
    this.lastSensorUpdate.imu = imuData.timestamp;
    
    // Extract orientation data
    const orientation = imuData.orientation;
    
    // Extract acceleration data
    const acceleration = imuData.acceleration;
    
    // Extract angular velocity data
    const angularVelocity = imuData.gyroscope;
    
    // Calculate time delta
    const dt = (now - this.state.lastUpdate) / 1000; // seconds
    
    // Skip if this is the first update
    if (this.state.lastUpdate === 0) {
      // Initialize orientation
      this.state.orientation.roll = orientation.roll;
      this.state.orientation.pitch = orientation.pitch;
      this.state.orientation.yaw = orientation.yaw;
      this.state.orientation.uncertainty = 0.1;
      
      // Initialize angular velocity
      this.state.angularVelocity.roll = angularVelocity.x;
      this.state.angularVelocity.pitch = angularVelocity.y;
      this.state.angularVelocity.yaw = angularVelocity.z;
      
      this.state.lastUpdate = now;
      return;
    }
    
    // Apply Kalman filter
    this._applyKalmanFilterIMU(orientation, acceleration, angularVelocity, dt);
    
    // Update last update time
    this.state.lastUpdate = now;
  }
  
  /**
   * Update with LIDAR data
   * @param {object} lidarData - LIDAR data
   */
  updateLidar(lidarData) {
    const now = Date.now();
    
    // Skip if data is too old
    if (lidarData.timestamp < this.lastSensorUpdate.lidar) {
      return;
    }
    
    // Update timestamp
    this.lastSensorUpdate.lidar = lidarData.timestamp;
    
    // In a real implementation, this would use LIDAR data for localization
    // For this prototype, we'll just update the timestamp
  }
  
  /**
   * Update with ultrasonic data
   * @param {object} ultrasonicData - Ultrasonic data
   */
  updateUltrasonic(ultrasonicData) {
    const now = Date.now();
    
    // Skip if data is too old
    if (ultrasonicData.timestamp < this.lastSensorUpdate.ultrasonic) {
      return;
    }
    
    // Update timestamp
    this.lastSensorUpdate.ultrasonic = ultrasonicData.timestamp;
    
    // In a real implementation, this would use ultrasonic data for obstacle detection
    // For this prototype, we'll just update the timestamp
  }
  
  /**
   * Apply Kalman filter for GPS data
   * @param {object} position - Position data
   * @param {number} accuracy - Position accuracy
   * @param {number} dt - Time delta in seconds
   * @private
   */
  _applyKalmanFilterGPS(position, accuracy, dt) {
    // In a real implementation, this would apply an Extended Kalman Filter
    // For this prototype, we'll use a simplified approach
    
    // Predict step
    // Update position based on velocity
    const predictedPosition = {
      x: this.state.position.x + this.state.velocity.x * dt,
      y: this.state.position.y + this.state.velocity.y * dt,
      z: this.state.position.z + this.state.velocity.z * dt
    };
    
    // Update uncertainty
    const predictedUncertainty = this.state.position.uncertainty + 0.1 * dt;
    
    // Update step
    // Calculate Kalman gain
    const kalmanGain = predictedUncertainty / (predictedUncertainty + accuracy);
    
    // Update position
    this.state.position.x = predictedPosition.x + kalmanGain * (position.x - predictedPosition.x);
    this.state.position.y = predictedPosition.y + kalmanGain * (position.y - predictedPosition.y);
    this.state.position.z = predictedPosition.z + kalmanGain * (position.z - predictedPosition.z);
    
    // Update uncertainty
    this.state.position.uncertainty = (1 - kalmanGain) * predictedUncertainty;
    
    // Update velocity
    this.state.velocity.x = (this.state.position.x - predictedPosition.x) / dt;
    this.state.velocity.y = (this.state.position.y - predictedPosition.y) / dt;
    this.state.velocity.z = (this.state.position.z - predictedPosition.z) / dt;
  }
  
  /**
   * Apply Kalman filter for IMU data
   * @param {object} orientation - Orientation data
   * @param {object} acceleration - Acceleration data
   * @param {object} angularVelocity - Angular velocity data
   * @param {number} dt - Time delta in seconds
   * @private
   */
  _applyKalmanFilterIMU(orientation, acceleration, angularVelocity, dt) {
    // In a real implementation, this would apply an Extended Kalman Filter
    // For this prototype, we'll use a simplified approach
    
    // Predict step
    // Update orientation based on angular velocity
    const predictedOrientation = {
      roll: this.state.orientation.roll + this.state.angularVelocity.roll * dt,
      pitch: this.state.orientation.pitch + this.state.angularVelocity.pitch * dt,
      yaw: this.state.orientation.yaw + this.state.angularVelocity.yaw * dt
    };
    
    // Update uncertainty
    const predictedUncertainty = this.state.orientation.uncertainty + 0.01 * dt;
    
    // Update step
    // Calculate Kalman gain
    const kalmanGain = predictedUncertainty / (predictedUncertainty + 0.1);
    
    // Update orientation
    this.state.orientation.roll = predictedOrientation.roll + kalmanGain * (orientation.roll - predictedOrientation.roll);
    this.state.orientation.pitch = predictedOrientation.pitch + kalmanGain * (orientation.pitch - predictedOrientation.pitch);
    this.state.orientation.yaw = predictedOrientation.yaw + kalmanGain * (orientation.yaw - predictedOrientation.yaw);
    
    // Update uncertainty
    this.state.orientation.uncertainty = (1 - kalmanGain) * predictedUncertainty;
    
    // Update angular velocity
    this.state.angularVelocity.roll = angularVelocity.x;
    this.state.angularVelocity.pitch = angularVelocity.y;
    this.state.angularVelocity.yaw = angularVelocity.z;
    
    // Update velocity based on acceleration
    // First, transform acceleration from body frame to world frame
    const cosRoll = Math.cos(this.state.orientation.roll);
    const sinRoll = Math.sin(this.state.orientation.roll);
    const cosPitch = Math.cos(this.state.orientation.pitch);
    const sinPitch = Math.sin(this.state.orientation.pitch);
    const cosYaw = Math.cos(this.state.orientation.yaw);
    const sinYaw = Math.sin(this.state.orientation.yaw);
    
    // Rotation matrix from body frame to world frame
    const R = [
      [cosYaw * cosPitch, cosYaw * sinPitch * sinRoll - sinYaw * cosRoll, cosYaw * sinPitch * cosRoll + sinYaw * sinRoll],
      [sinYaw * cosPitch, sinYaw * sinPitch * sinRoll + cosYaw * cosRoll, sinYaw * sinPitch * cosRoll - cosYaw * sinRoll],
      [-sinPitch, cosPitch * sinRoll, cosPitch * cosRoll]
    ];
    
    // Transform acceleration
    const worldAcceleration = {
      x: R[0][0] * acceleration.x + R[0][1] * acceleration.y + R[0][2] * acceleration.z,
      y: R[1][0] * acceleration.x + R[1][1] * acceleration.y + R[1][2] * acceleration.z,
      z: R[2][0] * acceleration.x + R[2][1] * acceleration.y + R[2][2] * acceleration.z - 9.81 // Subtract gravity
    };
    
    // Update velocity
    this.state.velocity.x += worldAcceleration.x * dt;
    this.state.velocity.y += worldAcceleration.y * dt;
    this.state.velocity.z += worldAcceleration.z * dt;
  }
  
  /**
   * Get current position and orientation
   * @returns {object} Position and orientation data
   */
  getPositionAndOrientation() {
    return {
      position: { ...this.state.position },
      orientation: { ...this.state.orientation },
      velocity: { ...this.state.velocity },
      angularVelocity: { ...this.state.angularVelocity },
      timestamp: this.state.lastUpdate
    };
  }
}

module.exports = SensorFusion;