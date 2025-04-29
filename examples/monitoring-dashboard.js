/**
 * Monitoring Dashboard Example
 * 
 * A simple example of how to use the monitoring system API and WebSocket
 * to create a monitoring dashboard.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

// Create Express app
const app = express();
const server = http.createServer(app);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create WebSocket client
const ws = new WebSocket('ws://localhost:3000');

// Store monitoring data
const monitoringData = {
  status: null,
  metrics: {
    performance: [],
    battery: [],
    usage: [],
    security: [],
    errors: []
  },
  alerts: [],
  maintenance: []
};

// Connect to monitoring WebSocket
ws.on('open', () => {
  console.log('Connected to monitoring WebSocket');
  
  // Subscribe to all data types
  ws.send(JSON.stringify({
    type: 'subscribe',
    dataType: 'metrics',
    enabled: true
  }));
  
  ws.send(JSON.stringify({
    type: 'subscribe',
    dataType: 'alert',
    enabled: true
  }));
  
  // Request initial data
  ws.send(JSON.stringify({
    type: 'request',
    dataType: 'status'
  }));
  
  ws.send(JSON.stringify({
    type: 'request',
    dataType: 'metrics',
    metricType: 'all',
    timeRange: 3600000 // 1 hour
  }));
  
  ws.send(JSON.stringify({
    type: 'request',
    dataType: 'alerts',
    includeResolved: false
  }));
  
  ws.send(JSON.stringify({
    type: 'request',
    dataType: 'maintenance'
  }));
});

// Handle WebSocket messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'status':
        monitoringData.status = message.data;
        console.log('Status updated:', message.data);
        break;
        
      case 'metrics':
        if (message.metricType === 'all') {
          // Update all metrics
          Object.keys(message.data).forEach(type => {
            monitoringData.metrics[type] = message.data[type];
          });
        } else {
          // Update specific metric type
          monitoringData.metrics[message.metricType] = message.data;
        }
        console.log(`Metrics updated (${message.metricType})`);
        break;
        
      case 'alert':
        if (message.action === 'new') {
          // Add new alert
          monitoringData.alerts.push(message.data);
          console.log('New alert:', message.data);
        } else if (message.action === 'resolved') {
          // Update resolved alert
          const index = monitoringData.alerts.findIndex(alert => alert.id === message.data.id);
          if (index !== -1) {
            monitoringData.alerts[index] = message.data;
            console.log('Alert resolved:', message.data);
          }
        }
        break;
        
      case 'alerts':
        monitoringData.alerts = message.data;
        console.log('Alerts updated:', message.data.length);
        break;
        
      case 'maintenance':
        monitoringData.maintenance = message.data;
        console.log('Maintenance schedule updated:', message.data.length);
        break;
        
      case 'error':
        console.error('WebSocket error:', message.error);
        break;
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
});

// Handle WebSocket errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle WebSocket close
ws.on('close', () => {
  console.log('Disconnected from monitoring WebSocket');
});

// Create API endpoints
app.get('/api/dashboard/status', (req, res) => {
  res.json(monitoringData.status);
});

app.get('/api/dashboard/metrics/:type?', (req, res) => {
  const type = req.params.type;
  
  if (type && monitoringData.metrics[type]) {
    res.json(monitoringData.metrics[type]);
  } else {
    res.json(monitoringData.metrics);
  }
});

app.get('/api/dashboard/alerts', (req, res) => {
  res.json(monitoringData.alerts);
});

app.get('/api/dashboard/maintenance', (req, res) => {
  res.json(monitoringData.maintenance);
});

// Run diagnostics
app.post('/api/dashboard/diagnostics', (req, res) => {
  // Send diagnostics request to monitoring API
  fetch('http://localhost:3000/api/monitoring/diagnostics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      components: req.body.components || []
    })
  })
  .then(response => response.json())
  .then(data => {
    res.json(data);
  })
  .catch(error => {
    res.status(500).json({ error: error.message });
  });
});

// Resolve alert
app.post('/api/dashboard/alerts/:id/resolve', (req, res) => {
  // Send resolve request to monitoring API
  fetch(`http://localhost:3000/api/monitoring/alerts/${req.params.id}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resolution: req.body.resolution || {}
    })
  })
  .then(response => response.json())
  .then(data => {
    res.json(data);
  })
  .catch(error => {
    res.status(500).json({ error: error.message });
  });
});

// Complete maintenance
app.post('/api/dashboard/maintenance/:id/complete', (req, res) => {
  // Send complete request to monitoring API
  fetch(`http://localhost:3000/api/monitoring/maintenance/${req.params.id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    res.json(data);
  })
  .catch(error => {
    res.status(500).json({ error: error.message });
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Monitoring dashboard server running on port ${PORT}`);
});