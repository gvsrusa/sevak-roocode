# Sevak Mini Tractor Monitoring System

A comprehensive monitoring system for the Sevak mini tractor project that provides real-time performance monitoring, usage analytics, error reporting, security monitoring, battery monitoring, maintenance scheduling, remote diagnostics, and automated alerts.

## Features

### 1. Performance Monitoring
- CPU, memory, and system load monitoring
- Motor load and temperature monitoring
- Controller temperature monitoring
- Communication latency and packet loss monitoring

### 2. Usage Analytics
- Operation time tracking
- Distance traveled tracking
- Operation count and types tracking
- User interaction tracking

### 3. Error and Crash Reporting
- Error count and types tracking
- Crash count tracking
- Mean time between failures tracking

### 4. Security Monitoring
- Authentication attempts tracking
- Failed authentication attempts tracking
- Unauthorized access attempts tracking
- Security events tracking

### 5. Battery and Power Consumption Monitoring
- Battery level monitoring
- Battery voltage and current monitoring
- Battery temperature monitoring
- Charge and discharge rate monitoring
- Estimated runtime calculation
- Battery cycle count tracking

### 6. Maintenance Scheduling
- Maintenance schedule management
- Maintenance due notifications
- Maintenance history tracking

### 7. Remote Diagnostics
- System diagnostics
- Motor diagnostics
- Sensor diagnostics
- Battery diagnostics
- Communication diagnostics
- Navigation diagnostics
- Safety diagnostics

### 8. Automated Alerts
- Critical, warning, and info level alerts
- Alert processing and notification
- Alert resolution tracking

### 9. Dashboard for Visualizing System Health
- Real-time metrics visualization
- Alert and maintenance status visualization
- System health overview

## Architecture

The monitoring system consists of the following components:

### MonitoringSystem
The core component that manages the monitoring system. It initializes and coordinates all other components, collects and stores metrics, processes alerts, and manages the maintenance schedule.

### MetricsCollector
Collects various metrics from the system, including performance metrics, battery metrics, usage metrics, security metrics, and error metrics.

### AlertManager
Manages alerts, including creating alerts, checking thresholds, and processing alerts.

### DiagnosticsManager
Runs diagnostics on the system, including system diagnostics, motor diagnostics, sensor diagnostics, battery diagnostics, communication diagnostics, navigation diagnostics, and safety diagnostics.

### MonitoringApi
Provides REST API endpoints for accessing monitoring data, including status, metrics, alerts, maintenance schedule, and diagnostics.

### MonitoringWebSocket
Provides real-time monitoring updates via WebSocket, including metrics, alerts, and status updates.

## Usage

### Initialization

```javascript
const { initMonitoring } = require('./monitoring');

// Initialize monitoring system with Express app and HTTP server
const monitoring = initMonitoring(
  config,
  logger,
  app,
  server
);

// Access monitoring components
const { monitoringSystem, monitoringApi, monitoringWebSocket } = monitoring;
```

### Configuration

```javascript
const config = {
  monitoring: {
    enabled: true,
    metricsInterval: 5000, // ms
    alertsEnabled: true,
    storageDir: './data/monitoring',
    retentionDays: 30,
    thresholds: {
      cpu: {
        warning: 80, // %
        critical: 95 // %
      },
      memory: {
        warning: 80, // %
        critical: 95 // %
      },
      battery: {
        level: {
          warning: 20, // %
          critical: 10 // %
        },
        temperature: {
          warning: 45, // °C
          critical: 55 // °C
        }
      },
      // ... other thresholds
    },
    maintenance: {
      schedules: [
        {
          id: 'motor-inspection',
          name: 'Motor Inspection',
          description: 'Inspect motors for wear and tear',
          interval: 100, // hours
          priority: 'normal'
        },
        // ... other maintenance schedules
      ]
    }
  }
};
```

### API Endpoints

The monitoring system provides the following API endpoints:

- `GET /api/monitoring/status` - Get monitoring status
- `GET /api/monitoring/metrics/:type?` - Get metrics by type (optional)
- `GET /api/monitoring/alerts` - Get active alerts
- `GET /api/monitoring/maintenance` - Get maintenance schedule
- `POST /api/monitoring/diagnostics` - Run diagnostics
- `POST /api/monitoring/alerts/:id/resolve` - Resolve an alert
- `POST /api/monitoring/maintenance/:id/complete` - Mark maintenance as completed

### WebSocket Events

The monitoring system provides the following WebSocket events:

- `status` - Monitoring status updates
- `metrics` - Metric updates
- `alert` - Alert updates
- `maintenance` - Maintenance schedule updates

### WebSocket Client Example

```javascript
const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
  console.log('Connected to monitoring WebSocket');
  
  // Subscribe to metrics
  socket.send(JSON.stringify({
    type: 'subscribe',
    dataType: 'metrics',
    enabled: true
  }));
  
  // Request current status
  socket.send(JSON.stringify({
    type: 'request',
    dataType: 'status'
  }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'status':
      console.log('Status:', data.data);
      break;
    case 'metrics':
      console.log(`Metrics (${data.metricType}):`, data.data);
      break;
    case 'alert':
      console.log(`Alert (${data.action}):`, data.data);
      break;
    case 'error':
      console.error('Error:', data.error);
      break;
  }
};
```

## Mobile App Integration

The monitoring system integrates with the mobile app to provide real-time monitoring data and alerts. The mobile app can:

1. View system status and metrics
2. Receive alerts and notifications
3. View and manage maintenance schedule
4. Run diagnostics
5. View diagnostic results

## Data Storage

The monitoring system stores data in the following directory structure:

```
data/monitoring/
  ├── metrics/
  │   ├── performance.json
  │   ├── battery.json
  │   ├── usage.json
  │   ├── security.json
  │   └── errors.json
  ├── alerts/
  │   └── alerts.json
  ├── maintenance/
  │   └── schedule.json
  ├── logs/
  │   └── monitoring.log
  └── diagnostics.json
```

## Testing

The monitoring system includes comprehensive tests for all components. Run the tests with:

```bash
npm test -- --testPathPattern=tests/monitoring