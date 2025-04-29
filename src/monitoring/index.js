/**
 * Monitoring System Index
 * 
 * Exports all monitoring components and provides initialization functions
 */

const MonitoringSystem = require('./monitoringSystem');
const MetricsCollector = require('./metricsCollector');
const AlertManager = require('./alertManager');
const DiagnosticsManager = require('./diagnosticsManager');
const MonitoringApi = require('./monitoringApi');
const MonitoringWebSocket = require('./monitoringWebSocket');

/**
 * Initialize the monitoring system
 * 
 * @param {Object} config - Configuration object
 * @param {Object} logger - Logger object
 * @returns {MonitoringSystem} - Initialized monitoring system
 */
function initMonitoringSystem(config, logger) {
  // Create monitoring system
  const monitoringSystem = new MonitoringSystem(config, logger);
  
  // Start monitoring system
  monitoringSystem.start().catch(error => {
    logger.error('Failed to start monitoring system:', error);
  });
  
  return monitoringSystem;
}

/**
 * Initialize the monitoring API
 * 
 * @param {MonitoringSystem} monitoringSystem - Monitoring system instance
 * @param {Object} app - Express app instance
 * @param {string} apiPath - API path prefix (default: '/api/monitoring')
 */
function initMonitoringApi(monitoringSystem, app, apiPath = '/api/monitoring') {
  const monitoringApi = new MonitoringApi(monitoringSystem);
  app.use(apiPath, monitoringApi.getRouter());
  return monitoringApi;
}

/**
 * Initialize the monitoring WebSocket
 * 
 * @param {MonitoringSystem} monitoringSystem - Monitoring system instance
 * @param {Object} server - HTTP server instance
 */
function initMonitoringWebSocket(monitoringSystem, server) {
  const monitoringWebSocket = new MonitoringWebSocket(monitoringSystem, server);
  return monitoringWebSocket;
}

/**
 * Initialize the complete monitoring stack
 * 
 * @param {Object} config - Configuration object
 * @param {Object} logger - Logger object
 * @param {Object} app - Express app instance
 * @param {Object} server - HTTP server instance
 * @param {string} apiPath - API path prefix (default: '/api/monitoring')
 * @returns {Object} - Monitoring components
 */
function initMonitoring(config, logger, app, server, apiPath = '/api/monitoring') {
  // Initialize monitoring system
  const monitoringSystem = initMonitoringSystem(config, logger);
  
  // Initialize API if app is provided
  let monitoringApi = null;
  if (app) {
    monitoringApi = initMonitoringApi(monitoringSystem, app, apiPath);
  }
  
  // Initialize WebSocket if server is provided
  let monitoringWebSocket = null;
  if (server) {
    monitoringWebSocket = initMonitoringWebSocket(monitoringSystem, server);
  }
  
  return {
    monitoringSystem,
    monitoringApi,
    monitoringWebSocket
  };
}

module.exports = {
  MonitoringSystem,
  MetricsCollector,
  AlertManager,
  DiagnosticsManager,
  MonitoringApi,
  MonitoringWebSocket,
  initMonitoringSystem,
  initMonitoringApi,
  initMonitoringWebSocket,
  initMonitoring
};