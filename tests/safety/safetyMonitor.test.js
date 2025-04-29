/**
 * Safety system tests with fail-safe scenarios
 */

const SafetyMonitor = require('../../src/safety/safetyMonitor');
const eventBus = require('../../src/utils/eventBus');

// Mock dependencies
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/eventBus');
jest.mock('../../src/config', () => ({
  safety: {
    failSafeMode: 'stop',
    obstacleSafeDistance: 2.0,
    humanSafeDistance: 5.0,
    maxSlopeAngle: 15.0,
    batteryLowThreshold: 20,
    batteryCriticalThreshold: 10,
    watchdogTimeout: 5000
  }
}));

describe('SafetyMonitor Tests', () => {
  let safetyMonitor;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create a new instance for each test
    safetyMonitor = new SafetyMonitor();
    
    // Initialize the safety monitor
    safetyMonitor.initialize();
  });
  
  afterEach(() => {
    // Clean up
    safetyMonitor.shutdown();
    jest.useRealTimers();
  });
  
  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(safetyMonitor.safetyState).toBeDefined();
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(false);
      expect(safetyMonitor.safetyState.safetyViolations).toEqual([]);
      expect(safetyMonitor.safetyState.currentViolations).toBeDefined();
      expect(safetyMonitor.safetyState.failSafeMode).toBe('stop');
      
      expect(safetyMonitor.thresholds).toBeDefined();
      expect(safetyMonitor.thresholds.obstacleSafeDistance).toBe(2.0);
      expect(safetyMonitor.thresholds.humanSafeDistance).toBe(5.0);
      expect(safetyMonitor.thresholds.maxSlopeAngle).toBe(15.0);
      expect(safetyMonitor.thresholds.batteryLowThreshold).toBe(20);
      expect(safetyMonitor.thresholds.batteryCriticalThreshold).toBe(10);
      expect(safetyMonitor.thresholds.watchdogTimeout).toBe(5000);
    });
    
    test('should subscribe to safety-related events', () => {
      // Verify event subscriptions
      expect(eventBus.subscribe).toHaveBeenCalledWith('navigation.obstacleAvoidance.started', expect.any(Function));
      expect(eventBus.subscribe).toHaveBeenCalledWith('navigation.boundaryViolation', expect.any(Function));
      expect(eventBus.subscribe).toHaveBeenCalledWith('motor.status.updated', expect.any(Function));
      expect(eventBus.subscribe).toHaveBeenCalledWith('sensor.powerMonitors.updated', expect.any(Function));
      expect(eventBus.subscribe).toHaveBeenCalledWith('sensor.imu.updated', expect.any(Function));
      expect(eventBus.subscribe).toHaveBeenCalledWith('safety.emergencyStop.triggered', expect.any(Function));
      expect(eventBus.subscribe).toHaveBeenCalledWith('command.emergencyStop', expect.any(Function));
    });
    
    test('should start watchdog timer', () => {
      // Verify watchdog timer was started
      expect(safetyMonitor.watchdogTimer).not.toBeNull();
    });
    
    test('should start safety check loop', () => {
      // Verify safety check loop was started
      expect(safetyMonitor.safetyCheckInterval).not.toBeNull();
    });
  });
  
  describe('Watchdog Timer', () => {
    test('should trigger safety violation when watchdog times out', () => {
      // Setup
      safetyMonitor._triggerSafetyViolation = jest.fn();
      
      // Execute - advance time past watchdog timeout
      jest.advanceTimersByTime(6000); // 6 seconds, timeout is 5 seconds
      
      // Verify
      expect(safetyMonitor._triggerSafetyViolation).toHaveBeenCalledWith(
        'watchdogTimeout',
        expect.any(String)
      );
    });
    
    test('should reset watchdog timer', () => {
      // Setup
      safetyMonitor._triggerSafetyViolation = jest.fn();
      
      // Execute - advance time partially
      jest.advanceTimersByTime(3000); // 3 seconds
      
      // Reset watchdog
      safetyMonitor.resetWatchdog();
      
      // Advance time again, but not enough to trigger timeout from reset point
      jest.advanceTimersByTime(3000); // 3 more seconds, total 6 seconds but reset at 3
      
      // Verify - should not trigger timeout
      expect(safetyMonitor._triggerSafetyViolation).not.toHaveBeenCalled();
      
      // Advance more time to trigger timeout
      jest.advanceTimersByTime(3000); // 3 more seconds, total 9 seconds, 6 since reset
      
      // Verify - now should trigger timeout
      expect(safetyMonitor._triggerSafetyViolation).toHaveBeenCalledWith(
        'watchdogTimeout',
        expect.any(String)
      );
    });
    
    test('should clear watchdog timeout violation when reset', () => {
      // Setup - trigger watchdog timeout
      safetyMonitor.safetyState.currentViolations.watchdogTimeout = true;
      
      // Execute
      safetyMonitor.resetWatchdog();
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.watchdogTimeout).toBe(false);
    });
  });
  
  describe('Safety Check Loop', () => {
    test('should perform regular safety checks', () => {
      // Setup
      safetyMonitor._publishSafetyStatus = jest.fn();
      
      // Execute - advance time to trigger safety check
      jest.advanceTimersByTime(200); // 200ms
      
      // Verify
      expect(safetyMonitor._publishSafetyStatus).toHaveBeenCalled();
      expect(safetyMonitor.safetyState.lastSafetyCheck).toBeGreaterThan(0);
    });
    
    test('should detect communication delay', () => {
      // Setup - set lastWatchdogReset to simulate delay
      safetyMonitor.lastWatchdogReset = Date.now() - 4000; // 4 seconds ago (80% of timeout)
      
      // Execute - run safety check
      safetyMonitor._performSafetyCheck();
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.communicationLoss).toBe(true);
      
      // Now simulate watchdog reset
      safetyMonitor.resetWatchdog();
      
      // Execute - run safety check again
      safetyMonitor._performSafetyCheck();
      
      // Verify - communication loss should be cleared
      expect(safetyMonitor.safetyState.currentViolations.communicationLoss).toBe(false);
    });
  });
  
  describe('Obstacle Detection', () => {
    test('should trigger safety violation when obstacle is too close', () => {
      // Setup
      const obstacleData = {
        obstacles: [
          {
            position: { x: 10, y: 0, z: 0 },
            size: { width: 1, height: 1, depth: 1 }
          }
        ],
        position: { x: 9, y: 0, z: 0 } // Distance is 1m, threshold is 2m
      };
      
      // Execute
      safetyMonitor._handleObstacleDetection(obstacleData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.obstacleProximity).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'obstacleProximity'
        })
      );
    });
    
    test('should clear safety violation when obstacle moves away', () => {
      // Setup - first trigger violation
      safetyMonitor.safetyState.currentViolations.obstacleProximity = true;
      
      const obstacleData = {
        obstacles: [
          {
            position: { x: 10, y: 0, z: 0 },
            size: { width: 1, height: 1, depth: 1 }
          }
        ],
        position: { x: 5, y: 0, z: 0 } // Distance is 5m, threshold is 2m
      };
      
      // Execute
      safetyMonitor._handleObstacleDetection(obstacleData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.obstacleProximity).toBe(false);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation.cleared',
        expect.objectContaining({
          type: 'obstacleProximity'
        })
      );
    });
  });
  
  describe('Boundary Violation', () => {
    test('should trigger safety violation when tractor leaves boundaries', () => {
      // Setup
      const boundaryData = {
        position: { x: 100, y: 100, z: 0 }, // Outside boundaries
        timestamp: Date.now()
      };
      
      // Execute
      safetyMonitor._handleBoundaryViolation(boundaryData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.boundaryViolation).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'boundaryViolation'
        })
      );
    });
  });
  
  describe('Motor Status Monitoring', () => {
    test('should detect motor overheating', () => {
      // Setup
      const motorData = {
        motors: {
          frontLeft: { temperature: 85 }, // Above critical threshold
          frontRight: { temperature: 70 },
          rearLeft: { temperature: 65 },
          rearRight: { temperature: 60 }
        }
      };
      
      // Execute
      safetyMonitor._handleMotorStatus(motorData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.motorOverheat).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'motorOverheat'
        })
      );
    });
    
    test('should detect motor overcurrent', () => {
      // Setup
      const motorData = {
        motors: {
          frontLeft: { current: 12 }, // Above threshold (10A)
          frontRight: { current: 8 },
          rearLeft: { current: 9 },
          rearRight: { current: 8 }
        }
      };
      
      // Execute
      safetyMonitor._handleMotorStatus(motorData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.motorOvercurrent).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'motorOvercurrent'
        })
      );
    });
    
    test('should clear motor violations when conditions return to normal', () => {
      // Setup - first trigger violations
      safetyMonitor.safetyState.currentViolations.motorOverheat = true;
      safetyMonitor.safetyState.currentViolations.motorOvercurrent = true;
      
      const motorData = {
        motors: {
          frontLeft: { temperature: 50, current: 5 },
          frontRight: { temperature: 55, current: 5 },
          rearLeft: { temperature: 45, current: 5 },
          rearRight: { temperature: 50, current: 5 }
        }
      };
      
      // Execute
      safetyMonitor._handleMotorStatus(motorData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.motorOverheat).toBe(false);
      expect(safetyMonitor.safetyState.currentViolations.motorOvercurrent).toBe(false);
    });
  });
  
  describe('Power Monitoring', () => {
    test('should detect low battery', () => {
      // Setup
      const powerData = {
        batteryLevel: 15 // Below low threshold (20%)
      };
      
      // Execute
      safetyMonitor._handlePowerStatus(powerData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.batteryLow).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'batteryLow'
        })
      );
    });
    
    test('should detect critical battery', () => {
      // Setup
      const powerData = {
        batteryLevel: 5 // Below critical threshold (10%)
      };
      
      // Execute
      safetyMonitor._handlePowerStatus(powerData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.batteryCritical).toBe(true);
      expect(safetyMonitor.safetyState.currentViolations.batteryLow).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'batteryCritical',
          severity: 'critical'
        })
      );
      
      // Critical battery should trigger emergency stop
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.emergencyStop.triggered',
        expect.any(Object)
      );
    });
    
    test('should clear battery violations when battery level increases', () => {
      // Setup - first trigger violations
      safetyMonitor.safetyState.currentViolations.batteryLow = true;
      safetyMonitor.safetyState.currentViolations.batteryCritical = true;
      
      const powerData = {
        batteryLevel: 25 // Above low threshold (20%)
      };
      
      // Execute
      safetyMonitor._handlePowerStatus(powerData);
      
      // Verify
      expect(safetyMonitor.safetyState.currentViolations.batteryLow).toBe(false);
      expect(safetyMonitor.safetyState.currentViolations.batteryCritical).toBe(false);
    });
  });
  
  describe('Orientation Monitoring', () => {
    test('should detect excessive tilt', () => {
      // Setup
      const imuData = {
        orientation: {
          roll: 0.3, // ~17 degrees
          pitch: 0.2, // ~11 degrees
          yaw: 0
        }
      };
      
      // Execute
      safetyMonitor._handleOrientationData(imuData);
      
      // Verify - combined tilt is ~20 degrees, threshold is 15 degrees
      expect(safetyMonitor.safetyState.currentViolations.tiltExceeded).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'tiltExceeded',
          severity: 'critical'
        })
      );
      
      // Excessive tilt should trigger emergency stop
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.emergencyStop.triggered',
        expect.any(Object)
      );
    });
    
    test('should clear tilt violation when orientation returns to safe range', () => {
      // Setup - first trigger violation
      safetyMonitor.safetyState.currentViolations.tiltExceeded = true;
      
      const imuData = {
        orientation: {
          roll: 0.1, // ~6 degrees
          pitch: 0.1, // ~6 degrees
          yaw: 0
        }
      };
      
      // Execute
      safetyMonitor._handleOrientationData(imuData);
      
      // Verify - combined tilt is ~8 degrees, below threshold
      expect(safetyMonitor.safetyState.currentViolations.tiltExceeded).toBe(false);
    });
  });
  
  describe('Emergency Stop', () => {
    test('should trigger emergency stop', () => {
      // Execute
      safetyMonitor.triggerEmergencyStop('Test emergency stop', 'test');
      
      // Verify
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(true);
      expect(safetyMonitor.safetyState.lastEmergencyStop).toBeDefined();
      expect(safetyMonitor.safetyState.lastEmergencyStop.reason).toBe('Test emergency stop');
      expect(safetyMonitor.safetyState.lastEmergencyStop.source).toBe('test');
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.emergencyStop.triggered',
        expect.objectContaining({
          reason: 'Test emergency stop',
          source: 'test'
        })
      );
    });
    
    test('should not trigger emergency stop if already active', () => {
      // Setup
      safetyMonitor.safetyState.emergencyStopActive = true;
      eventBus.publish.mockClear();
      
      // Execute
      safetyMonitor.triggerEmergencyStop('Second emergency stop', 'test');
      
      // Verify - event should not be published again
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
    
    test('should handle emergency stop event', () => {
      // Setup
      const emergencyStopData = {
        reason: 'External emergency stop',
        source: 'external'
      };
      
      // Execute
      safetyMonitor._handleEmergencyStop(emergencyStopData);
      
      // Verify
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(true);
      expect(safetyMonitor.safetyState.lastEmergencyStop).toBeDefined();
      expect(safetyMonitor.safetyState.lastEmergencyStop.reason).toBe('External emergency stop');
      expect(safetyMonitor.safetyState.lastEmergencyStop.source).toBe('external');
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.emergencyStop.activated',
        expect.any(Object)
      );
    });
    
    test('should reset emergency stop when safe', () => {
      // Setup
      safetyMonitor.safetyState.emergencyStopActive = true;
      safetyMonitor._hasCriticalViolations = jest.fn().mockReturnValue(false);
      
      // Execute
      const result = safetyMonitor.resetEmergencyStop();
      
      // Verify
      expect(result).toBe(true);
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(false);
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.emergencyStop.reset',
        expect.any(Object)
      );
    });
    
    test('should not reset emergency stop when critical violations exist', () => {
      // Setup
      safetyMonitor.safetyState.emergencyStopActive = true;
      safetyMonitor._hasCriticalViolations = jest.fn().mockReturnValue(true);
      
      // Execute
      const result = safetyMonitor.resetEmergencyStop();
      
      // Verify
      expect(result).toBe(false);
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(true);
    });
  });
  
  describe('Safety Violations', () => {
    test('should trigger safety violation with correct severity', () => {
      // Execute - non-critical violation
      safetyMonitor._triggerSafetyViolation('obstacleProximity', 'Obstacle too close');
      
      // Verify
      expect(safetyMonitor.safetyState.safetyViolations.length).toBe(1);
      expect(safetyMonitor.safetyState.safetyViolations[0].type).toBe('obstacleProximity');
      expect(safetyMonitor.safetyState.safetyViolations[0].message).toBe('Obstacle too close');
      
      // Verify event was published with warning severity
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'obstacleProximity',
          severity: 'warning'
        })
      );
      
      // Clear previous calls
      eventBus.publish.mockClear();
      
      // Execute - critical violation
      safetyMonitor._triggerSafetyViolation('humanProximity', 'Human too close');
      
      // Verify
      expect(safetyMonitor.safetyState.safetyViolations.length).toBe(2);
      
      // Verify event was published with critical severity
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation',
        expect.objectContaining({
          type: 'humanProximity',
          severity: 'critical'
        })
      );
      
      // Critical violation should trigger emergency stop
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.emergencyStop.triggered',
        expect.any(Object)
      );
    });
    
    test('should clear safety violation', () => {
      // Execute
      safetyMonitor._clearSafetyViolation('obstacleProximity');
      
      // Verify
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.violation.cleared',
        expect.objectContaining({
          type: 'obstacleProximity'
        })
      );
    });
    
    test('should detect critical violations', () => {
      // Setup - set critical violations
      safetyMonitor.safetyState.currentViolations.humanProximity = true;
      
      // Execute
      const hasCritical = safetyMonitor._hasCriticalViolations();
      
      // Verify
      expect(hasCritical).toBe(true);
      
      // Clear critical violations
      safetyMonitor.safetyState.currentViolations.humanProximity = false;
      
      // Execute again
      const hasCriticalAfter = safetyMonitor._hasCriticalViolations();
      
      // Verify
      expect(hasCriticalAfter).toBe(false);
    });
  });
  
  describe('Safety Status', () => {
    test('should publish safety status', () => {
      // Execute
      safetyMonitor._publishSafetyStatus();
      
      // Verify
      expect(eventBus.publish).toHaveBeenCalledWith(
        'safety.status.updated',
        expect.objectContaining({
          emergencyStopActive: expect.any(Boolean),
          currentViolations: expect.any(Object),
          hasActiveViolations: expect.any(Boolean),
          failSafeMode: expect.any(String),
          timestamp: expect.any(Number)
        })
      );
    });
    
    test('should provide current safety status', () => {
      // Setup
      safetyMonitor.safetyState.emergencyStopActive = true;
      safetyMonitor.safetyState.currentViolations.obstacleProximity = true;
      
      // Execute
      const status = safetyMonitor.getStatus();
      
      // Verify
      expect(status).toEqual({
        emergencyStopActive: true,
        currentViolations: expect.objectContaining({
          obstacleProximity: true
        }),
        hasActiveViolations: true,
        failSafeMode: 'stop',
        isSafeToOperate: false,
        lastSafetyCheck: expect.any(Number)
      });
    });
    
    test('should determine if safe to operate', () => {
      // Setup - no violations
      safetyMonitor.safetyState.emergencyStopActive = false;
      safetyMonitor._hasCriticalViolations = jest.fn().mockReturnValue(false);
      
      // Execute
      const isSafe = safetyMonitor.isSafeToOperate();
      
      // Verify
      expect(isSafe).toBe(true);
      
      // Setup - emergency stop active
      safetyMonitor.safetyState.emergencyStopActive = true;
      
      // Execute
      const isSafeWithEmergencyStop = safetyMonitor.isSafeToOperate();
      
      // Verify
      expect(isSafeWithEmergencyStop).toBe(false);
      
      // Setup - critical violations
      safetyMonitor.safetyState.emergencyStopActive = false;
      safetyMonitor._hasCriticalViolations = jest.fn().mockReturnValue(true);
      
      // Execute
      const isSafeWithCriticalViolations = safetyMonitor.isSafeToOperate();
      
      // Verify
      expect(isSafeWithCriticalViolations).toBe(false);
    });
  });
  
  describe('Fail-Safe Scenarios', () => {
    test('should handle multiple simultaneous safety violations', () => {
      // Setup
      safetyMonitor._triggerSafetyViolation = jest.fn();
      
      // Execute - trigger multiple violations
      safetyMonitor._handleObstacleDetection({
        obstacles: [{ position: { x: 1, y: 0, z: 0 } }],
        position: { x: 0, y: 0, z: 0 }
      });
      
      safetyMonitor._handleBoundaryViolation({
        position: { x: 100, y: 100, z: 0 }
      });
      
      safetyMonitor._handlePowerStatus({
        batteryLevel: 5 // Critical
      });
      
      // Verify
      expect(safetyMonitor._triggerSafetyViolation).toHaveBeenCalledTimes(3);
      
      // Check if emergency stop was triggered due to critical battery
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(true);
    });
    
    test('should prioritize critical violations', () => {
      // Setup - trigger both critical and non-critical violations
      safetyMonitor.safetyState.currentViolations.obstacleProximity = true; // Non-critical
      safetyMonitor.safetyState.currentViolations.humanProximity = true; // Critical
      
      // Execute
      const hasCritical = safetyMonitor._hasCriticalViolations();
      const isSafe = safetyMonitor.isSafeToOperate();
      
      // Verify
      expect(hasCritical).toBe(true);
      expect(isSafe).toBe(false);
      
      // Clear only critical violation
      safetyMonitor.safetyState.currentViolations.humanProximity = false;
      
      // Execute again
      const hasCriticalAfter = safetyMonitor._hasCriticalViolations();
      const isSafeAfter = safetyMonitor.isSafeToOperate();
      
      // Verify - should be safe to operate even with non-critical violation
      expect(hasCriticalAfter).toBe(false);
      expect(isSafeAfter).toBe(true);
    });
    
    test('should handle watchdog timeout as critical violation', () => {
      // Setup
      safetyMonitor.triggerEmergencyStop = jest.fn();
      
      // Execute - trigger watchdog timeout
      safetyMonitor._triggerSafetyViolation('watchdogTimeout', 'Watchdog timer expired');
      
      // Verify
      expect(safetyMonitor.triggerEmergencyStop).toHaveBeenCalled();
    });
    
    test('should handle communication loss gracefully', () => {
      // Setup - simulate communication delay
      safetyMonitor.lastWatchdogReset = Date.now() - 4000; // 80% of timeout
      
      // Execute - run safety check
      safetyMonitor._performSafetyCheck();
      
      // Verify - should detect communication loss but not trigger emergency stop yet
      expect(safetyMonitor.safetyState.currentViolations.communicationLoss).toBe(true);
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(false);
      
      // Now simulate complete communication loss
      safetyMonitor.lastWatchdogReset = Date.now() - 6000; // Beyond timeout
      
      // Execute - trigger watchdog check
      jest.advanceTimersByTime(3000); // Trigger watchdog check
      
      // Verify - should now trigger emergency stop
      expect(safetyMonitor.safetyState.emergencyStopActive).toBe(true);
    });
  });
  
  describe('Shutdown', () => {
    test('should stop timers and clean up resources', async () => {
      // Setup
      global.clearInterval = jest.fn();
      
      // Execute
      const result = await safetyMonitor.shutdown();
      
      // Verify
      expect(result).toBe(true);
      expect(global.clearInterval).toHaveBeenCalledTimes(2); // Watchdog and safety check
      expect(safetyMonitor.watchdogTimer).toBeNull();
      expect(safetyMonitor.safetyCheckInterval).toBeNull();
    });
  });
});