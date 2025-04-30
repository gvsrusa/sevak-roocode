/**
 * Sevak Mini Tractor - API Module
 * 
 * Main API module that sets up versioned API routes.
 * Supports multiple API versions with proper routing.
 */

const express = require('express');
const v1Router = require('./v1');

class ApiModule {
  constructor(app, logger) {
    this.app = app;
    this.logger = logger;
    this.router = express.Router();
    this.setupRoutes();
  }

  /**
   * Set up API routes with versioning
   */
  setupRoutes() {
    // Mount v1 API router
    this.router.use('/v1', v1Router);
    
    // API root endpoint
    this.router.get('/', (req, res) => {
      res.json({
        name: 'Sevak Mini Tractor API',
        versions: ['v1'],
        currentVersion: 'v1',
        documentation: '/api/docs'
      });
    });
    
    // API documentation endpoint
    this.router.get('/docs', (req, res) => {
      res.json({
        message: 'API documentation',
        endpoints: {
          v1: {
            status: '/api/v1/status',
            control: '/api/v1/control',
            navigation: '/api/v1/navigation',
            sensors: '/api/v1/sensors',
            safety: '/api/v1/safety',
            monitoring: '/api/v1/monitoring'
          }
        }
      });
    });
  }

  /**
   * Mount the API router on the app
   * @param {string} path - Base path for the API (default: '/api')
   */
  mount(path = '/api') {
    this.app.use(path, this.router);
    this.logger.info(`API mounted at ${path}`);
    return this;
  }
}

module.exports = ApiModule;