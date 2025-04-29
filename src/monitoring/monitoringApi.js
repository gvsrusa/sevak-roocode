/**
 * Monitoring API
 * 
 * Provides API endpoints for accessing monitoring data
 */

const express = require('express');

class MonitoringApi {
  constructor(monitoringSystem) {
    this.monitoringSystem = monitoringSystem;
    this.router = express.Router();
    this.setupRoutes();
  }
  
  /**
   * Set up API routes
   */
  setupRoutes() {
    // Get monitoring status
    this.router.get('/status', (req, res) => {
      try {
        const status = this.monitoringSystem.getStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get metrics
    this.router.get('/metrics/:type?', (req, res) => {
      try {
        const type = req.params.type;
        const timeRange = req.query.timeRange ? parseInt(req.query.timeRange) : undefined;
        const metrics = this.monitoringSystem.getMetrics(type, timeRange);
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get alerts
    this.router.get('/alerts', (req, res) => {
      try {
        const includeResolved = req.query.includeResolved === 'true';
        let alerts;
        
        if (includeResolved) {
          alerts = this.monitoringSystem.alerts;
        } else {
          alerts = this.monitoringSystem.getAlerts();
        }
        
        res.json(alerts);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get maintenance schedule
    this.router.get('/maintenance', (req, res) => {
      try {
        const maintenanceSchedule = this.monitoringSystem.getMaintenanceSchedule();
        res.json(maintenanceSchedule);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Run diagnostics
    this.router.post('/diagnostics', async (req, res) => {
      try {
        const components = req.body.components || [];
        const results = await this.monitoringSystem.runDiagnostics(components);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Resolve alert
    this.router.post('/alerts/:id/resolve', (req, res) => {
      try {
        const alertId = req.params.id;
        const resolution = req.body.resolution || {};
        
        const resolved = this.monitoringSystem.alertManager.resolveAlert(
          this.monitoringSystem.alerts,
          alertId,
          resolution
        );
        
        if (resolved) {
          res.json({ success: true, message: 'Alert resolved successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Alert not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Mark maintenance as completed
    this.router.post('/maintenance/:id/complete', (req, res) => {
      try {
        const maintenanceId = req.params.id;
        const item = this.monitoringSystem.maintenanceSchedule.find(item => item.id === maintenanceId);
        
        if (item) {
          item.lastPerformed = Date.now();
          item.currentUsage = 0;
          item.status = 'scheduled';
          
          // Save updated schedule
          this.monitoringSystem.saveData();
          
          res.json({ success: true, message: 'Maintenance marked as completed' });
        } else {
          res.status(404).json({ success: false, message: 'Maintenance item not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
  
  /**
   * Get the router
   */
  getRouter() {
    return this.router;
  }
}

module.exports = MonitoringApi;