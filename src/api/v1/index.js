/**
 * Sevak Mini Tractor - API v1 Router
 * 
 * Handles all v1 API endpoints.
 */

const express = require('express');
const router = express.Router();

// Import controllers
const statusController = require('./controllers/statusController');
const controlController = require('./controllers/controlController');
const navigationController = require('./controllers/navigationController');
const sensorsController = require('./controllers/sensorsController');
const safetyController = require('./controllers/safetyController');
const monitoringController = require('./controllers/monitoringController');

// Status endpoints
router.get('/status', statusController.getStatus);
router.get('/status/system', statusController.getSystemStatus);

// Control endpoints
router.post('/control/move', controlController.move);
router.post('/control/stop', controlController.stop);
router.post('/control/emergency-stop', controlController.emergencyStop);

// Navigation endpoints
router.get('/navigation/status', navigationController.getStatus);
router.post('/navigation/waypoints', navigationController.setWaypoints);
router.post('/navigation/start', navigationController.startNavigation);
router.post('/navigation/stop', navigationController.stopNavigation);
router.post('/navigation/boundaries', navigationController.setBoundaries);
router.get('/navigation/boundaries', navigationController.getBoundaries);

// Sensors endpoints
router.get('/sensors', sensorsController.getAllSensors);
router.get('/sensors/:id', sensorsController.getSensor);
router.get('/sensors/gps', sensorsController.getGpsData);
router.get('/sensors/imu', sensorsController.getImuData);
router.get('/sensors/proximity', sensorsController.getProximityData);
router.get('/sensors/camera', sensorsController.getCameraData);

// Safety endpoints
router.get('/safety/status', safetyController.getStatus);
router.get('/safety/limits', safetyController.getLimits);
router.post('/safety/limits', safetyController.updateLimits);

// Monitoring endpoints
router.get('/monitoring/status', monitoringController.getStatus);
router.get('/monitoring/metrics/:type?', monitoringController.getMetrics);
router.get('/monitoring/alerts', monitoringController.getAlerts);
router.get('/monitoring/maintenance', monitoringController.getMaintenanceSchedule);
router.post('/monitoring/diagnostics', monitoringController.runDiagnostics);
router.post('/monitoring/alerts/:id/resolve', monitoringController.resolveAlert);
router.post('/monitoring/maintenance/:id/complete', monitoringController.completeMaintenanceTask);

module.exports = router;