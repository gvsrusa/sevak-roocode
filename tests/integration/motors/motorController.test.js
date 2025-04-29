/**
 * Integration tests for MotorController
 */

const MotorController = require('../../../src/motors/motorController');
const eventBus = require('../../../src/utils/eventBus');

// Mock dependencies
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/config', () => ({
  motors: {
    maxSpeed: 36, // 10 m/s (36 km/h)
    maxAcceleration: 2.0,
    maxDeceleration: 4.0,
    steeringMaxAngle: 30,
    motorControllerParams: {
      kp: 0.5,
      ki: 0.1,
      kd: 0.2
    }
  },
  sensors: {
    temperatureSensors: {
      warningThreshold: 60,
      criticalThreshold: 80
    }
  }
}));

describe('MotorController Integration Tests', () => {
  let motorController;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create a new instance for each test
    motorController = new MotorController();
    
    // Initialize the controller
    motorController.initialize();
  });
  
  afterEach(() => {
    // Clean up
    motorController.shutdown();
    jest.useRealTimers();
  });
  
  describe('Speed Control', () => {
    test('should gradually accelerate to target speed', () => {
      // Setup
      const targetSpeed = 5.0; // m/s
      
      // Execute
      motorController.setTargetSpeed(targetSpeed);
      
      // Initial speed should be 0
      expect(motorController.motion.speed).toBe(0);
      expect(motorController.motion.targetSpeed).toBe(targetSpeed);
      
      // Advance time to simulate control loop iterations
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(20); // 20ms per control loop iteration
      }
      
      // Verify speed is increasing but not yet at target
      expect(motorController.motion.speed).toBeGreaterThan(0);
      expect(motorController.motion.speed).toBeLessThan(targetSpeed);
      
      // Advance more time
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Verify speed is now close to target
      expect(motorController.motion.speed).toBeCloseTo(targetSpeed, 1);
    });
    
    test('should respect maximum speed limit', () => {
      // Setup - try to set speed higher than max
      const maxSpeed = motorController.motion.maxSpeed;
      const targetSpeed = maxSpeed * 1.5;
      
      // Execute
      motorController.setTargetSpeed(targetSpeed);
      
      // Verify target speed is limited to max
      expect(motorController.motion.targetSpeed).toBe(maxSpeed);
      
      // Advance time
      for (let i = 0; i < 100; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Verify speed is limited to max
      expect(motorController.motion.speed).toBeCloseTo(maxSpeed, 1);
    });
    
    test('should decelerate when target speed is reduced', () => {
      // Setup - first accelerate to initial speed
      const initialSpeed = 5.0;
      motorController.setTargetSpeed(initialSpeed);
      
      // Advance time to reach initial speed
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Now reduce target speed
      const reducedSpeed = 2.0;
      motorController.setTargetSpeed(reducedSpeed);
      
      // Get speed after setting new target
      const speedAfterTargetChange = motorController.motion.speed;
      
      // Advance time
      for (let i = 0; i < 20; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Verify speed is decreasing
      expect(motorController.motion.speed).toBeLessThan(speedAfterTargetChange);
      
      // Advance more time
      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Verify speed is now close to reduced target
      expect(motorController.motion.speed).toBeCloseTo(reducedSpeed, 1);
    });
  });
  
  describe('Direction Control', () => {
    test('should set motor speeds based on steering direction', () => {
      // Setup - set a moderate speed
      motorController.setTargetSpeed(3.0);
      
      // Advance time to reach speed
      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Get initial motor speeds (should be equal for straight movement)
      const initialLeftSpeed = motorController.motors.frontLeft.speed;
      const initialRightSpeed = motorController.motors.frontRight.speed;
      
      // Verify initial speeds are equal
      expect(initialLeftSpeed).toBeCloseTo(initialRightSpeed, 5);
      
      // Now set a right turn
      motorController.setTargetDirection(Math.PI / 6); // 30 degrees right
      
      // Advance time for direction change to take effect
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Verify left motors are faster than right motors for right turn
      expect(motorController.motors.frontLeft.speed).toBeGreaterThan(motorController.motors.frontRight.speed);
      expect(motorController.motors.rearLeft.speed).toBeGreaterThan(motorController.motors.rearRight.speed);
      
      // Now set a left turn
      motorController.setTargetDirection(-Math.PI / 6); // 30 degrees left
      
      // Advance time for direction change to take effect
      for (let i = 0; i < 20; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Verify right motors are faster than left motors for left turn
      expect(motorController.motors.frontRight.speed).toBeGreaterThan(motorController.motors.frontLeft.speed);
      expect(motorController.motors.rearRight.speed).toBeGreaterThan(motorController.motors.rearLeft.speed);
    });
    
    test('should respect maximum steering angle', () => {
      // Setup - try to set direction beyond max angle
      const maxAngleRad = motorController.motion.maxSteeringAngle || (30 * Math.PI / 180);
      const targetDirection = maxAngleRad * 1.5;
      
      // Execute
      motorController.setTargetDirection(targetDirection);
      
      // Verify direction is limited to max
      expect(motorController.motion.targetDirection).toBeCloseTo(maxAngleRad, 5);
    });
  });
  
  describe('Safety Features', () => {
    test('should stop motors when emergency stop is activated', () => {
      // Setup - set a speed
      motorController.setTargetSpeed(3.0);
      
      // Advance time to reach speed
      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Verify motors are running
      expect(motorController.motion.speed).toBeGreaterThan(0);
      expect(motorController.motors.frontLeft.speed).toBeGreaterThan(0);
      
      // Activate emergency stop
      motorController.emergencyStop();
      
      // Advance time for emergency stop to take effect
      jest.advanceTimersByTime(20);
      
      // Verify all motors are stopped
      expect(motorController.motion.speed).toBe(0);
      expect(motorController.motors.frontLeft.speed).toBe(0);
      expect(motorController.motors.frontRight.speed).toBe(0);
      expect(motorController.motors.rearLeft.speed).toBe(0);
      expect(motorController.motors.rearRight.speed).toBe(0);
      
      // Verify emergency stop flag is set
      expect(motorController.safetyFlags.emergencyStop).toBe(true);
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.event',
        expect.objectContaining({
          eventType: 'emergencyStop',
          severity: 'critical'
        })
      );
    });
    
    test('should reduce power when motor overheating is detected', () => {
      // Setup - set a speed
      motorController.setTargetSpeed(5.0);
      
      // Advance time to reach speed
      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Get initial max speed
      const initialMaxSpeed = motorController.motion.maxSpeed;
      
      // Simulate overheating by directly calling the handler
      motorController._handleSafetyEvent('overTemperature');
      
      // Verify max speed is reduced
      expect(motorController.motion.maxSpeed).toBeLessThan(initialMaxSpeed);
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.event',
        expect.objectContaining({
          eventType: 'overTemperature',
          severity: 'warning'
        })
      );
    });
    
    test('should reduce acceleration when motor overcurrent is detected', () => {
      // Setup - set a speed
      motorController.setTargetSpeed(5.0);
      
      // Advance time to reach speed
      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(20);
      }
      
      // Get initial max acceleration
      const initialMaxAcceleration = motorController.motion.maxAcceleration;
      
      // Simulate overcurrent by directly calling the handler
      motorController._handleSafetyEvent('overCurrent');
      
      // Verify max acceleration is reduced
      expect(motorController.motion.maxAcceleration).toBeLessThan(initialMaxAcceleration);
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.event',
        expect.objectContaining({
          eventType: 'overCurrent',
          severity: 'warning'
        })
      );
    });
  });
  
  describe('PID Control', () => {
    test('should use PID control to approach target speed smoothly', () => {
      // Setup
      const targetSpeed = 5.0;
      motorController.setTargetSpeed(targetSpeed);
      
      // Track speed changes
      const speeds = [];
      
      // Advance time and record speeds
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(20);
        speeds.push(motorController.motion.speed);
      }
      
      // Verify speed increases smoothly (no sudden jumps)
      for (let i = 1; i < speeds.length; i++) {
        const speedDiff = speeds[i] - speeds[i-1];
        // Speed difference between iterations should be small
        expect(Math.abs(speedDiff)).toBeLessThan(0.5);
      }
      
      // Verify final speed is close to target
      expect(speeds[speeds.length - 1]).toBeCloseTo(targetSpeed, 1);
    });
    
    test('should handle step response appropriately', () => {
      // Setup - start with zero speed
      motorController.motion.speed = 0;
      motorController.motion.targetSpeed = 0;
      
      // Apply a step input
      motorController.setTargetSpeed(5.0);
      
      // Track speed and acceleration
      const speeds = [];
      const accelerations = [];
      
      // Advance time and record values
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(20);
        speeds.push(motorController.motion.speed);
        accelerations.push(motorController.motion.acceleration);
      }
      
      // Verify initial acceleration is positive and within limits
      expect(accelerations[0]).toBeGreaterThan(0);
      expect(accelerations[0]).toBeLessThanOrEqual(motorController.motion.maxAcceleration);
      
      // Verify acceleration decreases as speed approaches target
      expect(accelerations[accelerations.length - 1]).toBeLessThan(accelerations[0]);
    });
  });
  
  describe('Motor Status Publishing', () => {
    test('should publish motor status updates', () => {
      // Clear previous calls
      eventBus.publish.mockClear();
      
      // Execute one control loop iteration
      motorController._controlLoop();
      
      // Verify status was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'motor.status.updated',
        expect.objectContaining({
          motors: expect.any(Object),
          motion: expect.any(Object),
          safetyFlags: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });
  });
  
  describe('Sensor Integration', () => {
    test('should update motor temperatures from sensor data', () => {
      // Setup
      const temperatureData = {
        ambient: 25,
        motorFrontLeft: 50,
        motorFrontRight: 55,
        motorRearLeft: 45,
        motorRearRight: 60,
        controllerMain: 35,
        batteryPack: 30,
        timestamp: Date.now()
      };
      
      // Execute
      motorController._updateMotorTemperatures(temperatureData);
      
      // Verify temperatures were updated
      expect(motorController.motors.frontLeft.temperature).toBe(50);
      expect(motorController.motors.frontRight.temperature).toBe(55);
      expect(motorController.motors.rearLeft.temperature).toBe(45);
      expect(motorController.motors.rearRight.temperature).toBe(60);
    });
    
    test('should update motor currents from sensor data', () => {
      // Setup
      const currentData = {
        motorCurrents: {
          frontLeft: 5.2,
          frontRight: 4.8,
          rearLeft: 5.0,
          rearRight: 5.5
        }
      };
      
      // Execute
      motorController._updateMotorCurrents(currentData);
      
      // Verify currents were updated
      expect(motorController.motors.frontLeft.current).toBe(5.2);
      expect(motorController.motors.frontRight.current).toBe(4.8);
      expect(motorController.motors.rearLeft.current).toBe(5.0);
      expect(motorController.motors.rearRight.current).toBe(5.5);
    });
    
    test('should detect overtemperature condition', () => {
      // Setup - temperature above critical threshold
      const temperatureData = {
        motorFrontLeft: 85, // Above critical threshold (80)
        motorFrontRight: 70,
        motorRearLeft: 65,
        motorRearRight: 60
      };
      
      // Execute
      motorController._updateMotorTemperatures(temperatureData);
      
      // Verify overtemperature was detected
      expect(motorController.safetyFlags.overTemperature).toBe(true);
      expect(motorController.motors.frontLeft.health).toBe('critical');
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.event',
        expect.objectContaining({
          eventType: 'overTemperature'
        })
      );
    });
  });
});