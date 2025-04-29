/**
 * Simulation tests for NavigationSystem
 */

const NavigationSystem = require('../../../src/navigation/navigationSystem');
const SensorManager = require('../../../src/sensors/sensorManager');
const eventBus = require('../../../src/utils/eventBus');

// Mock dependencies
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/eventBus');
jest.mock('../../../src/sensors/sensorManager');
jest.mock('../../../src/config', () => ({
  navigation: {
    waypointReachedThreshold: 2.0,
    pathPlanningResolution: 1.0,
    obstacleAvoidanceMargin: 1.5,
    maxPathfindingIterations: 1000,
    geofencingMargin: 5.0
  }
}));

describe('NavigationSystem Simulation Tests', () => {
  let navigationSystem;
  let mockSensorManager;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create mock sensor manager
    mockSensorManager = new SensorManager();
    
    // Mock getPositionAndOrientation method
    mockSensorManager.getPositionAndOrientation = jest.fn().mockReturnValue({
      position: { x: 0, y: 0, z: 0, uncertainty: 1.0 },
      orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
      velocity: { x: 0, y: 0, z: 0, uncertainty: 0.5 },
      angularVelocity: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.05 },
      timestamp: Date.now()
    });
    
    // Create a new instance for each test
    navigationSystem = new NavigationSystem(mockSensorManager);
    
    // Initialize the navigation system
    navigationSystem.initialize();
  });
  
  afterEach(() => {
    // Clean up
    navigationSystem.shutdown();
    jest.useRealTimers();
  });
  
  describe('Waypoint Navigation', () => {
    test('should navigate through waypoints', () => {
      // Setup - define waypoints
      const waypoints = [
        { x: 10, y: 0, z: 0 },
        { x: 10, y: 10, z: 0 },
        { x: 0, y: 10, z: 0 },
        { x: 0, y: 0, z: 0 }
      ];
      
      // Set waypoints
      const result = navigationSystem.setWaypoints(waypoints);
      expect(result).toBe(true);
      expect(navigationSystem.path.waypoints).toEqual(waypoints);
      expect(navigationSystem.path.currentWaypoint).toBe(0);
      
      // Start navigation
      const startResult = navigationSystem.startNavigation();
      expect(startResult).toBe(true);
      expect(navigationSystem.state.isNavigating).toBe(true);
      expect(navigationSystem.state.navigationMode).toBe('autonomous');
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'navigation.started',
        expect.objectContaining({
          waypoints: waypoints.length
        })
      );
      
      // Simulate navigation to first waypoint
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 9, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify we're still on the first waypoint
      expect(navigationSystem.path.currentWaypoint).toBe(0);
      
      // Move closer to first waypoint
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 9.5, y: 0.5, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: Math.PI/4, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Reach first waypoint
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 10, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: Math.PI/2, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify we've moved to the second waypoint
      expect(navigationSystem.path.currentWaypoint).toBe(1);
      expect(navigationSystem.path.completedWaypoints).toBe(1);
      
      // Verify waypoint reached event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'navigation.waypoint.reached',
        expect.objectContaining({
          waypointIndex: 0
        })
      );
      
      // Reach second waypoint
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 10, y: 10, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: Math.PI, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify we've moved to the third waypoint
      expect(navigationSystem.path.currentWaypoint).toBe(2);
      expect(navigationSystem.path.completedWaypoints).toBe(2);
      
      // Reach third waypoint
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 0, y: 10, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: -Math.PI/2, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify we've moved to the fourth waypoint
      expect(navigationSystem.path.currentWaypoint).toBe(3);
      expect(navigationSystem.path.completedWaypoints).toBe(3);
      
      // Reach final waypoint
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 0, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify navigation is complete
      expect(navigationSystem.path.currentWaypoint).toBe(4); // Past the end of waypoints
      expect(navigationSystem.path.completedWaypoints).toBe(4);
      expect(navigationSystem.state.isNavigating).toBe(false);
      
      // Verify path complete event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'navigation.path.complete',
        expect.any(Object)
      );
    });
    
    test('should calculate path progress correctly', () => {
      // Setup - define waypoints in a square
      const waypoints = [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 10, y: 10, z: 0 },
        { x: 0, y: 10, z: 0 },
        { x: 0, y: 0, z: 0 }
      ];
      
      // Set waypoints
      navigationSystem.setWaypoints(waypoints);
      navigationSystem.startNavigation();
      
      // Total path length should be 40 (10 + 10 + 10 + 10)
      expect(navigationSystem.path.totalDistance).toBeCloseTo(40, 1);
      
      // At start, progress should be 0
      expect(navigationSystem.path.progress).toBeCloseTo(0, 2);
      
      // Move 1/4 of the way
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 10, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Progress should be 1/4
      expect(navigationSystem.path.progress).toBeCloseTo(0.25, 2);
      
      // Move 1/2 of the way
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 10, y: 10, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Progress should be 1/2
      expect(navigationSystem.path.progress).toBeCloseTo(0.5, 2);
      
      // Move 3/4 of the way
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 0, y: 10, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Progress should be 3/4
      expect(navigationSystem.path.progress).toBeCloseTo(0.75, 2);
      
      // Complete the path
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 0, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Progress should be 1
      expect(navigationSystem.path.progress).toBeCloseTo(1, 2);
    });
  });
  
  describe('Obstacle Avoidance', () => {
    test('should detect and avoid obstacles in path', () => {
      // Setup - define waypoints
      const waypoints = [
        { x: 0, y: 0, z: 0 },
        { x: 20, y: 0, z: 0 }
      ];
      
      // Set waypoints and start navigation
      navigationSystem.setWaypoints(waypoints);
      navigationSystem.startNavigation();
      
      // Mock obstacle detection
      navigationSystem._findObstaclesInPath = jest.fn().mockReturnValue([
        {
          position: { x: 10, y: 0, z: 0 },
          size: { width: 2, height: 2, depth: 2 }
        }
      ]);
      
      // Mock path planning to go around obstacle
      navigationSystem._planPath = jest.fn().mockReturnValue([
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 5, z: 0 }, // Detour around obstacle
        { x: 20, y: 0, z: 0 }
      ]);
      
      // Position at start
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 0, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop to check for obstacles
      navigationSystem._updateLoop();
      
      // Verify obstacle was detected
      expect(navigationSystem.state.obstacleDetected).toBe(true);
      expect(navigationSystem.state.obstacleAvoidanceActive).toBe(true);
      
      // Verify obstacle avoidance event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'navigation.obstacleAvoidance.started',
        expect.any(Object)
      );
      
      // Verify path was replanned
      expect(navigationSystem._planPath).toHaveBeenCalled();
      
      // Verify waypoints were updated with detour
      expect(navigationSystem.path.waypoints).toContainEqual({ x: 10, y: 5, z: 0 });
      
      // Move to detour point
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 10, y: 5, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Clear obstacle detection
      navigationSystem._findObstaclesInPath = jest.fn().mockReturnValue([]);
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify obstacle is no longer detected
      expect(navigationSystem.state.obstacleDetected).toBe(false);
      
      // Verify obstacle avoidance stopped event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'navigation.obstacleAvoidance.stopped',
        expect.any(Object)
      );
    });
  });
  
  describe('Boundary Checking', () => {
    test('should detect when tractor leaves field boundaries', () => {
      // Setup - define field boundaries as a square
      const boundaries = [
        { x: -10, y: -10, z: 0 },
        { x: 10, y: -10, z: 0 },
        { x: 10, y: 10, z: 0 },
        { x: -10, y: 10, z: 0 }
      ];
      
      // Set boundaries
      navigationSystem.setFieldBoundaries(boundaries);
      
      // Position inside boundaries
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 0, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify we're within boundaries
      expect(navigationSystem.boundaries.isWithinBoundaries).toBe(true);
      
      // Position outside boundaries
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 15, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify we're outside boundaries
      expect(navigationSystem.boundaries.isWithinBoundaries).toBe(false);
      
      // Verify boundary violation event was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'navigation.boundaryViolation',
        expect.any(Object)
      );
      
      // Return inside boundaries
      mockSensorManager.getPositionAndOrientation.mockReturnValue({
        position: { x: 5, y: 0, z: 0, uncertainty: 1.0 },
        orientation: { roll: 0, pitch: 0, yaw: 0, uncertainty: 0.1 },
        timestamp: Date.now()
      });
      
      // Run update loop
      navigationSystem._updateLoop();
      
      // Verify we're back within boundaries
      expect(navigationSystem.boundaries.isWithinBoundaries).toBe(true);
    });
  });
  
  describe('Path Planning', () => {
    test('should plan direct path when no obstacles', () => {
      // Setup
      const start = { x: 0, y: 0, z: 0 };
      const goal = { x: 10, y: 0, z: 0 };
      
      // No obstacles
      navigationSystem.state.obstacleDetected = false;
      
      // Execute
      const path = navigationSystem._planPath(start, goal);
      
      // Verify direct path
      expect(path).toEqual([start, goal]);
    });
    
    test('should plan path around obstacles', () => {
      // Setup
      const start = { x: 0, y: 0, z: 0 };
      const goal = { x: 20, y: 0, z: 0 };
      
      // With obstacles
      navigationSystem.state.obstacleDetected = true;
      navigationSystem._findObstaclesInPath = jest.fn().mockReturnValue([
        {
          position: { x: 10, y: 0, z: 0 },
          size: { width: 2, height: 2, depth: 2 }
        }
      ]);
      
      // Execute
      const path = navigationSystem._planPath(start, goal);
      
      // Verify path has intermediate waypoint to avoid obstacle
      expect(path.length).toBeGreaterThan(2);
      
      // First point should be start
      expect(path[0]).toEqual(start);
      
      // Last point should be goal
      expect(path[path.length - 1]).toEqual(goal);
      
      // Intermediate point should avoid the obstacle at (10,0)
      const intermediatePoint = path[1];
      const distanceToObstacle = Math.sqrt(
        Math.pow(intermediatePoint.x - 10, 2) + 
        Math.pow(intermediatePoint.y - 0, 2)
      );
      
      // Should be at least obstacle avoidance margin away
      expect(distanceToObstacle).toBeGreaterThanOrEqual(navigationSystem.params.obstacleAvoidanceMargin);
    });
  });
  
  describe('Status Updates', () => {
    test('should publish navigation status updates', () => {
      // Clear previous calls
      eventBus.publish.mockClear();
      
      // Execute update loop
      navigationSystem._updateLoop();
      
      // Verify status was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'navigation.status.updated',
        expect.objectContaining({
          position: expect.any(Object),
          orientation: expect.any(Object),
          isNavigating: expect.any(Boolean),
          timestamp: expect.any(Number)
        })
      );
    });
    
    test('should provide current navigation status', () => {
      // Setup
      navigationSystem.state.currentPosition = { x: 5, y: 10, z: 0 };
      navigationSystem.state.currentOrientation = { roll: 0.1, pitch: 0.2, yaw: 0.3 };
      navigationSystem.state.isNavigating = true;
      navigationSystem.state.navigationMode = 'autonomous';
      navigationSystem.path.currentWaypoint = 2;
      navigationSystem.path.waypoints = [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 10, y: 10, z: 0 },
        { x: 0, y: 10, z: 0 }
      ];
      navigationSystem.path.completedWaypoints = 2;
      navigationSystem.path.progress = 0.5;
      
      // Execute
      const status = navigationSystem.getStatus();
      
      // Verify
      expect(status).toEqual({
        position: { x: 5, y: 10, z: 0 },
        orientation: { roll: 0.1, pitch: 0.2, yaw: 0.3 },
        positionUncertainty: expect.any(Number),
        isNavigating: true,
        navigationMode: 'autonomous',
        obstacleDetected: expect.any(Boolean),
        isWithinBoundaries: expect.any(Boolean),
        path: {
          currentWaypoint: 2,
          totalWaypoints: 4,
          completedWaypoints: 2,
          progress: 0.5,
          remainingDistance: expect.any(Number)
        }
      });
    });
  });
});