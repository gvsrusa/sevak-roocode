/**
 * Sevak Mini Tractor - Control Controller
 * 
 * Handles API endpoints related to tractor movement control.
 */

const eventBus = require('../../../utils/eventBus');
const Logger = require('../../../utils/logger');
const config = require('../../../config');

const logger = new Logger('ControlController');

/**
 * Move the tractor with specified speed and direction
 */
const move = async (req, res) => {
  try {
    // Validate request body
    const { speed, direction } = req.body;
    
    if (typeof speed !== 'number' || typeof direction !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid parameters', 
        message: 'Speed and direction must be numbers' 
      });
    }
    
    // Apply safety limits
    const safeSpeed = Math.min(Math.max(speed, 0), config.motors.maxSpeed);
    
    // Create command data
    const commandData = {
      speed: safeSpeed,
      direction: direction,
      timestamp: Date.now(),
      source: 'api',
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish move command event with redundancy
    eventBus.publish('command.move', commandData);
    eventBus.publish('command.move.redundant', commandData);
    
    logger.info(`API MOVE command: speed=${safeSpeed}, direction=${direction} from ${req.ip}`);
    
    res.json({
      success: true,
      command: 'move',
      params: {
        speed: safeSpeed,
        direction: direction
      },
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to execute move command: ${error.message}`);
    res.status(500).json({ error: 'Failed to execute move command', message: error.message });
  }
};

/**
 * Stop the tractor
 */
const stop = async (req, res) => {
  try {
    // Create command data
    const commandData = {
      timestamp: Date.now(),
      source: 'api',
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish stop command event with redundancy
    eventBus.publish('command.stop', commandData);
    eventBus.publish('command.stop.redundant', commandData);
    
    logger.info(`API STOP command from ${req.ip}`);
    
    res.json({
      success: true,
      command: 'stop',
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to execute stop command: ${error.message}`);
    res.status(500).json({ error: 'Failed to execute stop command', message: error.message });
  }
};

/**
 * Emergency stop the tractor
 */
const emergencyStop = async (req, res) => {
  try {
    // Get reason from request body
    const reason = req.body.reason || 'API initiated emergency stop';
    
    // Create command data
    const commandData = {
      reason: reason,
      source: 'api',
      timestamp: Date.now(),
      clientId: req.ip,
      commandId: generateCommandId()
    };
    
    // Publish emergency stop command event with triple redundancy for safety-critical commands
    eventBus.publish('command.emergencyStop', commandData);
    eventBus.publish('command.emergencyStop.redundant', commandData);
    eventBus.publish('command.emergencyStop.critical', commandData);
    
    logger.critical(`API EMERGENCY_STOP command from ${req.ip}: ${reason}`);
    
    res.json({
      success: true,
      command: 'emergencyStop',
      reason: reason,
      timestamp: Date.now(),
      commandId: commandData.commandId
    });
  } catch (error) {
    logger.error(`Failed to execute emergency stop command: ${error.message}`);
    res.status(500).json({ error: 'Failed to execute emergency stop command', message: error.message });
  }
};

/**
 * Generate a unique command ID
 */
function generateCommandId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = {
  move,
  stop,
  emergencyStop
};