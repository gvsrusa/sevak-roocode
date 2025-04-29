/**
 * Monitoring WebSocket
 * 
 * Provides real-time monitoring updates via WebSocket
 */

const WebSocket = require('ws');

class MonitoringWebSocket {
  constructor(monitoringSystem, server) {
    this.monitoringSystem = monitoringSystem;
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.setupWebSocket();
    this.setupEventListeners();
  }
  
  /**
   * Set up WebSocket server
   */
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      // Add client to set
      this.clients.add(ws);
      
      // Send initial status
      this.sendToClient(ws, {
        type: 'status',
        data: this.monitoringSystem.getStatus()
      });
      
      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          this.sendToClient(ws, {
            type: 'error',
            error: 'Invalid message format'
          });
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }
  
  /**
   * Set up event listeners for monitoring system events
   */
  setupEventListeners() {
    // Listen for performance metrics
    this.monitoringSystem.eventEmitter.on('metrics:performance', (metrics) => {
      this.broadcast({
        type: 'metrics',
        metricType: 'performance',
        data: metrics
      });
    });
    
    // Listen for battery metrics
    this.monitoringSystem.eventEmitter.on('metrics:battery', (metrics) => {
      this.broadcast({
        type: 'metrics',
        metricType: 'battery',
        data: metrics
      });
    });
    
    // Listen for usage metrics
    this.monitoringSystem.eventEmitter.on('metrics:usage', (metrics) => {
      this.broadcast({
        type: 'metrics',
        metricType: 'usage',
        data: metrics
      });
    });
    
    // Listen for security metrics
    this.monitoringSystem.eventEmitter.on('metrics:security', (metrics) => {
      this.broadcast({
        type: 'metrics',
        metricType: 'security',
        data: metrics
      });
    });
    
    // Listen for error metrics
    this.monitoringSystem.eventEmitter.on('metrics:errors', (metrics) => {
      this.broadcast({
        type: 'metrics',
        metricType: 'errors',
        data: metrics
      });
    });
    
    // Listen for new alerts
    this.monitoringSystem.eventEmitter.on('alert:new', (alert) => {
      this.broadcast({
        type: 'alert',
        action: 'new',
        data: alert
      });
    });
    
    // Listen for resolved alerts
    this.monitoringSystem.eventEmitter.on('alert:resolved', (alert) => {
      this.broadcast({
        type: 'alert',
        action: 'resolved',
        data: alert
      });
    });
  }
  
  /**
   * Handle client message
   */
  handleClientMessage(ws, message) {
    switch (message.type) {
      case 'subscribe':
        // Handle subscription requests
        this.handleSubscription(ws, message);
        break;
        
      case 'request':
        // Handle data requests
        this.handleDataRequest(ws, message);
        break;
        
      default:
        this.sendToClient(ws, {
          type: 'error',
          error: 'Unknown message type'
        });
    }
  }
  
  /**
   * Handle subscription request
   */
  handleSubscription(ws, message) {
    // Store subscription preferences on the client object
    ws.subscriptions = ws.subscriptions || {};
    ws.subscriptions[message.dataType] = message.enabled;
    
    this.sendToClient(ws, {
      type: 'subscription',
      dataType: message.dataType,
      status: message.enabled ? 'subscribed' : 'unsubscribed'
    });
  }
  
  /**
   * Handle data request
   */
  handleDataRequest(ws, message) {
    switch (message.dataType) {
      case 'status':
        this.sendToClient(ws, {
          type: 'status',
          data: this.monitoringSystem.getStatus()
        });
        break;
        
      case 'metrics':
        const metrics = this.monitoringSystem.getMetrics(
          message.metricType,
          message.timeRange
        );
        this.sendToClient(ws, {
          type: 'metrics',
          metricType: message.metricType || 'all',
          data: metrics
        });
        break;
        
      case 'alerts':
        const alerts = message.includeResolved
          ? this.monitoringSystem.alerts
          : this.monitoringSystem.getAlerts();
        this.sendToClient(ws, {
          type: 'alerts',
          data: alerts
        });
        break;
        
      case 'maintenance':
        this.sendToClient(ws, {
          type: 'maintenance',
          data: this.monitoringSystem.getMaintenanceSchedule()
        });
        break;
        
      default:
        this.sendToClient(ws, {
          type: 'error',
          error: 'Unknown data type'
        });
    }
  }
  
  /**
   * Send message to a specific client
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
  
  /**
   * Broadcast message to all connected clients
   */
  broadcast(data) {
    this.clients.forEach(client => {
      // Check if client has subscriptions and if they're subscribed to this data type
      if (client.subscriptions) {
        const dataType = data.type === 'metrics' ? `metrics:${data.metricType}` : data.type;
        
        // Skip if client has explicitly unsubscribed from this data type
        if (client.subscriptions[dataType] === false) {
          return;
        }
      }
      
      this.sendToClient(client, data);
    });
  }
  
  /**
   * Close all connections
   */
  close() {
    this.wss.close();
  }
}

module.exports = MonitoringWebSocket;