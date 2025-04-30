/**
 * Sevak Mini Tractor - Sensors Controller
 * 
 * Handles API endpoints related to sensors.
 */

const eventBus = require('../../../utils/eventBus');
const Logger = require('../../../utils/logger');

const logger = new Logger('SensorsController');

/**
 * Get status of all sensors
 */
const getAllSensors = async (req, res) => {
  try {
    const sensorStatus = await eventBus.request('sensor.getStatus', {}, 1000);
    res.json(sensorStatus);
  } catch (error) {
    logger.error(`Failed to get sensor status: ${error.message}`);
    res.status(500).json({ error: 'Failed to get sensor status', message: error.message });
  }
};

/**
 * Get status of a specific sensor by ID
 */
const getSensor = async (req, res) => {
  try {
    const sensorId = req.params.id;
    
    if (!sensorId) {
      return res.status(400).json({ 
        error: 'Invalid parameters', 
        message: 'Sensor ID is required' 
      });
    }
    
    const sensorData = await eventBus.request('sensor.getSensorById', { id: sensorId }, 1000);
    
    if (!sensorData) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: `Sensor with ID ${sensorId} not found` 
      });
    }
    
    res.json(sensorData);
  } catch (error) {
    logger.error(`Failed to get sensor data: ${error.message}`);
    res.status(500).json({ error: 'Failed to get sensor data', message: error.message });
  }
};

/**
 * Get GPS sensor data
 */
const getGpsData = async (req, res) => {
  try {
    const gpsData = await eventBus.request('sensor.getGpsData', {}, 1000);
    res.json(gpsData);
  } catch (error) {
    logger.error(`Failed to get GPS data: ${error.message}`);
    res.status(500).json({ error: 'Failed to get GPS data', message: error.message });
  }
};

/**
 * Get IMU sensor data
 */
const getImuData = async (req, res) => {
  try {
    const imuData = await eventBus.request('sensor.getImuData', {}, 1000);
    res.json(imuData);
  } catch (error) {
    logger.error(`Failed to get IMU data: ${error.message}`);
    res.status(500).json({ error: 'Failed to get IMU data', message: error.message });
  }
};

/**
 * Get proximity sensor data
 */
const getProximityData = async (req, res) => {
  try {
    const proximityData = await eventBus.request('sensor.getProximityData', {}, 1000);
    res.json(proximityData);
  } catch (error) {
    logger.error(`Failed to get proximity data: ${error.message}`);
    res.status(500).json({ error: 'Failed to get proximity data', message: error.message });
  }
};

/**
 * Get camera data
 */
const getCameraData = async (req, res) => {
  try {
    // Get optional parameters
    const quality = req.query.quality ? parseInt(req.query.quality) : 100;
    const format = req.query.format || 'jpeg';
    
    const cameraData = await eventBus.request('sensor.getCameraData', { quality, format }, 1000);
    
    // If format is 'raw', send the image data
    if (format === 'raw' && cameraData.data) {
      res.set('Content-Type', 'image/jpeg');
      return res.send(Buffer.from(cameraData.data, 'base64'));
    }
    
    res.json(cameraData);
  } catch (error) {
    logger.error(`Failed to get camera data: ${error.message}`);
    res.status(500).json({ error: 'Failed to get camera data', message: error.message });
  }
};

module.exports = {
  getAllSensors,
  getSensor,
  getGpsData,
  getImuData,
  getProximityData,
  getCameraData
};