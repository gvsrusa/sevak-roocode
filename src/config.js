/**
 * Sevak Mini Tractor - Configuration
 * 
 * Central configuration for the Sevak mini tractor control system.
 */

const config = {
  // System configuration
  system: {
    name: 'Sevak Mini Tractor',
    version: '1.0.0',
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  },
  
  // Sensor configuration
  sensors: {
    updateInterval: 100, // ms
    gps: {
      enabled: true,
      port: '/dev/ttyUSB0',
      baudRate: 9600
    },
    imu: {
      enabled: true,
      updateRate: 100 // Hz
    },
    proximity: {
      enabled: true,
      triggerDistance: 50 // cm
    },
    camera: {
      enabled: true,
      resolution: {
        width: 640,
        height: 480
      },
      frameRate: 30
    }
  },
  
  // Motor configuration
  motors: {
    maxSpeed: 100, // % of maximum
    acceleration: 10, // % per second
    deceleration: 20, // % per second
    leftMotor: {
      pin: 12,
      reverse: false
    },
    rightMotor: {
      pin: 13,
      reverse: false
    }
  },
  
  // Navigation configuration
  navigation: {
    pathPlanningInterval: 500, // ms
    waypointReachedThreshold: 1.0, // meters
    obstacleAvoidanceEnabled: true,
    maxPathDeviationDistance: 5.0, // meters
    boundaries: {
      enabled: true,
      margin: 2.0 // meters
    }
  },
  
  // Safety configuration
  safety: {
    watchdogTimeout: 1000, // ms
    maxIncline: 15, // degrees
    maxSpeed: 5, // m/s
    emergencyStopEnabled: true,
    obstacleSafeDistance: 1.0, // meters
    boundaryEnforcementEnabled: true
  },
  
  // Communication configuration
  communication: {
    mobileApp: {
      enabled: true,
      port: 3000,
      wsPort: 3001,
      authEnabled: true,
      sslEnabled: true,
      sslCert: './certs/server.crt',
      sslKey: './certs/server.key'
    },
    cloud: {
      enabled: false,
      url: 'https://api.sevak.example.com',
      apiKey: process.env.CLOUD_API_KEY || '',
      updateInterval: 60000 // ms
    }
  },
  
  // Monitoring configuration
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
      motor: {
        temperature: {
          warning: 60, // °C
          critical: 70 // °C
        },
        current: {
          warning: 15, // A
          critical: 20 // A
        }
      },
      controller: {
        temperature: {
          warning: 50, // °C
          critical: 60 // °C
        }
      },
      communication: {
        latency: {
          warning: 200, // ms
          critical: 500 // ms
        },
        packetLoss: {
          warning: 5, // %
          critical: 10 // %
        }
      }
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
        {
          id: 'battery-service',
          name: 'Battery Service',
          description: 'Check battery health and connections',
          interval: 200, // hours
          priority: 'normal'
        },
        {
          id: 'sensor-calibration',
          name: 'Sensor Calibration',
          description: 'Calibrate all sensors for accuracy',
          interval: 500, // hours
          priority: 'high'
        }
      ]
    }
  }
};

module.exports = config;