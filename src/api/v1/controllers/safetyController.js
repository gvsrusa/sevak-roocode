/**
 * Sevak Mini Tractor - Safety Controller
 * 
 * Handles API endpoints related to safety features.
 */

const eventBus = require('../../../utils/eventBus');
const Logger = require('../../../utils/logger');
const config = require('../../../config');

const logger = new Logger('SafetyController');

/**
 * Get safety status
 */
const getStatus = async (req, res) => {
  try {
    const safetyStatus = await eventBus.request('safety.getStatus', {}, 1000);
    res.json(safetyStatus);
  } catch (error) {
    logger.error(`Failed to get safety status: ${error.message}`);
    res.status(500).json({ error: 'Failed to get safety status', message: error.message });
  }
};

/**
 * Get safety limits
 */
const getLimits = async (req, res) => {
  try {
    // Return the safety configuration
    const safetyLimits = {
      watchdogTimeout: config.safety.watchdogTimeout,
      maxIncline: config.safety.maxIncline,
      maxSpeed: config.safety.maxSpeed,
      emergencyStopEnabled: config.safety.emergencyStopEnabled,
      obstacleSafeDistance: config.safety.obstacleSafeDistance,
      boundaryEnforcementEnabled: config.safety.boundaryEnforcementEnabled
    };
    
    res.json(safetyLimits);
  } catch (error) {
    logger.error(`Failed to get safety limits: ${error.message}`);
    res.status(500).json({ error: 'Failed to get safety limits', message: error.message });
  }
};

/**
 * Update safety limits
 * Note: This would typically require authentication and authorization
 */
const updateLimits = async (req, res) => {
  try {
    // In a real implementation, this would update the configuration
    // and possibly require a system restart or reconfiguration
    
    // For now, we'll just validate the input and return success
    const {
      maxIncline,
      maxSpeed,
      emergencyStopEnabled,
      obstacleSafeDistance,
      boundaryEnforcementEnabled
    } = req.body;
    
    // Validate inputs
    if (maxIncline !== undefined && (typeof maxIncline !== 'number' || maxIncline < 0 || maxIncline > 45)) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'maxIncline must be a number between 0 and 45'
      });
    }
    
    if (maxSpeed !== undefined && (typeof maxSpeed !== 'number' || maxSpeed < 0 || maxSpeed > 10)) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'maxSpeed must be a number between 0 and 10'
      });
    }
    
    if (obstacleSafeDistance !== undefined && (typeof obstacleSafeDistance !== 'number' || obstacleSafeDistance < 0.1 || obstacleSafeDistance > 5)) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'obstacleSafeDistance must be a number between 0.1 and 5'
      });
    }
    
    if (emergencyStopEnabled !== undefined && typeof emergencyStopEnabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'emergencyStopEnabled must be a boolean'
      });
    }
    
    if (boundaryEnforcementEnabled !== undefined && typeof boundaryEnforcementEnabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'boundaryEnforcementEnabled must be a boolean'
      });
    }
    
    // Create command data
    const commandData = {
      limits: {
        maxIncline: maxIncline !== undefined ? maxIncline : config.safety.maxIncline,
        maxSpeed: maxSpeed !== undefined ? maxSpeed : config.safety.maxSpeed,
        emergencyStopEnabled: emergencyStopEnabled !== undefined ? emergencyStopEnabled : config.safety.emergencyStopEnabled,
        obstacleSafeDistance: obstacleSafeDistance !== undefined ? obstacleSafeDistance : config.safety.obstacleSafeDistance,
        boundaryEnforcementEnabled: boundaryEnforcementEnabled !== undefined ? boundaryEnforcementEnabled : config.safety.boundaryEnforcementEnabled
      },
      timestamp: Date.now(),
      source: 'api',
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish update safety limits command event
    eventBus.publish('command.updateSafetyLimits', commandData);
    
    logger.info(`API UPDATE_SAFETY_LIMITS command from ${req.ip}`);
    
    res.json({
      success: true,
      command: 'updateSafetyLimits',
      limits: commandData.limits,
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to update safety limits: ${error.message}`);
    res.status(500).json({ error: 'Failed to update safety limits', message: error.message });
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
  getLimits,
  updateLimits
};