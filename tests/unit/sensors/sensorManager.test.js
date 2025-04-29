/**
 * Unit tests for SensorManager
 */

const SensorManager = require('../../../src/sensors/sensorManager');
const eventBus = require('../../../src/utils/eventBus');

// Mock dependencies
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/eventBus');
jest.mock('../../../src/utils/sensorFusion');
jest.mock('../../../src/config', () => ({
  sensors: {
    gps: { updateInterval: 1000 },
    imu: { updateInterval: 50 },
    lidar: { updateInterval: 100 },
    ultrasonicSensors: { updateInterval: 100 },
    temperatureSensors: { updateInterval: 1000 },
    powerMonitors: { updateInterval: 1000 },
    camera: { updateInterval: 500 },
    temperatureSensors: {
      warningThreshold: 60,
      criticalThreshold: 80
    }
  }
}));

describe('SensorManager', () => {
  let sensorManager;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    sensorManager = new SensorManager();
    
    // Mock the error counters to avoid undefined errors
    sensorManager.errorCounters = {
      gps: 0,
      imu: 0,
      lidar: 0,
      ultrasonicSensors: 0,
      temperatureSensors: 0,
      powerMonitors: 0,
      camera: 0
    };
    
    // Mock the update timers
    sensorManager.updateTimers = {};
    
    // Mock the connection status
    sensorManager.connectionStatus = {
      allSensorsConnected: false,
      criticalSensorsConnected: false
    };
  });
  
  describe('constructor', () => {
    test('should initialize with correct default values', () => {
      expect(sensorManager.sensors).toBeDefined();
      expect(sensorManager.sensors.gps).toBeDefined();
      expect(sensorManager.sensors.imu).toBeDefined();
      expect(sensorManager.sensors.lidar).toBeDefined();
      expect(sensorManager.sensors.ultrasonicSensors).toBeDefined();
      expect(sensorManager.sensors.temperatureSensors).toBeDefined();
      expect(sensorManager.sensors.powerMonitors).toBeDefined();
      expect(sensorManager.sensors.camera).toBeDefined();
      
      expect(sensorManager.updateIntervals).toBeDefined();
      expect(sensorManager.updateIntervals.gps).toBe(1000);
      expect(sensorManager.updateIntervals.imu).toBe(50);
    });
  });
  
  describe('initialize', () => {
    test('should initialize all sensors successfully', async () => {
      // Mock the initialization methods
      sensorManager._initializeGPS = jest.fn().mockResolvedValue(true);
      sensorManager._initializeIMU = jest.fn().mockResolvedValue(true);
      sensorManager._initializeLidar = jest.fn().mockResolvedValue(true);
      sensorManager._initializeUltrasonicSensors = jest.fn().mockResolvedValue(true);
      sensorManager._initializeTemperatureSensors = jest.fn().mockResolvedValue(true);
      sensorManager._initializePowerMonitors = jest.fn().mockResolvedValue(true);
      sensorManager._initializeCamera = jest.fn().mockResolvedValue(true);
      sensorManager._startSensorUpdateLoops = jest.fn();
      sensorManager._updateConnectionStatus = jest.fn();
      
      const result = await sensorManager.initialize();
      
      expect(result).toBe(true);
      expect(sensorManager._initializeGPS).toHaveBeenCalled();
      expect(sensorManager._initializeIMU).toHaveBeenCalled();
      expect(sensorManager._initializeLidar).toHaveBeenCalled();
      expect(sensorManager._initializeUltrasonicSensors).toHaveBeenCalled();
      expect(sensorManager._initializeTemperatureSensors).toHaveBeenCalled();
      expect(sensorManager._initializePowerMonitors).toHaveBeenCalled();
      expect(sensorManager._initializeCamera).toHaveBeenCalled();
      expect(sensorManager._startSensorUpdateLoops).toHaveBeenCalled();
      expect(sensorManager._updateConnectionStatus).toHaveBeenCalled();
    });
    
    test('should handle initialization failure', async () => {
      // Mock one of the initialization methods to fail
      sensorManager._initializeGPS = jest.fn().mockResolvedValue(true);
      sensorManager._initializeIMU = jest.fn().mockRejectedValue(new Error('IMU initialization failed'));
      
      const result = await sensorManager.initialize();
      
      expect(result).toBe(false);
      expect(sensorManager._initializeGPS).toHaveBeenCalled();
      expect(sensorManager._initializeIMU).toHaveBeenCalled();
    });
  });
  
  describe('_updateGPS', () => {
    test('should update GPS data and publish event', () => {
      // Setup
      sensorManager.sensors.gps.connected = true;
      
      // Execute
      sensorManager._updateGPS();
      
      // Verify
      expect(sensorManager.sensors.gps.data).toBeDefined();
      expect(sensorManager.sensors.gps.lastUpdate).toBeGreaterThan(0);
      expect(eventBus.publish).toHaveBeenCalledWith('sensor.gps.updated', expect.any(Object));
      expect(sensorManager.sensorFusion.updateGPS).toHaveBeenCalled();
    });
    
    test('should not update if GPS is not connected', () => {
      // Setup
      sensorManager.sensors.gps.connected = false;
      
      // Execute
      sensorManager._updateGPS();
      
      // Verify
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(sensorManager.sensorFusion.updateGPS).not.toHaveBeenCalled();
    });
    
    test('should handle errors and increment error counter', () => {
      // Setup
      sensorManager.sensors.gps.connected = true;
      sensorManager.sensorFusion.updateGPS = jest.fn().mockImplementation(() => {
        throw new Error('GPS update failed');
      });
      
      // Execute
      sensorManager._updateGPS();
      
      // Verify
      expect(sensorManager.errorCounters.gps).toBe(1);
    });
    
    test('should mark GPS as disconnected after too many errors', () => {
      // Setup
      sensorManager.sensors.gps.connected = true;
      sensorManager.errorCounters.gps = 5;
      sensorManager.sensorFusion.updateGPS = jest.fn().mockImplementation(() => {
        throw new Error('GPS update failed');
      });
      
      // Execute
      sensorManager._updateGPS();
      
      // Verify
      expect(sensorManager.errorCounters.gps).toBe(6);
      expect(sensorManager.sensors.gps.connected).toBe(false);
    });
  });
  
  describe('_updateConnectionStatus', () => {
    test('should update connection status correctly when all sensors are connected', () => {
      // Setup
      Object.keys(sensorManager.sensors).forEach(sensor => {
        sensorManager.sensors[sensor].connected = true;
      });
      
      // Execute
      sensorManager._updateConnectionStatus();
      
      // Verify
      expect(sensorManager.connectionStatus.allSensorsConnected).toBe(true);
      expect(sensorManager.connectionStatus.criticalSensorsConnected).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'sensor.connectionStatus.updated',
        expect.objectContaining({
          allSensorsConnected: true,
          criticalSensorsConnected: true
        })
      );
    });
    
    test('should update connection status correctly when some sensors are disconnected', () => {
      // Setup
      Object.keys(sensorManager.sensors).forEach(sensor => {
        sensorManager.sensors[sensor].connected = true;
      });
      sensorManager.sensors.camera.connected = false;
      
      // Execute
      sensorManager._updateConnectionStatus();
      
      // Verify
      expect(sensorManager.connectionStatus.allSensorsConnected).toBe(false);
      expect(sensorManager.connectionStatus.criticalSensorsConnected).toBe(true);
    });
    
    test('should update connection status correctly when critical sensors are disconnected', () => {
      // Setup
      Object.keys(sensorManager.sensors).forEach(sensor => {
        sensorManager.sensors[sensor].connected = true;
      });
      sensorManager.sensors.gps.connected = false;
      
      // Execute
      sensorManager._updateConnectionStatus();
      
      // Verify
      expect(sensorManager.connectionStatus.allSensorsConnected).toBe(false);
      expect(sensorManager.connectionStatus.criticalSensorsConnected).toBe(false);
    });
  });
  
  describe('shutdown', () => {
    test('should shut down all sensors successfully', async () => {
      // Setup
      sensorManager.updateTimers = {
        gps: 123,
        imu: 456
      };
      global.clearInterval = jest.fn();
      
      // Execute
      const result = await sensorManager.shutdown();
      
      // Verify
      expect(result).toBe(true);
      expect(global.clearInterval).toHaveBeenCalledTimes(2);
      expect(global.clearInterval).toHaveBeenCalledWith(123);
      expect(global.clearInterval).toHaveBeenCalledWith(456);
      expect(sensorManager.updateTimers).toEqual({});
      
      // All sensors should be marked as disconnected
      Object.keys(sensorManager.sensors).forEach(sensor => {
        expect(sensorManager.sensors[sensor].connected).toBe(false);
      });
    });
  });
});