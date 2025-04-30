/**
 * Sevak Mini Tractor - Status Controller
 * 
 * Handles API endpoints related to system status.
 */

const eventBus = require('../../../utils/eventBus');
const Logger = require('../../../utils/logger');

const logger = new Logger('StatusController');

/**
 * Get overall system status
 */
const getStatus = async (req, res) => {
  try {
    // Request status from various systems
    const [navigationStatus, motorStatus, sensorStatus, safetyStatus, monitoringStatus] = await Promise.all([
      eventBus.request('navigation.getStatus', {}, 1000),
      eventBus.request('motor.getStatus', {}, 1000),
      eventBus.request('sensor.getStatus', {}, 1000),
      eventBus.request('safety.getStatus', {}, 1000),
      eventBus.request('monitoring.getStatus', {}, 1000)
    ]);
    
    // Prepare status data
    const statusData = {
      navigation: navigationStatus,
      motor: motorStatus,
      sensor: sensorStatus,
      safety: safetyStatus,
      monitoring: monitoringStatus,
      timestamp: Date.now()
    };
    
    res.json(statusData);
  } catch (error) {
    logger.error(`Failed to get status: ${error.message}`);
    res.status(500).json({ error: 'Failed to get status', message: error.message });
  }
};

/**
 * Get system status information
 */
const getSystemStatus = async (req, res) => {
  try {
    // Get system information
    const systemInfo = {
      name: 'Sevak Mini Tractor',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: Date.now()
    };
    
    res.json(systemInfo);
  } catch (error) {
    logger.error(`Failed to get system status: ${error.message}`);
    res.status(500).json({ error: 'Failed to get system status', message: error.message });
  }
};

module.exports = {
  getStatus,
  getSystemStatus
};