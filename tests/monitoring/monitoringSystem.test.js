/**
 * Monitoring System Tests
 * 
 * Tests for the monitoring system components
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { MonitoringSystem, MetricsCollector, AlertManager, DiagnosticsManager } = require('../../src/monitoring');

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Test configuration
const testConfig = {
  monitoring: {
    metricsInterval: 100, // 100ms for faster testing
    alertsEnabled: true,
    storageDir: path.join(os.tmpdir(), 'sevak-monitoring-test'),
    retentionDays: 1,
    thresholds: {
      cpu: {
        warning: 80,
        critical: 95
      },
      memory: {
        warning: 80,
        critical: 95
      },
      battery: {
        level: {
          warning: 20,
          critical: 10
        },
        temperature: {
          warning: 45,
          critical: 55
        }
      }
    }
  }
};

describe('Monitoring System', () => {
  let monitoringSystem;
  
  beforeEach(async () => {
    // Create a fresh monitoring system for each test
    monitoringSystem = new MonitoringSystem(testConfig, mockLogger);
    
    // Clean up test directory if it exists
    try {
      await fs.rm(testConfig.monitoring.storageDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  });
  
  afterEach(async () => {
    // Stop monitoring system if running
    if (monitoringSystem.isRunning) {
      await monitoringSystem.stop();
    }
    
    // Clean up test directory
    try {
      await fs.rm(testConfig.monitoring.storageDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('should initialize correctly', async () => {
    // Act
    await monitoringSystem.start();
    
    // Assert
    expect(monitoringSystem.isRunning).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith('Monitoring system started successfully');
  });
  
  test('should collect metrics', async () => {
    // Arrange
    await monitoringSystem.start();
    
    // Act - wait for metrics collection
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Assert
    expect(monitoringSystem.metrics.performance.length).toBeGreaterThan(0);
    expect(monitoringSystem.metrics.battery.length).toBeGreaterThan(0);
  });
  
  test('should stop correctly', async () => {
    // Arrange
    await monitoringSystem.start();
    
    // Act
    await monitoringSystem.stop();
    
    // Assert
    expect(monitoringSystem.isRunning).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('Monitoring system stopped successfully');
  });
  
  test('should save and load data', async () => {
    // Arrange
    await monitoringSystem.start();
    
    // Add some test data
    monitoringSystem.metrics.performance.push({
      timestamp: Date.now(),
      system: {
        cpu: 50,
        memory: 60
      }
    });
    
    // Act - save data
    await monitoringSystem.saveData();
    
    // Create a new monitoring system to load the data
    const newMonitoringSystem = new MonitoringSystem(testConfig, mockLogger);
    await newMonitoringSystem.loadData();
    
    // Assert
    expect(newMonitoringSystem.metrics.performance.length).toBeGreaterThan(0);
  });
});

describe('Metrics Collector', () => {
  let metricsCollector;
  
  beforeEach(() => {
    // Create a mock system
    const mockSystem = {
      logger: mockLogger
    };
    
    // Create a fresh metrics collector for each test
    metricsCollector = new MetricsCollector(mockSystem);
  });
  
  test('should collect performance metrics', () => {
    // Act
    const metrics = metricsCollector.collectPerformanceMetrics();
    
    // Assert
    expect(metrics).toBeDefined();
    expect(metrics.timestamp).toBeDefined();
    expect(metrics.system).toBeDefined();
    expect(metrics.system.cpu).toBeDefined();
    expect(metrics.system.memory).toBeDefined();
    expect(metrics.tractor).toBeDefined();
  });
  
  test('should collect battery metrics', () => {
    // Act
    const metrics = metricsCollector.collectBatteryMetrics();
    
    // Assert
    expect(metrics).toBeDefined();
    expect(metrics.timestamp).toBeDefined();
    expect(metrics.level).toBeDefined();
    expect(metrics.voltage).toBeDefined();
    expect(metrics.temperature).toBeDefined();
  });
});

describe('Alert Manager', () => {
  let alertManager;
  
  beforeEach(() => {
    // Create a mock system
    const mockSystem = {
      logger: mockLogger
    };
    
    // Create a fresh alert manager for each test
    alertManager = new AlertManager(mockSystem);
  });
  
  test('should create alerts', () => {
    // Act
    const alert = alertManager.createAlert({
      type: 'test',
      level: 'warning',
      message: 'Test alert',
      details: { test: true }
    });
    
    // Assert
    expect(alert).toBeDefined();
    expect(alert.id).toBeDefined();
    expect(alert.timestamp).toBeDefined();
    expect(alert.type).toBe('test');
    expect(alert.level).toBe('warning');
    expect(alert.message).toBe('Test alert');
    expect(alert.details).toEqual({ test: true });
    expect(alert.resolved).toBe(false);
  });
  
  test('should check performance thresholds', () => {
    // Arrange
    const metrics = {
      system: {
        cpu: 90,
        memory: 50
      },
      tractor: {
        motorTemperature: 40,
        controllerTemperature: 30
      }
    };
    
    // Act
    const alerts = alertManager.checkPerformanceThresholds(metrics);
    
    // Assert
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('performance');
    expect(alerts[0].level).toBe('warning');
    expect(alerts[0].message).toBe('High CPU usage detected');
  });
  
  test('should check battery thresholds', () => {
    // Arrange
    const metrics = {
      level: 15,
      temperature: 30
    };
    
    // Act
    const alerts = alertManager.checkBatteryThresholds(metrics);
    
    // Assert
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('battery');
    expect(alerts[0].level).toBe('warning');
    expect(alerts[0].message).toBe('Low battery level');
  });
});

describe('Diagnostics Manager', () => {
  let diagnosticsManager;
  
  beforeEach(() => {
    // Create a mock system
    const mockSystem = {
      logger: mockLogger
    };
    
    // Create a fresh diagnostics manager for each test
    diagnosticsManager = new DiagnosticsManager(mockSystem);
  });
  
  test('should run diagnostics', async () => {
    // Act
    const results = await diagnosticsManager.runDiagnostics();
    
    // Assert
    expect(results).toBeDefined();
    expect(results.timestamp).toBeDefined();
    expect(results.summary).toBeDefined();
    expect(results.summary.total).toBeGreaterThan(0);
    expect(results.results.system).toBeDefined();
    expect(results.results.motors).toBeDefined();
    expect(results.results.battery).toBeDefined();
  });
});