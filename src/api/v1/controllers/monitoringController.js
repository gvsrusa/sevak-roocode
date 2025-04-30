/**
 * Sevak Mini Tractor - Monitoring Controller
 * 
 * Handles API endpoints related to monitoring.
 */

const eventBus = require('../../../utils/eventBus');
const Logger = require('../../../utils/logger');

const logger = new Logger('MonitoringController');

/**
 * Get monitoring system status
 */
const getStatus = async (req, res) => {
  try {
    const monitoringStatus = await eventBus.request('monitoring.getStatus', {}, 1000);
    res.json(monitoringStatus);
  } catch (error) {
    logger.error(`Failed to get monitoring status: ${error.message}`);
    res.status(500).json({ error: 'Failed to get monitoring status', message: error.message });
  }
};

/**
 * Get metrics data
 */
const getMetrics = async (req, res) => {
  try {
    const type = req.params.type;
    const timeRange = req.query.timeRange ? parseInt(req.query.timeRange) : undefined;
    
    const metrics = await eventBus.request('monitoring.getMetrics', { type, timeRange }, 1000);
    res.json(metrics);
  } catch (error) {
    logger.error(`Failed to get metrics: ${error.message}`);
    res.status(500).json({ error: 'Failed to get metrics', message: error.message });
  }
};

/**
 * Get alerts
 */
const getAlerts = async (req, res) => {
  try {
    const includeResolved = req.query.includeResolved === 'true';
    
    const alerts = await eventBus.request('monitoring.getAlerts', { includeResolved }, 1000);
    res.json(alerts);
  } catch (error) {
    logger.error(`Failed to get alerts: ${error.message}`);
    res.status(500).json({ error: 'Failed to get alerts', message: error.message });
  }
};

/**
 * Get maintenance schedule
 */
const getMaintenanceSchedule = async (req, res) => {
  try {
    const maintenanceSchedule = await eventBus.request('monitoring.getMaintenanceSchedule', {}, 1000);
    res.json(maintenanceSchedule);
  } catch (error) {
    logger.error(`Failed to get maintenance schedule: ${error.message}`);
    res.status(500).json({ error: 'Failed to get maintenance schedule', message: error.message });
  }
};

/**
 * Run diagnostics
 */
const runDiagnostics = async (req, res) => {
  try {
    const components = req.body.components || [];
    
    const diagnosticsResults = await eventBus.request('monitoring.runDiagnostics', { components }, 10000);
    res.json(diagnosticsResults);
  } catch (error) {
    logger.error(`Failed to run diagnostics: ${error.message}`);
    res.status(500).json({ error: 'Failed to run diagnostics', message: error.message });
  }
};

/**
 * Resolve an alert
 */
const resolveAlert = async (req, res) => {
  try {
    const alertId = req.params.id;
    const resolution = req.body.resolution || {};
    
    if (!alertId) {
      return res.status(400).json({ 
        error: 'Invalid parameters', 
        message: 'Alert ID is required' 
      });
    }
    
    const result = await eventBus.request('monitoring.resolveAlert', { alertId, resolution }, 1000);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Alert resolved successfully',
        alertId: alertId
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Alert not found or could not be resolved',
        alertId: alertId
      });
    }
  } catch (error) {
    logger.error(`Failed to resolve alert: ${error.message}`);
    res.status(500).json({ error: 'Failed to resolve alert', message: error.message });
  }
};

/**
 * Complete a maintenance task
 */
const completeMaintenanceTask = async (req, res) => {
  try {
    const maintenanceId = req.params.id;
    const notes = req.body.notes || '';
    
    if (!maintenanceId) {
      return res.status(400).json({ 
        error: 'Invalid parameters', 
        message: 'Maintenance ID is required' 
      });
    }
    
    const result = await eventBus.request('monitoring.completeMaintenanceTask', { 
      maintenanceId, 
      notes,
      completedAt: Date.now(),
      completedBy: req.body.completedBy || 'API User'
    }, 1000);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Maintenance task completed successfully',
        maintenanceId: maintenanceId
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Maintenance task not found or could not be completed',
        maintenanceId: maintenanceId
      });
    }
  } catch (error) {
    logger.error(`Failed to complete maintenance task: ${error.message}`);
    res.status(500).json({ error: 'Failed to complete maintenance task', message: error.message });
  }
};

module.exports = {
  getStatus,
  getMetrics,
  getAlerts,
  getMaintenanceSchedule,
  runDiagnostics,
  resolveAlert,
  completeMaintenanceTask
};