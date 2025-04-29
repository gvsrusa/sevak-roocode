/**
 * Unit tests for SensorFusion
 */

const SensorFusion = require('../../../src/utils/sensorFusion');

// Mock dependencies
jest.mock('../../../src/utils/logger');

describe('SensorFusion', () => {
  let sensorFusion;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    sensorFusion = new SensorFusion();
  });
  
  describe('constructor', () => {
    test('should initialize with correct default values', () => {
      expect(sensorFusion.state).toBeDefined();
      expect(sensorFusion.state.position).toBeDefined();
      expect(sensorFusion.state.orientation).toBeDefined();
      expect(sensorFusion.state.velocity).toBeDefined();
      expect(sensorFusion.state.angularVelocity).toBeDefined();
      expect(sensorFusion.state.lastUpdate).toBe(0);
      
      expect(sensorFusion.lastSensorUpdate).toBeDefined();
      expect(sensorFusion.lastSensorUpdate.gps).toBe(0);
      expect(sensorFusion.lastSensorUpdate.imu).toBe(0);
      expect(sensorFusion.lastSensorUpdate.lidar).toBe(0);
      expect(sensorFusion.lastSensorUpdate.ultrasonic).toBe(0);
      
      expect(sensorFusion.kalmanFilter).toBeDefined();
    });
  });
  
  describe('updateGPS', () => {
    test('should update position with GPS data', () => {
      // Setup
      const now = Date.now();
      const gpsData = {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 10,
        accuracy: 2.5,
        speed: 1.2,
        heading: 45,
        timestamp: now
      };
      
      // Execute
      sensorFusion.updateGPS(gpsData);
      
      // Verify
      expect(sensorFusion.lastSensorUpdate.gps).toBe(now);
      expect(sensorFusion.state.position.x).not.toBe(0);
      expect(sensorFusion.state.position.y).not.toBe(0);
      expect(sensorFusion.state.position.z).toBe(10);
      expect(sensorFusion.state.position.uncertainty).toBe(2.5);
      expect(sensorFusion.state.lastUpdate).toBe(now);
    });
    
    test('should skip update if GPS data is older than last update', () => {
      // Setup
      const oldTime = Date.now() - 1000;
      const newTime = Date.now();
      sensorFusion.lastSensorUpdate.gps = newTime;
      
      const gpsData = {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 10,
        accuracy: 2.5,
        timestamp: oldTime
      };
      
      const initialState = JSON.parse(JSON.stringify(sensorFusion.state));
      
      // Execute
      sensorFusion.updateGPS(gpsData);
      
      // Verify - state should not change
      expect(sensorFusion.state).toEqual(initialState);
    });
    
    test('should apply Kalman filter for subsequent GPS updates', () => {
      // Setup - first update to initialize
      const firstTime = Date.now() - 1000;
      const firstGpsData = {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 10,
        accuracy: 2.5,
        timestamp: firstTime
      };
      
      sensorFusion.updateGPS(firstGpsData);
      
      // Mock _applyKalmanFilterGPS
      sensorFusion._applyKalmanFilterGPS = jest.fn();
      
      // Setup - second update
      const secondTime = Date.now();
      const secondGpsData = {
        latitude: 37.7750,
        longitude: -122.4195,
        altitude: 11,
        accuracy: 2.0,
        timestamp: secondTime
      };
      
      // Execute
      sensorFusion.updateGPS(secondGpsData);
      
      // Verify
      expect(sensorFusion._applyKalmanFilterGPS).toHaveBeenCalled();
      expect(sensorFusion.lastSensorUpdate.gps).toBe(secondTime);
    });
  });
  
  describe('updateIMU', () => {
    test('should update orientation with IMU data', () => {
      // Setup
      const now = Date.now();
      const imuData = {
        orientation: {
          roll: 0.1,
          pitch: 0.2,
          yaw: 0.3
        },
        acceleration: {
          x: 0.1,
          y: 0.2,
          z: 9.8
        },
        gyroscope: {
          x: 0.01,
          y: 0.02,
          z: 0.03
        },
        timestamp: now
      };
      
      // Execute
      sensorFusion.updateIMU(imuData);
      
      // Verify
      expect(sensorFusion.lastSensorUpdate.imu).toBe(now);
      expect(sensorFusion.state.orientation.roll).toBe(0.1);
      expect(sensorFusion.state.orientation.pitch).toBe(0.2);
      expect(sensorFusion.state.orientation.yaw).toBe(0.3);
      expect(sensorFusion.state.angularVelocity.roll).toBe(0.01);
      expect(sensorFusion.state.angularVelocity.pitch).toBe(0.02);
      expect(sensorFusion.state.angularVelocity.yaw).toBe(0.03);
      expect(sensorFusion.state.lastUpdate).toBe(now);
    });
    
    test('should skip update if IMU data is older than last update', () => {
      // Setup
      const oldTime = Date.now() - 1000;
      const newTime = Date.now();
      sensorFusion.lastSensorUpdate.imu = newTime;
      
      const imuData = {
        orientation: {
          roll: 0.1,
          pitch: 0.2,
          yaw: 0.3
        },
        acceleration: {
          x: 0.1,
          y: 0.2,
          z: 9.8
        },
        gyroscope: {
          x: 0.01,
          y: 0.02,
          z: 0.03
        },
        timestamp: oldTime
      };
      
      const initialState = JSON.parse(JSON.stringify(sensorFusion.state));
      
      // Execute
      sensorFusion.updateIMU(imuData);
      
      // Verify - state should not change
      expect(sensorFusion.state).toEqual(initialState);
    });
    
    test('should apply Kalman filter for subsequent IMU updates', () => {
      // Setup - first update to initialize
      const firstTime = Date.now() - 1000;
      const firstImuData = {
        orientation: {
          roll: 0.1,
          pitch: 0.2,
          yaw: 0.3
        },
        acceleration: {
          x: 0.1,
          y: 0.2,
          z: 9.8
        },
        gyroscope: {
          x: 0.01,
          y: 0.02,
          z: 0.03
        },
        timestamp: firstTime
      };
      
      sensorFusion.updateIMU(firstImuData);
      
      // Mock _applyKalmanFilterIMU
      sensorFusion._applyKalmanFilterIMU = jest.fn();
      
      // Setup - second update
      const secondTime = Date.now();
      const secondImuData = {
        orientation: {
          roll: 0.15,
          pitch: 0.25,
          yaw: 0.35
        },
        acceleration: {
          x: 0.15,
          y: 0.25,
          z: 9.85
        },
        gyroscope: {
          x: 0.015,
          y: 0.025,
          z: 0.035
        },
        timestamp: secondTime
      };
      
      // Execute
      sensorFusion.updateIMU(secondImuData);
      
      // Verify
      expect(sensorFusion._applyKalmanFilterIMU).toHaveBeenCalled();
      expect(sensorFusion.lastSensorUpdate.imu).toBe(secondTime);
    });
  });
  
  describe('updateLidar', () => {
    test('should update LIDAR timestamp', () => {
      // Setup
      const now = Date.now();
      const lidarData = {
        points: [
          { angle: 0, distance: 5, intensity: 100 },
          { angle: Math.PI/4, distance: 7, intensity: 120 }
        ],
        scanTime: 100,
        timestamp: now
      };
      
      // Execute
      sensorFusion.updateLidar(lidarData);
      
      // Verify
      expect(sensorFusion.lastSensorUpdate.lidar).toBe(now);
    });
    
    test('should skip update if LIDAR data is older than last update', () => {
      // Setup
      const oldTime = Date.now() - 1000;
      const newTime = Date.now();
      sensorFusion.lastSensorUpdate.lidar = newTime;
      
      const lidarData = {
        points: [
          { angle: 0, distance: 5, intensity: 100 },
          { angle: Math.PI/4, distance: 7, intensity: 120 }
        ],
        scanTime: 100,
        timestamp: oldTime
      };
      
      const initialLastUpdate = sensorFusion.lastSensorUpdate.lidar;
      
      // Execute
      sensorFusion.updateLidar(lidarData);
      
      // Verify - timestamp should not change
      expect(sensorFusion.lastSensorUpdate.lidar).toBe(initialLastUpdate);
    });
  });
  
  describe('updateUltrasonic', () => {
    test('should update ultrasonic timestamp', () => {
      // Setup
      const now = Date.now();
      const ultrasonicData = {
        sensors: [
          { id: 'front_left', distance: 2.5, maxRange: 4.0 },
          { id: 'front_center', distance: 3.0, maxRange: 4.0 }
        ],
        timestamp: now
      };
      
      // Execute
      sensorFusion.updateUltrasonic(ultrasonicData);
      
      // Verify
      expect(sensorFusion.lastSensorUpdate.ultrasonic).toBe(now);
    });
    
    test('should skip update if ultrasonic data is older than last update', () => {
      // Setup
      const oldTime = Date.now() - 1000;
      const newTime = Date.now();
      sensorFusion.lastSensorUpdate.ultrasonic = newTime;
      
      const ultrasonicData = {
        sensors: [
          { id: 'front_left', distance: 2.5, maxRange: 4.0 },
          { id: 'front_center', distance: 3.0, maxRange: 4.0 }
        ],
        timestamp: oldTime
      };
      
      const initialLastUpdate = sensorFusion.lastSensorUpdate.ultrasonic;
      
      // Execute
      sensorFusion.updateUltrasonic(ultrasonicData);
      
      // Verify - timestamp should not change
      expect(sensorFusion.lastSensorUpdate.ultrasonic).toBe(initialLastUpdate);
    });
  });
  
  describe('getPositionAndOrientation', () => {
    test('should return current position and orientation state', () => {
      // Setup
      sensorFusion.state = {
        position: { x: 10, y: 20, z: 30, uncertainty: 2 },
        orientation: { roll: 0.1, pitch: 0.2, yaw: 0.3, uncertainty: 0.05 },
        velocity: { x: 1, y: 2, z: 3, uncertainty: 0.5 },
        angularVelocity: { roll: 0.01, pitch: 0.02, yaw: 0.03, uncertainty: 0.005 },
        lastUpdate: 12345
      };
      
      // Execute
      const result = sensorFusion.getPositionAndOrientation();
      
      // Verify
      expect(result).toEqual({
        position: { x: 10, y: 20, z: 30, uncertainty: 2 },
        orientation: { roll: 0.1, pitch: 0.2, yaw: 0.3, uncertainty: 0.05 },
        velocity: { x: 1, y: 2, z: 3, uncertainty: 0.5 },
        angularVelocity: { roll: 0.01, pitch: 0.02, yaw: 0.03, uncertainty: 0.005 },
        timestamp: 12345
      });
    });
  });
  
  describe('_applyKalmanFilterGPS', () => {
    test('should update position and velocity based on GPS data', () => {
      // Setup
      sensorFusion.state = {
        position: { x: 10, y: 20, z: 30, uncertainty: 2 },
        velocity: { x: 1, y: 2, z: 3, uncertainty: 0.5 },
        lastUpdate: Date.now() - 1000
      };
      
      const position = { x: 11, y: 22, z: 33 };
      const accuracy = 3;
      const dt = 1.0; // 1 second
      
      // Execute
      sensorFusion._applyKalmanFilterGPS(position, accuracy, dt);
      
      // Verify
      // Position should be updated towards the new position
      expect(sensorFusion.state.position.x).toBeGreaterThan(10);
      expect(sensorFusion.state.position.y).toBeGreaterThan(20);
      expect(sensorFusion.state.position.z).toBeGreaterThan(30);
      
      // Uncertainty should be updated
      expect(sensorFusion.state.position.uncertainty).toBeDefined();
      
      // Velocity should be updated
      expect(sensorFusion.state.velocity.x).toBeDefined();
      expect(sensorFusion.state.velocity.y).toBeDefined();
      expect(sensorFusion.state.velocity.z).toBeDefined();
    });
  });
  
  describe('_applyKalmanFilterIMU', () => {
    test('should update orientation and angular velocity based on IMU data', () => {
      // Setup
      sensorFusion.state = {
        orientation: { roll: 0.1, pitch: 0.2, yaw: 0.3, uncertainty: 0.05 },
        angularVelocity: { roll: 0.01, pitch: 0.02, yaw: 0.03 },
        velocity: { x: 1, y: 2, z: 3 },
        lastUpdate: Date.now() - 1000
      };
      
      const orientation = { roll: 0.15, pitch: 0.25, yaw: 0.35 };
      const acceleration = { x: 0.1, y: 0.2, z: 9.8 };
      const angularVelocity = { x: 0.015, y: 0.025, z: 0.035 };
      const dt = 0.1; // 100ms
      
      // Execute
      sensorFusion._applyKalmanFilterIMU(orientation, acceleration, angularVelocity, dt);
      
      // Verify
      // Orientation should be updated towards the new orientation
      expect(sensorFusion.state.orientation.roll).toBeGreaterThan(0.1);
      expect(sensorFusion.state.orientation.pitch).toBeGreaterThan(0.2);
      expect(sensorFusion.state.orientation.yaw).toBeGreaterThan(0.3);
      
      // Uncertainty should be updated
      expect(sensorFusion.state.orientation.uncertainty).toBeDefined();
      
      // Angular velocity should be updated
      expect(sensorFusion.state.angularVelocity.roll).toBe(0.015);
      expect(sensorFusion.state.angularVelocity.pitch).toBe(0.025);
      expect(sensorFusion.state.angularVelocity.yaw).toBe(0.035);
      
      // Velocity should be updated based on acceleration
      expect(sensorFusion.state.velocity.x).toBeDefined();
      expect(sensorFusion.state.velocity.y).toBeDefined();
      expect(sensorFusion.state.velocity.z).toBeDefined();
    });
  });
});