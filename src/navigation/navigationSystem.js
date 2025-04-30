/**
 * Sevak Mini Tractor - Navigation System
 * 
 * Manages autonomous navigation, path planning, and obstacle avoidance.
 * Integrates sensor data to determine position and plan safe routes.
 */

const Logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');
const config = require('../config');

class NavigationSystem {
  constructor(sensorManager) {
    this.logger = new Logger('NavigationSystem');
    this.sensorManager = sensorManager;
    
    // Navigation state
    this.state = {
      currentPosition: { x: 0, y: 0, z: 0 },
      currentOrientation: { roll: 0, pitch: 0, yaw: 0 },
      positionUncertainty: 10.0, // meters
      isNavigating: false,
      isPathValid: false,
      navigationMode: 'idle', // 'idle', 'manual', 'autonomous'
      obstacleDetected: false,
      obstacleAvoidanceActive: false
    };
    
    // Path planning
    this.path = {
      waypoints: [],
      currentWaypoint: 0,
      completedWaypoints: 0,
      totalDistance: 0,
      remainingDistance: 0,
      progress: 0
    };
    
    // Field boundaries
    this.boundaries = {
      points: [],
      isWithinBoundaries: true
    };
    
    // Obstacle map
    this.obstacleMap = {
      staticObstacles: [],
      dynamicObstacles: [],
      lastUpdated: 0
    };
    
    // Navigation parameters
    this.params = {
      waypointReachedThreshold: config.navigation.waypointReachedThreshold || 1.0,
      pathPlanningResolution: config.navigation.pathPlanningResolution || 0.5,
      obstacleAvoidanceMargin: config.navigation.obstacleAvoidanceMargin || 1.0,
      maxPathfindingIterations: config.navigation.maxPathfindingIterations || 1000,
      geofencingMargin: config.navigation.geofencingMargin || 2.0
    };
  }
  
