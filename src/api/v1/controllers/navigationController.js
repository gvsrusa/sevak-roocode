/**
 * Sevak Mini Tractor - Navigation Controller
 * 
 * Handles API endpoints related to navigation.
 */

const eventBus = require('../../../utils/eventBus');
const Logger = require('../../../utils/logger');
const config = require('../../../config');

const logger = new Logger('NavigationController');

/**
 * Get navigation status
 */
const getStatus = async (req, res) => {
  try {
    const navigationStatus = await eventBus.request('navigation.getStatus', {}, 1000);
    res.json(navigationStatus);
  } catch (error) {
    logger.error(`Failed to get navigation status: ${error.message}`);
    res.status(500).json({ error: 'Failed to get navigation status', message: error.message });
  }
};

/**
 * Set waypoints for navigation
 */
const setWaypoints = async (req, res) => {
  try {
    // Validate request body
    const { waypoints } = req.body;
    
    if (!Array.isArray(waypoints) || waypoints.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid parameters', 
        message: 'Waypoints must be a non-empty array' 
      });
    }
    
    // Validate each waypoint
    for (const waypoint of waypoints) {
      if (typeof waypoint.x !== 'number' || typeof waypoint.y !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          message: 'Each waypoint must have numeric x and y coordinates' 
        });
      }
    }
    
    // Create command data
    const commandData = {
      waypoints: waypoints,
      timestamp: Date.now(),
      source: 'api',
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish navigate command event with redundancy
    eventBus.publish('command.navigate', commandData);
    eventBus.publish('command.navigate.redundant', commandData);
    
    logger.info(`API SET_WAYPOINTS command: ${waypoints.length} waypoints from ${req.ip}`);
    
    res.json({
      success: true,
      command: 'setWaypoints',
      waypointCount: waypoints.length,
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to set waypoints: ${error.message}`);
    res.status(500).json({ error: 'Failed to set waypoints', message: error.message });
  }
};

/**
 * Start navigation
 */
const startNavigation = async (req, res) => {
  try {
    // Create command data
    const commandData = {
      timestamp: Date.now(),
      source: 'api',
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish start navigation command event
    eventBus.publish('command.startNavigation', commandData);
    
    logger.info(`API START_NAVIGATION command from ${req.ip}`);
    
    res.json({
      success: true,
      command: 'startNavigation',
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to start navigation: ${error.message}`);
    res.status(500).json({ error: 'Failed to start navigation', message: error.message });
  }
};

/**
 * Stop navigation
 */
const stopNavigation = async (req, res) => {
  try {
    // Create command data
    const commandData = {
      timestamp: Date.now(),
      source: 'api',
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish stop navigation command event
    eventBus.publish('command.stopNavigation', commandData);
    
    logger.info(`API STOP_NAVIGATION command from ${req.ip}`);
    
    res.json({
      success: true,
      command: 'stopNavigation',
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to stop navigation: ${error.message}`);
    res.status(500).json({ error: 'Failed to stop navigation', message: error.message });
  }
};

/**
 * Set field boundaries
 */
const setBoundaries = async (req, res) => {
  try {
    // Validate request body
    const { points } = req.body;
    
    if (!Array.isArray(points) || points.length < 3) {
      return res.status(400).json({ 
        error: 'Invalid parameters', 
        message: 'Boundary points must be an array with at least 3 points' 
      });
    }
    
    // Validate each point
    for (const point of points) {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          message: 'Each boundary point must have numeric x and y coordinates' 
        });
      }
    }
    
    // Create command data
    const commandData = {
      points: points,
      timestamp: Date.now(),
      source: 'api',
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish set boundaries command event with redundancy
    eventBus.publish('command.setBoundaries', commandData);
    eventBus.publish('command.setBoundaries.redundant', commandData);
    
    logger.info(`API SET_BOUNDARIES command: ${points.length} points from ${req.ip}`);
    
    res.json({
      success: true,
      command: 'setBoundaries',
      pointCount: points.length,
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to set boundaries: ${error.message}`);
    res.status(500).json({ error: 'Failed to set boundaries', message: error.message });
  }
};

/**
 * Get field boundaries
 */
const getBoundaries = async (req, res) => {
  try {
    const boundaries = await eventBus.request('navigation.getBoundaries', {}, 1000);
    res.json(boundaries);
  } catch (error) {
    logger.error(`Failed to get boundaries: ${error.message}`);
    res.status(500).json({ error: 'Failed to get boundaries', message: error.message });
  }
};

/**
 * Generate a unique command ID
 */
function generateCommandId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = {
  getStatus,
  setWaypoints,
  startNavigation,
  stopNavigation,
  setBoundaries,
  getBoundaries
};