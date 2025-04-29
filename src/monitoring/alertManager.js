/**
 * Alert Manager
 * 
 * Provides methods for managing alerts and running diagnostics
 */

class AlertManager {
  constructor(system) {
    this.system = system;
    this.logger = system.logger;
  }
  
  /**
   * Process and handle alerts
   */
  processAlerts(alerts) {
    try {
      // Process only active alerts
      const activeAlerts = alerts.filter(alert => !alert.resolved);
      
      for (const alert of activeAlerts) {
        // Skip already processed alerts
        if (alert.processed) {
          continue;
        }
        
        // Mark as processed
        alert.processed = true;
        
        // Handle based on alert level
        switch (alert.level) {
          case 'critical':
            this.handleCriticalAlert(alert);
            break;
          case 'warning':
            this.handleWarningAlert(alert);
            break;
          case 'info':
            this.handleInfoAlert(alert);
            break;
        }
      }
      
      return activeAlerts.filter(alert => !alert.processed).length;
    } catch (error) {
      this.logger.error('Failed to process alerts:', error);
      throw error;
    }
  }
  
  /**
   * Handle critical alert
   */
  handleCriticalAlert(alert) {
    // Log critical alert
    this.logger.error(`CRITICAL ALERT: ${alert.message}`, alert.details);
    
    // Send notification (implementation depends on notification system)
    this.sendNotification({
      level: 'critical',
      title: 'Critical Alert',
      message: alert.message,
      details: alert.details
    });
  }
  
  /**
   * Handle warning alert
   */
  handleWarningAlert(alert) {
    // Log warning alert
    this.logger.warn(`WARNING ALERT: ${alert.message}`, alert.details);
    
    // Send notification (implementation depends on notification system)
    this.sendNotification({
      level: 'warning',
      title: 'Warning Alert',
      message: alert.message,
      details: alert.details
    });
  }
  
  /**
   * Handle info alert
   */
  handleInfoAlert(alert) {
    // Log info alert
    this.logger.info(`INFO ALERT: ${alert.message}`, alert.details);
  }
  
  /**
   * Create a new alert
   */
  createAlert(alertData) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      timestamp: Date.now(),
      resolved: false,
      processed: false,
      ...alertData
    };
    
    return alert;
  }
  
  /**
   * Resolve an alert
   */
  resolveAlert(alerts, alertId, resolution = {}) {
    const alert = alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.resolved = true;
      alert.resolutionTimestamp = Date.now();
      alert.resolution = resolution;
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Send notification (placeholder - implement based on notification system)
   */
  sendNotification(notification) {
    // This would be implemented based on the notification system
    // For now, just log it
    this.logger.info('Notification would be sent:', notification);
  }
  
  /**
   * Check performance thresholds and create alerts if needed
   */
  checkPerformanceThresholds(metrics) {
    const alerts = [];
    
    // CPU usage threshold (80%)
    if (metrics.system.cpu > 80) {
      alerts.push(this.createAlert({
        type: 'performance',
        level: 'warning',
        message: 'High CPU usage detected',
        details: {
          cpu: metrics.system.cpu,
          threshold: 80
        }
      }));
    }
    
    // Memory usage threshold (90%)
    if (metrics.system.memory > 90) {
      alerts.push(this.createAlert({
        type: 'performance',
        level: 'warning',
        message: 'High memory usage detected',
        details: {
          memory: metrics.system.memory,
          threshold: 90
        }
      }));
    }
    
    // Motor temperature threshold (70°C)
    if (metrics.tractor.motorTemperature > 70) {
      alerts.push(this.createAlert({
        type: 'performance',
        level: 'critical',
        message: 'Motor temperature too high',
        details: {
          temperature: metrics.tractor.motorTemperature,
          threshold: 70
        }
      }));
    }
    
    // Controller temperature threshold (60°C)
    if (metrics.tractor.controllerTemperature > 60) {
      alerts.push(this.createAlert({
        type: 'performance',
        level: 'warning',
        message: 'Controller temperature too high',
        details: {
          temperature: metrics.tractor.controllerTemperature,
          threshold: 60
        }
      }));
    }
    
    return alerts;
  }
  
  /**
   * Check battery thresholds and create alerts if needed
   */
  checkBatteryThresholds(metrics) {
    const alerts = [];
    
    // Battery level threshold (20%)
    if (metrics.level < 20) {
      alerts.push(this.createAlert({
        type: 'battery',
        level: 'warning',
        message: 'Low battery level',
        details: {
          level: metrics.level,
          threshold: 20
        }
      }));
    }
    
    // Battery level critical threshold (10%)
    if (metrics.level < 10) {
      alerts.push(this.createAlert({
        type: 'battery',
        level: 'critical',
        message: 'Critical battery level',
        details: {
          level: metrics.level,
          threshold: 10
        }
      }));
    }
    
    // Battery temperature threshold (45°C)
    if (metrics.temperature > 45) {
      alerts.push(this.createAlert({
        type: 'battery',
        level: 'warning',
        message: 'Battery temperature too high',
        details: {
          temperature: metrics.temperature,
          threshold: 45
        }
      }));
    }
    
    // Battery temperature critical threshold (55°C)
    if (metrics.temperature > 55) {
      alerts.push(this.createAlert({
        type: 'battery',
        level: 'critical',
        message: 'Critical battery temperature',
        details: {
          temperature: metrics.temperature,
          threshold: 55
        }
      }));
    }
    
    return alerts;
  }
  
  /**
   * Check security thresholds and create alerts if needed
   */
  checkSecurityThresholds(metrics) {
    const alerts = [];
    
    // Failed authentication attempts threshold (5)
    if (metrics.failedAuthAttempts > 5) {
      alerts.push(this.createAlert({
        type: 'security',
        level: 'warning',
        message: 'Multiple failed authentication attempts',
        details: {
          attempts: metrics.failedAuthAttempts,
          threshold: 5
        }
      }));
    }
    
    // Unauthorized access attempts threshold (3)
    if (metrics.unauthorizedAccessAttempts > 3) {
      alerts.push(this.createAlert({
        type: 'security',
        level: 'critical',
        message: 'Multiple unauthorized access attempts',
        details: {
          attempts: metrics.unauthorizedAccessAttempts,
          threshold: 3
        }
      }));
    }
    
    return alerts;
  }
}

module.exports = AlertManager;