  /**
   * Initialize the navigation system
   */
  async initialize() {
    this.logger.info('Initializing navigation system...');
    
    try {
      // Subscribe to sensor updates
      this._subscribeToSensorUpdates();
      
      // Start update loop
      this._startUpdateLoop();
      
      this.logger.info('Navigation system initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize navigation system: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Subscribe to sensor updates
   * @private
   */
  _subscribeToSensorUpdates() {
    // Subscribe to GPS updates
    eventBus.subscribe('sensor.gps.updated', (data) => {
      this._updatePositionFromGPS(data);
    });
    
    // Subscribe to IMU updates
    eventBus.subscribe('sensor.imu.updated', (data) => {
      this._updateOrientationFromIMU(data);
    });
    
    // Subscribe to LIDAR updates
    eventBus.subscribe('sensor.lidar.updated', (data) => {
      this._updateObstacleMapFromLidar(data);
    });
    
    // Subscribe to ultrasonic updates
    eventBus.subscribe('sensor.ultrasonic.updated', (data) => {
      this._updateObstacleMapFromUltrasonic(data);
    });
  }
  
  /**
   * Start the navigation update loop
   * @private
   */
  _startUpdateLoop() {
    this.logger.info('Starting navigation update loop');
    
    // Run update loop at 10Hz
    this.updateInterval = setInterval(() => {
      this._updateLoop();
    }, 100);
  }
  
  /**
   * Stop the navigation update loop
   * @private
   */
  _stopUpdateLoop() {
    this.logger.info('Stopping navigation update loop');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Main update loop for navigation
   * @private
   */
  _updateLoop() {
    // Skip if not navigating
    if (!this.state.isNavigating) {
      return;
    }
    
    // Get current position and orientation
    const positionData = this.sensorManager.getPositionAndOrientation();
    this.state.currentPosition = positionData.position;
    this.state.currentOrientation = positionData.orientation;
    this.state.positionUncertainty = positionData.position.uncertainty || 10.0;
    
    // Check if within field boundaries
    this._checkBoundaries();
    
    // Check for obstacles
    this._checkObstacles();
    
    // Update path progress
    this._updatePathProgress();
    
    // Check if waypoint reached
    if (this.state.isNavigating && this.path.waypoints.length > 0) {
      this._checkWaypointReached();
    }
    
    // Publish navigation status
    this._publishNavigationStatus();
  }
/**
   * Update position from GPS data
   * @private
   */
  _updatePositionFromGPS(gpsData) {
    // Position is updated through the sensor fusion system
    // We just need to update the navigation state with the latest position
    
    // In a real implementation, we might do additional processing here
  }
  
  /**
   * Update orientation from IMU data
   * @private
   */
  _updateOrientationFromIMU(imuData) {
    // Orientation is updated through the sensor fusion system
    // We just need to update the navigation state with the latest orientation
    
    // In a real implementation, we might do additional processing here
  }
  
  /**
   * Update obstacle map from LIDAR data
   * @private
   */
  _updateObstacleMapFromLidar(lidarData) {
    // Process LIDAR points to detect obstacles
    const obstacles = this._detectObstaclesFromLidar(lidarData);
    
    // Update obstacle map
    this._updateObstacleMap(obstacles, 'lidar');
  }
  
  /**
   * Detect obstacles from LIDAR data
   * @private
   */
  _detectObstaclesFromLidar(lidarData) {
    const obstacles = [];
    
    // In a real implementation, this would use clustering algorithms
    // to identify obstacles from LIDAR point cloud data
    
    // For this prototype, we'll simulate obstacle detection
    
    // Group points into clusters
    const clusters = this._clusterLidarPoints(lidarData.points);
    
    // Process each cluster
    clusters.forEach(cluster => {
      // Calculate cluster properties
      const center = this._calculateClusterCenter(cluster);
      const size = this._calculateClusterSize(cluster);
      
      // Create obstacle object
      const obstacle = {
        position: center,
        size: size,
        confidence: 0.9, // High confidence for LIDAR
        velocity: { x: 0, y: 0, z: 0 }, // Assume static for now
        type: 'unknown',
        source: 'lidar',
        timestamp: lidarData.timestamp
      };
      
      obstacles.push(obstacle);
    });
    
    return obstacles;
  }
  
  /**
   * Cluster LIDAR points
   * @private
   */
  _clusterLidarPoints(points) {
    // In a real implementation, this would use a clustering algorithm
    // For this prototype, we'll simulate clustering
    
    // Simplified clustering - group points by angle sectors
    const clusters = [];
    const sectorSize = Math.PI / 8; // 22.5 degrees per sector
    const numSectors = Math.ceil(2 * Math.PI / sectorSize);
    
    // Initialize sectors
    const sectors = new Array(numSectors).fill().map(() => []);
    
    // Assign points to sectors
    points.forEach(point => {
      const sectorIndex = Math.floor((point.angle + Math.PI) / sectorSize) % numSectors;
      sectors[sectorIndex].push(point);
    });
    
    // Create clusters from non-empty sectors
    sectors.forEach(sector => {
      if (sector.length > 0) {
        // Check if points are close enough to form a cluster
        const avgDistance = sector.reduce((sum, p) => sum + p.distance, 0) / sector.length;
        
        // If average distance is less than threshold, consider it an obstacle
        if (avgDistance < 15) {
          clusters.push(sector);
        }
      }
    });
    
    return clusters;
  }
  
  /**
   * Calculate cluster center
   * @private
   */
  _calculateClusterCenter(cluster) {
    // Convert polar coordinates to Cartesian
    let sumX = 0;
    let sumY = 0;
    
    cluster.forEach(point => {
      const x = point.distance * Math.cos(point.angle);
      const y = point.distance * Math.sin(point.angle);
      sumX += x;
      sumY += y;
    });
    
    const center = {
      x: sumX / cluster.length,
      y: sumY / cluster.length,
      z: 0 // Assume flat ground for simplicity
    };
    
    return center;
  }
  
  /**
   * Calculate cluster size
   * @private
   */
  _calculateClusterSize(cluster) {
    // Find min and max points in cluster
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    cluster.forEach(point => {
      const x = point.distance * Math.cos(point.angle);
      const y = point.distance * Math.sin(point.angle);
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    
    const size = {
      width: maxX - minX,
      height: 1.0, // Assume 1m height
      depth: maxY - minY
    };
    
    return size;
  }
/**
   * Update obstacle map from ultrasonic data
   * @private
   */
  _updateObstacleMapFromUltrasonic(ultrasonicData) {
    // Process ultrasonic data to detect obstacles
    const obstacles = this._detectObstaclesFromUltrasonic(ultrasonicData);
    
    // Update obstacle map
    this._updateObstacleMap(obstacles, 'ultrasonic');
  }
  
  /**
   * Detect obstacles from ultrasonic data
   * @private
   */
  _detectObstaclesFromUltrasonic(ultrasonicData) {
    const obstacles = [];
    
    // Process each ultrasonic sensor
    ultrasonicData.sensors.forEach(sensor => {
      // Skip if no obstacle detected
      if (sensor.distance >= sensor.maxRange) {
        return;
      }
      
      // Calculate obstacle position based on sensor position and orientation
      const position = this._calculatePositionFromUltrasonic(sensor);
      
      // Create obstacle object
      const obstacle = {
        position: position,
        size: {
          width: 0.5, // Assume 0.5m width
          height: 0.5, // Assume 0.5m height
          depth: 0.5  // Assume 0.5m depth
        },
        confidence: 0.7, // Medium confidence for ultrasonic
        velocity: { x: 0, y: 0, z: 0 }, // Assume static for now
        type: 'unknown',
        source: 'ultrasonic',
        timestamp: ultrasonicData.timestamp
      };
      
      obstacles.push(obstacle);
    });
    
    return obstacles;
  }
  
  /**
   * Calculate position from ultrasonic sensor
   * @private
   */
  _calculatePositionFromUltrasonic(sensor) {
    // In a real implementation, this would use the sensor's position and orientation
    // For this prototype, we'll use a simplified approach
    
    // Determine sensor position and orientation based on ID
    let angle = 0;
    
    switch (sensor.id) {
      case 'front_left':
        angle = -Math.PI / 4; // -45 degrees
        break;
      case 'front_center':
        angle = 0; // 0 degrees (forward)
        break;
      case 'front_right':
        angle = Math.PI / 4; // 45 degrees
        break;
      case 'rear_left':
        angle = -3 * Math.PI / 4; // -135 degrees
        break;
      case 'rear_center':
        angle = Math.PI; // 180 degrees (backward)
        break;
      case 'rear_right':
        angle = 3 * Math.PI / 4; // 135 degrees
        break;
      case 'left_center':
        angle = -Math.PI / 2; // -90 degrees (left)
        break;
      case 'right_center':
        angle = Math.PI / 2; // 90 degrees (right)
        break;
    }
    
    // Calculate position relative to tractor
    const relativePosition = {
      x: sensor.distance * Math.cos(angle),
      y: sensor.distance * Math.sin(angle),
      z: 0 // Assume flat ground
    };
    
    // Convert to global coordinates
    // In a real implementation, this would use the tractor's position and orientation
    const globalPosition = {
      x: this.state.currentPosition.x + relativePosition.x * Math.cos(this.state.currentOrientation.yaw) - relativePosition.y * Math.sin(this.state.currentOrientation.yaw),
      y: this.state.currentPosition.y + relativePosition.x * Math.sin(this.state.currentOrientation.yaw) + relativePosition.y * Math.cos(this.state.currentOrientation.yaw),
      z: this.state.currentPosition.z + relativePosition.z
    };
    
    return globalPosition;
  }
  
  /**
   * Update obstacle map with new detections
   * @private
   */
  _updateObstacleMap(newObstacles, source) {
    const now = Date.now();
    
    // Update existing obstacles
    if (source === 'lidar') {
      // LIDAR provides a complete view, so replace static obstacles
      this.obstacleMap.staticObstacles = newObstacles;
    } else {
      // For other sensors, merge with existing obstacles
      newObstacles.forEach(newObstacle => {
        // Check if obstacle already exists
        const existingIndex = this.obstacleMap.staticObstacles.findIndex(
          existing => this._areObstaclesTheSame(existing, newObstacle)
        );
        
        if (existingIndex >= 0) {
          // Update existing obstacle
          const existing = this.obstacleMap.staticObstacles[existingIndex];
          
          // Update position with weighted average
          const weight = newObstacle.confidence / (existing.confidence + newObstacle.confidence);
          existing.position.x = (1 - weight) * existing.position.x + weight * newObstacle.position.x;
          existing.position.y = (1 - weight) * existing.position.y + weight * newObstacle.position.y;
          existing.position.z = (1 - weight) * existing.position.z + weight * newObstacle.position.z;
          
          // Update confidence
          existing.confidence = Math.min(0.95, existing.confidence + 0.05);
          
          // Update timestamp
          existing.timestamp = now;
        } else {
          // Add new obstacle
          this.obstacleMap.staticObstacles.push(newObstacle);
        }
      });
    }
    
    // Remove old obstacles
    const maxAge = 5000; // 5 seconds
    this.obstacleMap.staticObstacles = this.obstacleMap.staticObstacles.filter(
      obstacle => now - obstacle.timestamp < maxAge
    );
    
    // Update timestamp
    this.obstacleMap.lastUpdated = now;
  }
/**
   * Check if two obstacles are the same
   * @private
   */
  _areObstaclesTheSame(obstacle1, obstacle2) {
    // Calculate distance between obstacles
    const dx = obstacle1.position.x - obstacle2.position.x;
    const dy = obstacle1.position.y - obstacle2.position.y;
    const dz = obstacle1.position.z - obstacle2.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // If distance is less than threshold, consider them the same obstacle
    return distance < 1.0; // 1 meter threshold
  }
  
  /**
   * Check if current position is within field boundaries
   * @private
   */
  _checkBoundaries() {
    // Skip if no boundaries defined
    if (this.boundaries.points.length < 3) {
      this.boundaries.isWithinBoundaries = true;
      return;
    }
    
    // Check if current position is within polygon
    const isWithin = this._isPointInPolygon(
      this.state.currentPosition,
      this.boundaries.points
    );
    
    // Update state
    if (this.boundaries.isWithinBoundaries !== isWithin) {
      this.boundaries.isWithinBoundaries = isWithin;
      
      if (!isWithin) {
        this.logger.warn('Tractor has left field boundaries');
        
        // Publish boundary violation event
        eventBus.publish('navigation.boundaryViolation', {
          position: { ...this.state.currentPosition },
          timestamp: Date.now()
        });
      } else {
        this.logger.info('Tractor has returned within field boundaries');
      }
    }
  }
  
  /**
   * Check if a point is inside a polygon
   * @private
   */
  _isPointInPolygon(point, polygon) {
    // Ray casting algorithm
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) {
        inside = !inside;
      }
    }
    
    return inside;
  }
  
  /**
   * Check for obstacles in the path
   * @private
   */
  _checkObstacles() {
    // Skip if not navigating
    if (!this.state.isNavigating || this.path.waypoints.length === 0) {
      return;
    }
    
    // Get current waypoint
    const targetWaypoint = this.path.waypoints[this.path.currentWaypoint];
    
    // Check for obstacles between current position and target waypoint
    const obstaclesInPath = this._findObstaclesInPath(
      this.state.currentPosition,
      targetWaypoint,
      this.params.obstacleAvoidanceMargin
    );
    
    // Update obstacle detection state
    const wasObstacleDetected = this.state.obstacleDetected;
    this.state.obstacleDetected = obstaclesInPath.length > 0;
    
    // Handle obstacle detection change
    if (this.state.obstacleDetected !== wasObstacleDetected) {
      if (this.state.obstacleDetected) {
        this.logger.warn('Obstacle detected in path');
        
        // Start obstacle avoidance
        this._startObstacleAvoidance(obstaclesInPath);
      } else {
        this.logger.info('Path is clear of obstacles');
        
        // Stop obstacle avoidance
        this._stopObstacleAvoidance();
      }
    }
  }
  
  /**
   * Find obstacles in path
   * @private
   */
  _findObstaclesInPath(start, end, margin) {
    const obstaclesInPath = [];
    
    // Check each obstacle
    [...this.obstacleMap.staticObstacles, ...this.obstacleMap.dynamicObstacles].forEach(obstacle => {
      // Check if obstacle is in the corridor between start and end
      if (this._isObstacleInCorridor(obstacle, start, end, margin)) {
        obstaclesInPath.push(obstacle);
      }
    });
    
    return obstaclesInPath;
  }
/**
   * Check if obstacle is in corridor between two points
   * @private
   */
  _isObstacleInCorridor(obstacle, start, end, margin) {
    // Calculate vector from start to end
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize vector
    const nx = dx / length;
    const ny = dy / length;
    
    // Calculate vector from start to obstacle
    const ox = obstacle.position.x - start.x;
    const oy = obstacle.position.y - start.y;
    
    // Calculate projection of obstacle vector onto path vector
    const projection = ox * nx + oy * ny;
    
    // Check if projection is between 0 and length
    if (projection < 0 || projection > length) {
      return false;
    }
    
    // Calculate distance from obstacle to path
    const distance = Math.abs(ox * ny - oy * nx);
    
    // Check if distance is less than margin plus obstacle size
    const obstacleRadius = Math.max(obstacle.size.width, obstacle.size.depth) / 2;
    return distance < margin + obstacleRadius;
  }
  
  /**
   * Start obstacle avoidance
   * @private
   */
  _startObstacleAvoidance(obstacles) {
    this.logger.info('Starting obstacle avoidance');
    
    // Set obstacle avoidance flag
    this.state.obstacleAvoidanceActive = true;
    
    // In a real implementation, this would replan the path to avoid obstacles
    // For this prototype, we'll simulate path replanning
    
    // Publish obstacle avoidance event
    eventBus.publish('navigation.obstacleAvoidance.started', {
      obstacles: obstacles,
      position: { ...this.state.currentPosition },
      timestamp: Date.now()
    });
    
    // Replan path
    this._replanPath();
  }
  
  /**
   * Stop obstacle avoidance
   * @private
   */
  _stopObstacleAvoidance() {
    if (!this.state.obstacleAvoidanceActive) {
      return;
    }
    
    this.logger.info('Stopping obstacle avoidance');
    
    // Clear obstacle avoidance flag
    this.state.obstacleAvoidanceActive = false;
    
    // Publish obstacle avoidance event
    eventBus.publish('navigation.obstacleAvoidance.stopped', {
      position: { ...this.state.currentPosition },
      timestamp: Date.now()
    });
    
    // Replan path to original waypoints
    this._replanPath();
  }
  
  /**
   * Replan path
   * @private
   */
  _replanPath() {
    // In a real implementation, this would use a path planning algorithm
    // For this prototype, we'll simulate path replanning
    
    this.logger.info('Replanning path');
    
    // If we have waypoints, replan from current position to current waypoint
    if (this.path.waypoints.length > 0 && this.path.currentWaypoint < this.path.waypoints.length) {
      const targetWaypoint = this.path.waypoints[this.path.currentWaypoint];
      
      // Plan new path
      const newPath = this._planPath(
        this.state.currentPosition,
        targetWaypoint
      );
      
      // Update path
      if (newPath && newPath.length > 0) {
        // Replace current segment with new path
        const updatedWaypoints = [
          ...this.path.waypoints.slice(0, this.path.currentWaypoint),
          ...newPath,
          ...this.path.waypoints.slice(this.path.currentWaypoint + 1)
        ];
        
        // Update path
        this.path.waypoints = updatedWaypoints;
        
        // Reset current waypoint to start of new segment
        this.path.currentWaypoint = this.path.currentWaypoint;
        
        // Update path metrics
        this._updatePathMetrics();
        
        this.logger.info('Path replanned successfully');
        this.state.isPathValid = true;
      } else {
        this.logger.error('Failed to replan path');
        this.state.isPathValid = false;
      }
    }
  }
  
  /**
   * Plan path between two points
   * @private
   */
  _planPath(start, goal) {
    // In a real implementation, this would use A* or RRT
    // For this prototype, we'll use a simplified approach
    
    // If no obstacles, return direct path
    if (!this.state.obstacleDetected) {
      return [start, goal];
    }
    
    // Simplified obstacle avoidance - find midpoint between obstacles
    const obstaclesInPath = this._findObstaclesInPath(
      start,
      goal,
      this.params.obstacleAvoidanceMargin
    );
    
    if (obstaclesInPath.length === 0) {
      return [start, goal];
    }
    
    // Calculate average obstacle position
    let avgX = 0;
    let avgY = 0;
    
    obstaclesInPath.forEach(obstacle => {
      avgX += obstacle.position.x;
      avgY += obstacle.position.y;
    });
    
    avgX /= obstaclesInPath.length;
    avgY /= obstaclesInPath.length;
    
    // Calculate vector from start to goal
    const dx = goal.x - start.x;
    const dy = goal.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize vector
    const nx = dx / length;
    const ny = dy / length;
    
    // Calculate perpendicular vector
    const px = -ny;
    const py = nx;
    
    // Calculate vector from start to average obstacle
    const ox = avgX - start.x;
    const oy = avgY - start.y;
    
    // Calculate projection of obstacle vector onto path vector
    const projection = ox * nx + oy * ny;
    
    // Calculate distance from obstacle to path
    const distance = Math.abs(ox * ny - oy * nx);
    
    // Determine which side to go around
    const side = (ox * px + oy * py) > 0 ? 1 : -1;
    
    // Calculate waypoint to go around obstacle
    const waypointX = start.x + projection * nx + (distance + this.params.obstacleAvoidanceMargin * 2) * px * side;
    const waypointY = start.y + projection * ny + (distance + this.params.obstacleAvoidanceMargin * 2) * py * side;
    
    // Create waypoint
    const waypoint = {
      x: waypointX,
      y: waypointY,
      z: start.z
    };
    
    // Return path with intermediate waypoint
    return [start, waypoint, goal];
  }
/**
   * Update path progress
   * @private
   */
  _updatePathProgress() {
    // Skip if not navigating
    if (!this.state.isNavigating || this.path.waypoints.length === 0) {
      return;
    }
    
    // Calculate distance to current waypoint
    const currentWaypoint = this.path.waypoints[this.path.currentWaypoint];
    const distanceToWaypoint = this._calculateDistance(
      this.state.currentPosition,
      currentWaypoint
    );
    
    // Calculate remaining distance
    let remainingDistance = distanceToWaypoint;
    
    // Add distances for remaining waypoints
    for (let i = this.path.currentWaypoint; i < this.path.waypoints.length - 1; i++) {
      remainingDistance += this._calculateDistance(
        this.path.waypoints[i],
        this.path.waypoints[i + 1]
      );
    }
    
    // Update path metrics
    this.path.remainingDistance = remainingDistance;
    
    // Calculate progress
    if (this.path.totalDistance > 0) {
      this.path.progress = 1 - (remainingDistance / this.path.totalDistance);
    } else {
      this.path.progress = 0;
    }
  }
  
  /**
   * Check if current waypoint has been reached
   * @private
   */
  _checkWaypointReached() {
    // Get current waypoint
    const currentWaypoint = this.path.waypoints[this.path.currentWaypoint];
    
    // Calculate distance to waypoint
    const distance = this._calculateDistance(
      this.state.currentPosition,
      currentWaypoint
    );
    
    // Check if waypoint reached
    if (distance < this.params.waypointReachedThreshold) {
      this.logger.info(`Waypoint ${this.path.currentWaypoint + 1}/${this.path.waypoints.length} reached`);
      
      // Increment waypoint counters
      this.path.currentWaypoint++;
      this.path.completedWaypoints++;
      
      // Publish waypoint reached event
      eventBus.publish('navigation.waypoint.reached', {
        waypointIndex: this.path.currentWaypoint - 1,
        position: { ...currentWaypoint },
        timestamp: Date.now()
      });
      
      // Check if path complete
      if (this.path.currentWaypoint >= this.path.waypoints.length) {
        this._handlePathComplete();
      }
    }
  }
  
  /**
   * Handle path completion
   * @private
   */
  _handlePathComplete() {
    this.logger.info('Path complete');
    
    // Update state
    this.state.isNavigating = false;
    
    // Publish path complete event
    eventBus.publish('navigation.path.complete', {
      position: { ...this.state.currentPosition },
      timestamp: Date.now()
    });
  }
  
  /**
   * Calculate distance between two points
   * @private
   */
  _calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Update path metrics
   * @private
   */
  _updatePathMetrics() {
    // Calculate total distance
    let totalDistance = 0;
    
    for (let i = 0; i < this.path.waypoints.length - 1; i++) {
      totalDistance += this._calculateDistance(
        this.path.waypoints[i],
        this.path.waypoints[i + 1]
      );
    }
    
    this.path.totalDistance = totalDistance;
    
    // Calculate remaining distance
    this._updatePathProgress();
  }
  
  /**
   * Publish navigation status
   * @private
   */
  _publishNavigationStatus() {
    const status = {
      position: { ...this.state.currentPosition },
      orientation: { ...this.state.currentOrientation },
      positionUncertainty: this.state.positionUncertainty,
      isNavigating: this.state.isNavigating,
      isPathValid: this.state.isPathValid,
      navigationMode: this.state.navigationMode,
      obstacleDetected: this.state.obstacleDetected,
      obstacleAvoidanceActive: this.state.obstacleAvoidanceActive,
      isWithinBoundaries: this.boundaries.isWithinBoundaries,
      path: {
        currentWaypoint: this.path.currentWaypoint,
        totalWaypoints: this.path.waypoints.length,
        completedWaypoints: this.path.completedWaypoints,
        progress: this.path.progress,
        remainingDistance: this.path.remainingDistance
      },
      timestamp: Date.now()
    };
    
    eventBus.publish('navigation.status.updated', status);
  }
  
  /**
   * Set navigation waypoints
   * @param {Array} waypoints - Array of waypoints to navigate through
   * @returns {boolean} Success
   */
  setWaypoints(waypoints) {
    if (!Array.isArray(waypoints) || waypoints.length === 0) {
      this.logger.error('Invalid waypoints: must be a non-empty array');
      return false;
    }
    
    this.logger.info(`Setting ${waypoints.length} waypoints`);
    
    // Store waypoints
    this.path.waypoints = waypoints;
    this.path.currentWaypoint = 0;
    this.path.completedWaypoints = 0;
    
    // Update path metrics
    this._updatePathMetrics();
    
    // Mark path as valid
    this.state.isPathValid = true;
    
    return true;
  }
  
  /**
   * Start navigation along the set waypoints
   * @returns {boolean} Success
   */
  startNavigation() {
    if (this.path.waypoints.length === 0) {
      this.logger.error('Cannot start navigation: no waypoints set');
      return false;
    }
    
    if (!this.state.isPathValid) {
      this.logger.error('Cannot start navigation: path is not valid');
      return false;
    }
    
    this.logger.info('Starting navigation');
    
    // Set navigation state
    this.state.isNavigating = true;
    this.state.navigationMode = 'autonomous';
    
    // Publish navigation started event
    eventBus.publish('navigation.started', {
      waypoints: this.path.waypoints.length,
      position: { ...this.state.currentPosition },
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * Stop navigation
   * @returns {boolean} Success
   */
  stopNavigation() {
    if (!this.state.isNavigating) {
      return true; // Already stopped
    }
    
    this.logger.info('Stopping navigation');
    
    // Set navigation state
    this.state.isNavigating = false;
    this.state.navigationMode = 'idle';
    
    // Publish navigation stopped event
    eventBus.publish('navigation.stopped', {
      position: { ...this.state.currentPosition },
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * Set field boundaries
   * @param {Array} points - Array of points defining the field boundary polygon
   * @returns {boolean} Success
   */
  setFieldBoundaries(points) {
    if (!Array.isArray(points) || points.length < 3) {
      this.logger.error('Invalid field boundaries: must be an array with at least 3 points');
      return false;
    }
    
    this.logger.info(`Setting field boundaries with ${points.length} points`);
    
    // Store boundaries
    this.boundaries.points = points;
    
    // Check if current position is within boundaries
    this._checkBoundaries();
    
    return true;
  }
  
  /**
   * Get current navigation status
   * @returns {object} Navigation status
   */
  getStatus() {
    return {
      position: { ...this.state.currentPosition },
      orientation: { ...this.state.currentOrientation },
      positionUncertainty: this.state.positionUncertainty,
      isNavigating: this.state.isNavigating,
      navigationMode: this.state.navigationMode,
      obstacleDetected: this.state.obstacleDetected,
      isWithinBoundaries: this.boundaries.isWithinBoundaries,
      path: {
        currentWaypoint: this.path.currentWaypoint,
        totalWaypoints: this.path.waypoints.length,
        completedWaypoints: this.path.completedWaypoints,
        progress: this.path.progress,
        remainingDistance: this.path.remainingDistance
      }
    };
  }
  
  /**
   * Shutdown the navigation system
   */
  async shutdown() {
    this.logger.info('Shutting down navigation system...');
    
    // Stop navigation
    this.stopNavigation();
    
    // Stop update loop
    this._stopUpdateLoop();
    
    // Unsubscribe from events
    // In a real implementation, we would unsubscribe from all events
    
    this.logger.info('Navigation system shut down');
    return true;
  }
}

module.exports = NavigationSystem;