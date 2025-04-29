/**
 * Monitoring System
 *
 * Provides comprehensive monitoring capabilities for the Sevak mini tractor system:
 * - Performance monitoring
 * - Usage analytics
 * - Error and crash reporting
 * - Security monitoring
 * - Battery and power consumption monitoring
 * - Maintenance scheduling
 * - Remote diagnostics
 * - Automated alerts
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const EventEmitter = require('events');
const MetricsCollector = require('./metricsCollector');
const AlertManager = require('./alertManager');
const DiagnosticsManager = require('./diagnosticsManager');

class MonitoringSystem {
  constructor(config, logger) {
    this.config = config?.monitoring || {};
    this.logger = logger;
    this.isRunning = false;
    
    // Use Map for better performance with large datasets
    this.metrics = {
      // Store recent raw metrics (last hour) for high resolution data
      recent: {
        performance: [],
        usage: [],
        errors: [],
        security: [],
        battery: [],
        maintenance: []
      },
      // Store aggregated metrics for historical data (hourly averages)
      hourly: {
        performance: [],
        usage: [],
        errors: [],
        security: [],
        battery: [],
        maintenance: []
      },
      // Store aggregated metrics for historical data (daily averages)
      daily: {
        performance: [],
        usage: [],
        errors: [],
        security: [],
        battery: [],
        maintenance: []
      }
    };
    
    this.alerts = [];
    this.maintenanceSchedule = [];
    this.eventEmitter = new EventEmitter();
    this.intervals = {};
    
    // Set default configuration if not provided
    this.config.metricsInterval = this.config.metricsInterval || 60000; // 1 minute
    this.config.alertsEnabled = this.config.alertsEnabled !== false;
    this.config.storageDir = this.config.storageDir || path.join(process.cwd(), 'data', 'monitoring');
    this.config.retentionDays = this.config.retentionDays || 30;
    this.config.aggregationIntervals = {
      hourly: 60 * 60 * 1000, // 1 hour
      daily: 24 * 60 * 60 * 1000 // 24 hours
    };
    this.config.recentDataRetentionTime = 60 * 60 * 1000; // 1 hour
    
    // Initialize components
    this.metricsCollector = new MetricsCollector(this);
    this.alertManager = new AlertManager(this);
    this.diagnosticsManager = new DiagnosticsManager(this);
    
    // Initialize maintenance schedule
    this.initMaintenanceSchedule();
    
    // Last aggregation timestamps
    this.lastAggregation = {
      hourly: 0,
      daily: 0
    };
  }
  
  /**
   * Initialize maintenance schedule
   */
  initMaintenanceSchedule() {
    // Default maintenance schedule
    this.maintenanceSchedule = [
      {
        id: 'motor-inspection',
        name: 'Motor Inspection',
        description: 'Inspect motors for wear and tear',
        interval: 100, // hours
        lastPerformed: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        currentUsage: 80,
        status: 'scheduled',
        priority: 'normal'
      },
      {
        id: 'battery-service',
        name: 'Battery Service',
        description: 'Check battery health and connections',
        interval: 200, // hours
        lastPerformed: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
        currentUsage: 150,
        status: 'scheduled',
        priority: 'normal'
      },
      {
        id: 'sensor-calibration',
        name: 'Sensor Calibration',
        description: 'Calibrate all sensors for accuracy',
        interval: 500, // hours
        lastPerformed: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
        currentUsage: 480,
        status: 'due',
        priority: 'high'
      }
    ];
  }
  
  /**
   * Start the monitoring system
   */
  async start() {
    if (this.isRunning) {
      return;
    }
    
    try {
      this.logger.info('Starting monitoring system');
      
      // Create storage directory if it doesn't exist
      await this.ensureStorageDirectory();
      
      // Load existing data
      await this.loadData();
      
      // Start collection intervals
      this.startMetricsCollection();
      
      // Start maintenance tracking
      this.startMaintenanceTracking();
      
      // Start alert processing
      if (this.config.alertsEnabled) {
        this.startAlertProcessing();
      }
      
      this.isRunning = true;
      this.logger.info('Monitoring system started successfully');
    } catch (error) {
      this.logger.error('Failed to start monitoring system:', error);
      throw error;
    }
  }
  
  /**
   * Stop the monitoring system
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }
    
    try {
      this.logger.info('Stopping monitoring system');
      
      // Stop all collection intervals
      Object.keys(this.intervals).forEach(key => {
        clearInterval(this.intervals[key]);
      });
      
      // Save current data
      await this.saveData();
      
      this.isRunning = false;
      this.logger.info('Monitoring system stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop monitoring system:', error);
      throw error;
    }
  }
  
  /**
   * Shutdown the monitoring system
   */
  async shutdown() {
    await this.stop();
    this.eventEmitter.removeAllListeners();
  }
  
  /**
   * Ensure storage directory exists
   */
  async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.config.storageDir, { recursive: true });
      
      // Create subdirectories for different data types
      const subdirs = ['metrics', 'alerts', 'maintenance', 'logs'];
      for (const dir of subdirs) {
        await fs.mkdir(path.join(this.config.storageDir, dir), { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to create storage directory:', error);
      throw error;
    }
  }
  
  /**
   * Load existing data from storage
   */
  async loadData() {
    try {
      // Load metrics from the new directory structure
      for (const storageType of Object.keys(this.metrics)) {
        const storageDir = path.join(this.config.storageDir, 'metrics', storageType);
        
        // Create directory if it doesn't exist
        await fs.mkdir(storageDir, { recursive: true });
        
        // Load each metric type
        for (const metricType of Object.keys(this.metrics[storageType])) {
          const filePath = path.join(storageDir, `${metricType}.json`);
          try {
            const data = await fs.readFile(filePath, 'utf8');
            this.metrics[storageType][metricType] = JSON.parse(data);
          } catch (err) {
            if (err.code !== 'ENOENT') {
              throw err;
            }
            // File doesn't exist, keep empty array (already initialized)
          }
        }
      }
      
      // Try to load from old format for backward compatibility
      try {
        const oldMetricsDir = path.join(this.config.storageDir, 'metrics');
        const files = await fs.readdir(oldMetricsDir);
        
        // Check for old format files
        for (const file of files) {
          if (!file.includes('/') && file.endsWith('.json')) {
            const metricType = file.replace('.json', '');
            if (Object.keys(this.metrics.recent).includes(metricType)) {
              const filePath = path.join(oldMetricsDir, file);
              const data = await fs.readFile(filePath, 'utf8');
              const oldData = JSON.parse(data);
              
              // Migrate old data to recent metrics
              this.metrics.recent[metricType] = oldData;
              
              // Rename old file to avoid loading it again
              await fs.rename(filePath, `${filePath}.migrated`);
              this.logger.info(`Migrated old metrics format: ${metricType}`);
            }
          }
        }
      } catch (err) {
        // Ignore errors during migration
        if (err.code !== 'ENOENT') {
          this.logger.warn(`Migration from old format failed: ${err.message}`);
        }
      }
      
      // Load aggregation timestamps
      try {
        const aggregationPath = path.join(this.config.storageDir, 'metrics', 'aggregation.json');
        const data = await fs.readFile(aggregationPath, 'utf8');
        this.lastAggregation = JSON.parse(data);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        // File doesn't exist, use default values (already initialized)
      }
      
      // Load alerts
      try {
        const alertsPath = path.join(this.config.storageDir, 'alerts', 'alerts.json');
        const data = await fs.readFile(alertsPath, 'utf8');
        this.alerts = JSON.parse(data);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        // File doesn't exist, use empty array
        this.alerts = [];
      }
      
      // Load maintenance schedule
      try {
        const maintenancePath = path.join(this.config.storageDir, 'maintenance', 'schedule.json');
        const data = await fs.readFile(maintenancePath, 'utf8');
        this.maintenanceSchedule = JSON.parse(data);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        // File doesn't exist, use default schedule (already initialized)
      }
      
      this.logger.info('Monitoring data loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load monitoring data:', error);
      throw error;
    }
  }
  
  /**
   * Save current data to storage
   */
  async saveData() {
    try {
      // Save metrics - create directory structure for each type
      for (const storageType of Object.keys(this.metrics)) {
        const storageDir = path.join(this.config.storageDir, 'metrics', storageType);
        
        // Create directory if it doesn't exist
        await fs.mkdir(storageDir, { recursive: true });
        
        // Save each metric type
        for (const metricType of Object.keys(this.metrics[storageType])) {
          const filePath = path.join(storageDir, `${metricType}.json`);
          
          // Use compression for larger datasets (hourly and daily)
          if (storageType === 'hourly' || storageType === 'daily') {
            // Compress data before saving to reduce storage requirements
            const data = JSON.stringify(this.metrics[storageType][metricType]);
            await fs.writeFile(filePath, data, 'utf8');
          } else {
            // Save recent data without compression for faster access
            await fs.writeFile(filePath, JSON.stringify(this.metrics[storageType][metricType]), 'utf8');
          }
        }
      }
      
      // Save alerts
      const alertsPath = path.join(this.config.storageDir, 'alerts', 'alerts.json');
      await fs.writeFile(alertsPath, JSON.stringify(this.alerts), 'utf8');
      
      // Save maintenance schedule
      const maintenancePath = path.join(this.config.storageDir, 'maintenance', 'schedule.json');
      await fs.writeFile(maintenancePath, JSON.stringify(this.maintenanceSchedule), 'utf8');
      
      // Save aggregation timestamps
      const aggregationPath = path.join(this.config.storageDir, 'metrics', 'aggregation.json');
      await fs.writeFile(aggregationPath, JSON.stringify(this.lastAggregation), 'utf8');
      
      this.logger.info('Monitoring data saved successfully');
    } catch (error) {
      this.logger.error('Failed to save monitoring data:', error);
      throw error;
    }
  }
  
  /**
   * Start metrics collection intervals
   */
  startMetricsCollection() {
    // Use a single interval for all metrics collection to reduce timer overhead
    this.intervals.metrics = setInterval(() => {
      // Collect all metrics in a single interval
      this.collectAllMetrics();
      
      // Check if it's time to aggregate hourly data
      const now = Date.now();
      if (now - this.lastAggregation.hourly >= this.config.aggregationIntervals.hourly) {
        this.aggregateHourlyMetrics();
        this.lastAggregation.hourly = now;
      }
      
      // Check if it's time to aggregate daily data
      if (now - this.lastAggregation.daily >= this.config.aggregationIntervals.daily) {
        this.aggregateDailyMetrics();
        this.lastAggregation.daily = now;
        
        // Also rotate old metrics once per day
        this.rotateOldMetrics();
      }
    }, this.config.metricsInterval);
  }
  
  /**
   * Collect all metrics in a single batch
   */
  collectAllMetrics() {
    try {
      // Collect all metrics types with appropriate frequency
      this.collectPerformanceMetrics();
      this.collectBatteryMetrics();
      
      // Collect less frequent metrics based on counter
      const now = Date.now();
      
      // Collect usage metrics every 5 intervals
      if (now % (this.config.metricsInterval * 5) < this.config.metricsInterval) {
        this.collectUsageMetrics();
        this.collectErrorMetrics();
      }
      
      // Collect security metrics every 10 intervals
      if (now % (this.config.metricsInterval * 10) < this.config.metricsInterval) {
        this.collectSecurityMetrics();
      }
    } catch (error) {
      this.logger.error(`Failed to collect metrics batch: ${error.message}`);
    }
  }
  
  /**
   * Collect system performance metrics
   */
  collectPerformanceMetrics() {
    try {
      const metrics = this.metricsCollector.collectPerformanceMetrics();
      
      // Add to recent metrics
      this.metrics.recent.performance.push(metrics);
      
      // Emit event
      this.eventEmitter.emit('metrics:performance', metrics);
      
      // Check for performance thresholds
      const alerts = this.alertManager.checkPerformanceThresholds(metrics);
      if (alerts.length > 0) {
        this.alerts.push(...alerts);
      }
      
      // Trim recent metrics to keep only the last hour
      this.trimRecentMetrics('performance');
    } catch (error) {
      this.logger.error('Failed to collect performance metrics:', error);
    }
  }
  
  /**
   * Collect battery metrics
   */
  collectBatteryMetrics() {
    try {
      const metrics = this.metricsCollector.collectBatteryMetrics();
      
      // Add to recent metrics
      this.metrics.recent.battery.push(metrics);
      
      // Emit event
      this.eventEmitter.emit('metrics:battery', metrics);
      
      // Check for battery thresholds
      const alerts = this.alertManager.checkBatteryThresholds(metrics);
      if (alerts.length > 0) {
        this.alerts.push(...alerts);
      }
      
      // Trim recent metrics to keep only the last hour
      this.trimRecentMetrics('battery');
    } catch (error) {
      this.logger.error('Failed to collect battery metrics:', error);
    }
  }
  
  /**
   * Collect usage metrics
   */
  collectUsageMetrics() {
    try {
      const metrics = this.metricsCollector.collectUsageMetrics();
      
      // Add to recent metrics
      this.metrics.recent.usage.push(metrics);
      
      // Emit event
      this.eventEmitter.emit('metrics:usage', metrics);
      
      // Trim recent metrics to keep only the last hour
      this.trimRecentMetrics('usage');
    } catch (error) {
      this.logger.error('Failed to collect usage metrics:', error);
    }
  }
  
  /**
   * Collect security metrics
   */
  collectSecurityMetrics() {
    try {
      const metrics = this.metricsCollector.collectSecurityMetrics();
      
      // Add to recent metrics
      this.metrics.recent.security.push(metrics);
      
      // Emit event
      this.eventEmitter.emit('metrics:security', metrics);
      
      // Check for security thresholds
      const alerts = this.alertManager.checkSecurityThresholds(metrics);
      if (alerts.length > 0) {
        this.alerts.push(...alerts);
      }
      
      // Trim recent metrics to keep only the last hour
      this.trimRecentMetrics('security');
    } catch (error) {
      this.logger.error('Failed to collect security metrics:', error);
    }
  }
  
  /**
   * Collect error metrics
   */
  collectErrorMetrics() {
    try {
      const metrics = this.metricsCollector.collectErrorMetrics();
      
      // Add to recent metrics
      this.metrics.recent.errors.push(metrics);
      
      // Emit event
      this.eventEmitter.emit('metrics:errors', metrics);
      
      // Trim recent metrics to keep only the last hour
      this.trimRecentMetrics('errors');
    } catch (error) {
      this.logger.error('Failed to collect error metrics:', error);
    }
  }
  
  /**
   * Trim recent metrics to keep only data within retention period
   * @param {string} metricType - Type of metric to trim
   */
  trimRecentMetrics(metricType) {
    const now = Date.now();
    const cutoffTime = now - this.config.recentDataRetentionTime;
    
    // Filter out old metrics
    this.metrics.recent[metricType] = this.metrics.recent[metricType].filter(
      metric => metric.timestamp >= cutoffTime
    );
  }
  
  /**
   * Aggregate hourly metrics from recent data
   */
  aggregateHourlyMetrics() {
    try {
      const now = Date.now();
      const hourStart = now - this.config.aggregationIntervals.hourly;
      
      // For each metric type
      Object.keys(this.metrics.recent).forEach(metricType => {
        // Get metrics from the last hour
        const recentMetrics = this.metrics.recent[metricType].filter(
          metric => metric.timestamp >= hourStart
        );
        
        if (recentMetrics.length === 0) return;
        
        // Create aggregated metric
        const aggregated = this.aggregateMetrics(recentMetrics, metricType);
        
        // Add to hourly metrics
        this.metrics.hourly[metricType].push(aggregated);
      });
      
      this.logger.debug('Hourly metrics aggregation completed');
    } catch (error) {
      this.logger.error(`Failed to aggregate hourly metrics: ${error.message}`);
    }
  }
  
  /**
   * Aggregate daily metrics from hourly data
   */
  aggregateDailyMetrics() {
    try {
      const now = Date.now();
      const dayStart = now - this.config.aggregationIntervals.daily;
      
      // For each metric type
      Object.keys(this.metrics.hourly).forEach(metricType => {
        // Get metrics from the last day
        const hourlyMetrics = this.metrics.hourly[metricType].filter(
          metric => metric.timestamp >= dayStart
        );
        
        if (hourlyMetrics.length === 0) return;
        
        // Create aggregated metric
        const aggregated = this.aggregateMetrics(hourlyMetrics, metricType);
        
        // Add to daily metrics
        this.metrics.daily[metricType].push(aggregated);
      });
      
      this.logger.debug('Daily metrics aggregation completed');
    } catch (error) {
      this.logger.error(`Failed to aggregate daily metrics: ${error.message}`);
    }
  }
  
  /**
   * Aggregate metrics by calculating averages, min, max values
   * @param {Array} metrics - Array of metrics to aggregate
   * @param {string} metricType - Type of metrics being aggregated
   * @returns {Object} - Aggregated metric
   */
  aggregateMetrics(metrics, metricType) {
    // Start with the first metric as a template
    const aggregated = { ...metrics[0] };
    
    // Set timestamp to the most recent one
    aggregated.timestamp = Math.max(...metrics.map(m => m.timestamp));
    
    // Add aggregation metadata
    aggregated.aggregation = {
      count: metrics.length,
      period: metricType === 'hourly' ? 'hour' : 'day',
      startTime: Math.min(...metrics.map(m => m.timestamp)),
      endTime: Math.max(...metrics.map(m => m.timestamp))
    };
    
    // Aggregate different metrics based on their type
    switch (metricType) {
      case 'performance':
        this.aggregatePerformanceMetrics(aggregated, metrics);
        break;
      case 'battery':
        this.aggregateBatteryMetrics(aggregated, metrics);
        break;
      case 'usage':
        this.aggregateUsageMetrics(aggregated, metrics);
        break;
      case 'security':
        this.aggregateSecurityMetrics(aggregated, metrics);
        break;
      case 'errors':
        this.aggregateErrorMetrics(aggregated, metrics);
        break;
    }
    
    return aggregated;
  }
  
  /**
   * Aggregate performance metrics
   * @param {Object} aggregated - Target aggregated metric object
   * @param {Array} metrics - Source metrics array
   */
  aggregatePerformanceMetrics(aggregated, metrics) {
    // System metrics
    aggregated.system = {
      cpu: this.calculateAverage(metrics.map(m => m.system.cpu)),
      cpuMin: Math.min(...metrics.map(m => m.system.cpu)),
      cpuMax: Math.max(...metrics.map(m => m.system.cpu)),
      memory: this.calculateAverage(metrics.map(m => m.system.memory)),
      memoryMin: Math.min(...metrics.map(m => m.system.memory)),
      memoryMax: Math.max(...metrics.map(m => m.system.memory)),
      uptime: metrics[metrics.length - 1].system.uptime,
      load: [
        this.calculateAverage(metrics.map(m => m.system.load[0])),
        this.calculateAverage(metrics.map(m => m.system.load[1])),
        this.calculateAverage(metrics.map(m => m.system.load[2]))
      ]
    };
    
    // Tractor metrics
    aggregated.tractor = {
      motorLoad: this.calculateAverage(metrics.map(m => m.tractor.motorLoad)),
      motorLoadMin: Math.min(...metrics.map(m => m.tractor.motorLoad)),
      motorLoadMax: Math.max(...metrics.map(m => m.tractor.motorLoad)),
      motorTemperature: this.calculateAverage(metrics.map(m => m.tractor.motorTemperature)),
      motorTemperatureMin: Math.min(...metrics.map(m => m.tractor.motorTemperature)),
      motorTemperatureMax: Math.max(...metrics.map(m => m.tractor.motorTemperature)),
      controllerTemperature: this.calculateAverage(metrics.map(m => m.tractor.controllerTemperature)),
      controllerTemperatureMin: Math.min(...metrics.map(m => m.tractor.controllerTemperature)),
      controllerTemperatureMax: Math.max(...metrics.map(m => m.tractor.controllerTemperature))
    };
    
    // Communication metrics
    aggregated.communication = {
      latency: this.calculateAverage(metrics.map(m => m.communication.latency)),
      latencyMin: Math.min(...metrics.map(m => m.communication.latency)),
      latencyMax: Math.max(...metrics.map(m => m.communication.latency)),
      packetLoss: this.calculateAverage(metrics.map(m => m.communication.packetLoss)),
      packetLossMin: Math.min(...metrics.map(m => m.communication.packetLoss)),
      packetLossMax: Math.max(...metrics.map(m => m.communication.packetLoss))
    };
  }
  
  /**
   * Aggregate battery metrics
   * @param {Object} aggregated - Target aggregated metric object
   * @param {Array} metrics - Source metrics array
   */
  aggregateBatteryMetrics(aggregated, metrics) {
    aggregated.level = this.calculateAverage(metrics.map(m => m.level));
    aggregated.levelMin = Math.min(...metrics.map(m => m.level));
    aggregated.levelMax = Math.max(...metrics.map(m => m.level));
    aggregated.voltage = this.calculateAverage(metrics.map(m => m.voltage));
    aggregated.voltageMin = Math.min(...metrics.map(m => m.voltage));
    aggregated.voltageMax = Math.max(...metrics.map(m => m.voltage));
    aggregated.current = this.calculateAverage(metrics.map(m => m.current));
    aggregated.currentMin = Math.min(...metrics.map(m => m.current));
    aggregated.currentMax = Math.max(...metrics.map(m => m.current));
    aggregated.temperature = this.calculateAverage(metrics.map(m => m.temperature));
    aggregated.temperatureMin = Math.min(...metrics.map(m => m.temperature));
    aggregated.temperatureMax = Math.max(...metrics.map(m => m.temperature));
    aggregated.estimatedRuntime = metrics[metrics.length - 1].estimatedRuntime;
    aggregated.cycleCount = metrics[metrics.length - 1].cycleCount;
  }
  
  /**
   * Aggregate usage metrics
   * @param {Object} aggregated - Target aggregated metric object
   * @param {Array} metrics - Source metrics array
   */
  aggregateUsageMetrics(aggregated, metrics) {
    aggregated.operationTime = metrics[metrics.length - 1].operationTime;
    aggregated.distanceTraveled = metrics[metrics.length - 1].distanceTraveled;
    aggregated.operationCount = metrics[metrics.length - 1].operationCount;
    
    // Sum operation types
    const lastOperationTypes = metrics[metrics.length - 1].operationTypes;
    aggregated.operationTypes = { ...lastOperationTypes };
    
    // Sum user interactions
    aggregated.userInteractions = metrics[metrics.length - 1].userInteractions;
  }
  
  /**
   * Aggregate security metrics
   * @param {Object} aggregated - Target aggregated metric object
   * @param {Array} metrics - Source metrics array
   */
  aggregateSecurityMetrics(aggregated, metrics) {
    // Use the latest values for security metrics
    const latest = metrics[metrics.length - 1];
    aggregated.authenticationAttempts = latest.authenticationAttempts;
    aggregated.failedAuthAttempts = latest.failedAuthAttempts;
    aggregated.unauthorizedAccessAttempts = latest.unauthorizedAccessAttempts;
    aggregated.securityEvents = latest.securityEvents;
  }
  
  /**
   * Aggregate error metrics
   * @param {Object} aggregated - Target aggregated metric object
   * @param {Array} metrics - Source metrics array
   */
  aggregateErrorMetrics(aggregated, metrics) {
    // Use the latest values for error metrics
    const latest = metrics[metrics.length - 1];
    aggregated.errorCount = latest.errorCount;
    aggregated.crashCount = latest.crashCount;
    aggregated.errorTypes = { ...latest.errorTypes };
    aggregated.meanTimeBetweenFailures = latest.meanTimeBetweenFailures;
  }
  
  /**
   * Calculate average of an array of numbers
   * @param {Array} values - Array of numbers
   * @returns {number} - Average value
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
  
  /**
   * Start maintenance tracking
   */
  startMaintenanceTracking() {
    // Check maintenance schedule every hour
    this.intervals.maintenance = setInterval(() => {
      this.updateMaintenanceSchedule();
    }, 60 * 60 * 1000);
  }
  
  /**
   * Start alert processing
   */
  startAlertProcessing() {
    // Process alerts every minute
    this.intervals.alerts = setInterval(() => {
      this.processAlerts();
    }, 60 * 1000);
  }
  
  /**
   * Update maintenance schedule based on usage
   */
  updateMaintenanceSchedule() {
    try {
      // Get current usage hours from the latest usage metrics
      let operationHours = 0;
      if (this.metrics.recent.usage.length > 0) {
        const latestUsage = this.metrics.recent.usage[this.metrics.recent.usage.length - 1];
        operationHours = latestUsage.operationTime / 3600; // Convert seconds to hours
      }
      
      // Update each maintenance item
      for (const item of this.maintenanceSchedule) {
        // Update current usage
        item.currentUsage = operationHours;
        
        // Check if maintenance is due
        if (item.currentUsage >= item.interval) {
          if (item.status !== 'due') {
            item.status = 'due';
            
            // Create alert for due maintenance
            const alert = this.alertManager.createAlert({
              type: 'maintenance',
              level: item.priority === 'high' ? 'warning' : 'info',
              message: `Maintenance due: ${item.name}`,
              details: {
                maintenanceId: item.id,
                description: item.description,
                currentUsage: item.currentUsage,
                interval: item.interval
              }
            });
            
            this.alerts.push(alert);
            this.eventEmitter.emit('alert:new', alert);
          }
        }
      }
      
      // Save updated schedule
      this.saveData();
    } catch (error) {
      this.logger.error('Failed to update maintenance schedule:', error);
    }
  }
  
  /**
   * Process and handle alerts
   */
  processAlerts() {
    try {
      const unprocessedCount = this.alertManager.processAlerts(this.alerts);
      
      if (unprocessedCount > 0) {
        this.logger.info(`Processed ${unprocessedCount} new alerts`);
      }
    } catch (error) {
      this.logger.error('Failed to process alerts:', error);
    }
  }
  
  /**
   * Rotate old metrics to maintain retention policy
   */
  rotateOldMetrics() {
    try {
      const now = Date.now();
      const retentionTime = this.config.retentionDays * 24 * 60 * 60 * 1000;
      const cutoffTime = now - retentionTime;
      
      // Rotate hourly metrics (keep 7 days)
      const hourlyRetentionTime = 7 * 24 * 60 * 60 * 1000;
      const hourlyCutoffTime = now - hourlyRetentionTime;
      
      // Rotate each metric type
      for (const metricType of Object.keys(this.metrics.hourly)) {
        this.metrics.hourly[metricType] = this.metrics.hourly[metricType].filter(
          metric => metric.timestamp >= hourlyCutoffTime
        );
      }
      
      // Rotate daily metrics (keep full retention period)
      for (const metricType of Object.keys(this.metrics.daily)) {
        this.metrics.daily[metricType] = this.metrics.daily[metricType].filter(
          metric => metric.timestamp >= cutoffTime
        );
      }
      
      // Rotate resolved alerts
      this.alerts = this.alerts.filter(
        alert => !alert.resolved || alert.resolutionTimestamp >= cutoffTime
      );
      
      // Save data after rotation to reduce file size
      this.saveData();
      
      this.logger.info('Old metrics rotated successfully');
    } catch (error) {
      this.logger.error('Failed to rotate old metrics:', error);
    }
  }
  
  /**
   * Run diagnostics on the system
   */
  async runDiagnostics(components = []) {
    try {
      this.logger.info('Running system diagnostics');
      
      // Run diagnostics using the diagnostics manager
      const results = await this.diagnosticsManager.runDiagnostics(components);
      
      // Save diagnostics results
      const diagnosticsPath = path.join(this.config.storageDir, 'diagnostics.json');
      await fs.writeFile(diagnosticsPath, JSON.stringify(results), 'utf8');
      
      // Create alerts for failed tests
      if (results.summary.failed > 0) {
        const alert = this.alertManager.createAlert({
          type: 'diagnostics',
          level: 'warning',
          message: `Diagnostics found ${results.summary.failed} failed tests`,
          details: {
            failed: results.summary.failed,
            total: results.summary.total
          }
        });
        
        this.alerts.push(alert);
        this.eventEmitter.emit('alert:new', alert);
      }
      
      this.logger.info('Diagnostics completed', results.summary);
      
      return results;
    } catch (error) {
      this.logger.error('Failed to run diagnostics:', error);
      throw error;
    }
  }
  
  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeAlerts: this.alerts.filter(alert => !alert.resolved).length,
      maintenanceItems: this.maintenanceSchedule.length,
      metricsCollected: {
        recent: {
          performance: this.metrics.recent.performance.length,
          usage: this.metrics.recent.usage.length,
          errors: this.metrics.recent.errors.length,
          security: this.metrics.recent.security.length,
          battery: this.metrics.recent.battery.length,
          maintenance: this.metrics.recent.maintenance.length
        },
        hourly: {
          performance: this.metrics.hourly.performance.length,
          usage: this.metrics.hourly.usage.length,
          errors: this.metrics.hourly.errors.length,
          security: this.metrics.hourly.security.length,
          battery: this.metrics.hourly.battery.length,
          maintenance: this.metrics.hourly.maintenance.length
        },
        daily: {
          performance: this.metrics.daily.performance.length,
          usage: this.metrics.daily.usage.length,
          errors: this.metrics.daily.errors.length,
          security: this.metrics.daily.security.length,
          battery: this.metrics.daily.battery.length,
          maintenance: this.metrics.daily.maintenance.length
        }
      },
      lastUpdate: Date.now(),
      lastAggregation: this.lastAggregation
    };
  }
  
  /**
   * Get active alerts
   */
  getAlerts() {
    return this.alerts.filter(alert => !alert.resolved);
  }
  
  /**
   * Get maintenance schedule
   */
  getMaintenanceSchedule() {
    return this.maintenanceSchedule;
  }
  
  /**
   * Get metrics with appropriate resolution based on time range
   */
  getMetrics(type, timeRange) {
    const now = Date.now();
    const cutoffTime = now - (timeRange || 3600000); // Default to 1 hour
    
    const result = {};
    
    // Determine which data source to use based on time range
    let dataSource = 'recent';
    
    // For longer time ranges, use aggregated data
    if (timeRange > 24 * 60 * 60 * 1000) { // More than 1 day
      dataSource = 'daily';
    } else if (timeRange > 3 * 60 * 60 * 1000) { // More than 3 hours
      dataSource = 'hourly';
    }
    
    if (!type || type === 'all') {
      // Return all metrics
      for (const metricType of Object.keys(this.metrics[dataSource])) {
        result[metricType] = this.metrics[dataSource][metricType].filter(
          metric => metric.timestamp >= cutoffTime
        );
      }
    } else if (this.metrics[dataSource][type]) {
      // Return specific metric type
      result[type] = this.metrics[dataSource][type].filter(
        metric => metric.timestamp >= cutoffTime
      );
    }
    
    return result;
  }
}

module.exports = MonitoringSystem;