/**
 * System Integration Test for Sevak Mini Tractor
 * 
 * This test verifies the complete system functionality, including:
 * - Autonomous navigation
 * - Fodder operations
 * - Remote control
 * - Safety systems
 * - Sensor integration
 */

const MobileAppInterface = require('../../../src/communication/mobileAppInterface');
const MotorController = require('../../../src/motors/motorController');
const NavigationSystem = require('../../../src/navigation/navigationSystem');
const SafetyMonitor = require('../../../src/safety/safetyMonitor');
const SensorManager = require('../../../src/sensors/sensorManager');
const eventBus = require('../../../src/utils/eventBus');
const SecurityManager = require('../../../src/utils/security');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../../../src/config');

// Test configuration
const TEST_PORT = 8082; // Use a different port for testing
const TEST_HOST = 'localhost';
const TEST_URL = `wss://${TEST_HOST}:${TEST_PORT}`;

// Override config for testing
config.communication.mobileApp.port = TEST_PORT;

// Test certificates
const CA_CERT_PATH = path.resolve(__dirname, '../../../certs/ca.crt');
const CLIENT_CERT_PATH = path.resolve(__dirname, '../../../certs/clients/client1.crt');
const CLIENT_KEY_PATH = path.resolve(__dirname, '../../../certs/clients/client1.key');

describe('Sevak Mini Tractor System Integration Tests', () => {
  let mobileAppInterface;
  let motorController;
  let navigationSystem;
  let safetyMonitor;
  let sensorManager;
  let securityManager;
  let wsClient;
  let sessionToken;
  
  // Load certificates
  const caCert = fs.readFileSync(CA_CERT_PATH);
  const clientCert = fs.readFileSync(CLIENT_CERT_PATH);
  const clientKey = fs.readFileSync(CLIENT_KEY_PATH);
  
  beforeAll(async () => {
    // Initialize all system components
    securityManager = new SecurityManager();
    await securityManager.initialize();
    
    sensorManager = new SensorManager();
    await sensorManager.initialize();
    
    motorController = new MotorController();
    await motorController.initialize();
    
    navigationSystem = new NavigationSystem();
    await navigationSystem.initialize();
    
    safetyMonitor = new SafetyMonitor();
    await safetyMonitor.initialize();
    
    mobileAppInterface = new MobileAppInterface();
    await mobileAppInterface.initialize();
    
    // Create WebSocket client with certificates
    const httpsAgent = new https.Agent({
      ca: caCert,
      cert: clientCert,
      key: clientKey,
      rejectUnauthorized: true
    });
    
    // Connect WebSocket client
    return new Promise((resolve) => {
      wsClient = new WebSocket(TEST_URL, {
        agent: httpsAgent,
        rejectUnauthorized: true,
        ca: caCert,
        cert: clientCert,
        key: clientKey
      });
      
      wsClient.on('open', () => {
        resolve();
      });
      
      wsClient.on('error', (error) => {
        console.error('WebSocket client error:', error);
        resolve();
      });
    });
  });
  
  afterAll(async () => {
    // Clean up
    if (wsClient) {
      wsClient.close();
    }
    
    await mobileAppInterface.shutdown();
    await navigationSystem.shutdown();
    await motorController.shutdown();
    await sensorManager.shutdown();
    await safetyMonitor.shutdown();
  });
  
  // Helper function to send a message and wait for a response
  const sendMessageAndWaitForResponse = (message, expectedResponseType) => {
    return new Promise((resolve) => {
      const messageHandler = (response) => {
        const parsedResponse = JSON.parse(response);
        
        if (parsedResponse.type === expectedResponseType) {
          wsClient.removeEventListener('message', messageHandler);
          resolve(parsedResponse);
        }
      };
      
      wsClient.addEventListener('message', messageHandler);
      wsClient.send(JSON.stringify(message));
    });
  };
  
  test('should authenticate and establish secure connection', async () => {
    // Wait for welcome message
    const welcomeResponse = await new Promise((resolve) => {
      wsClient.once('message', (message) => {
        resolve(JSON.parse(message));
      });
    });
    
    expect(welcomeResponse.type).toBe('WELCOME');
    expect(welcomeResponse.data.requiresAuth).toBe(true);
    
    // Send authentication message
    const authResponse = await sendMessageAndWaitForResponse({
      type: 'AUTH',
      data: {
        clientId: welcomeResponse.data.clientId
      },
      id: 'auth-1',
      timestamp: Date.now()
    }, 'AUTH_SUCCESS');
    
    expect(authResponse.data.sessionToken).toBeDefined();
    sessionToken = authResponse.data.sessionToken;
  });
  
  test('should control tractor movement remotely', async () => {
    // Send MOVE command
    const moveResponse = await sendMessageAndWaitForResponse({
      type: 'MOVE',
      data: {
        speed: 0.5,
        direction: 0
      },
      id: 'move-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(moveResponse.data.command).toBe('MOVE');
    
    // Wait for motor status update
    const motorStatusResponse = await new Promise((resolve) => {
      const messageHandler = (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'MOTOR_STATUS') {
          wsClient.removeEventListener('message', messageHandler);
          resolve(parsedMessage);
        }
      };
      
      wsClient.addEventListener('message', messageHandler);
    });
    
    expect(motorStatusResponse.data.speed).toBe(0.5);
    expect(motorStatusResponse.data.direction).toBe(0);
    
    // Send STOP command
    const stopResponse = await sendMessageAndWaitForResponse({
      type: 'STOP',
      data: {},
      id: 'stop-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(stopResponse.data.command).toBe('STOP');
    
    // Wait for motor status update showing stopped
    const stopStatusResponse = await new Promise((resolve) => {
      const messageHandler = (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'MOTOR_STATUS' && parsedMessage.data.speed === 0) {
          wsClient.removeEventListener('message', messageHandler);
          resolve(parsedMessage);
        }
      };
      
      wsClient.addEventListener('message', messageHandler);
    });
    
    expect(stopStatusResponse.data.speed).toBe(0);
  });
  
  test('should execute autonomous navigation', async () => {
    // Define waypoints for navigation
    const waypoints = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 10, y: 10, z: 0 },
      { x: 0, y: 10, z: 0 },
      { x: 0, y: 0, z: 0 }
    ];
    
    // Send NAVIGATE command
    const navigateResponse = await sendMessageAndWaitForResponse({
      type: 'NAVIGATE',
      data: {
        waypoints: waypoints
      },
      id: 'navigate-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(navigateResponse.data.command).toBe('NAVIGATE');
    
    // Wait for navigation status update
    const navigationStatusResponse = await new Promise((resolve) => {
      const messageHandler = (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'NAVIGATION_STATUS') {
          wsClient.removeEventListener('message', messageHandler);
          resolve(parsedMessage);
        }
      };
      
      wsClient.addEventListener('message', messageHandler);
      
      // Simulate navigation status update
      eventBus.publish('navigation.status.updated', {
        position: { x: 5, y: 2.5, z: 0 },
        orientation: { roll: 0, pitch: 0, yaw: 45 },
        speed: 0.5,
        currentWaypoint: 1,
        totalWaypoints: waypoints.length,
        timestamp: Date.now()
      });
    });
    
    expect(navigationStatusResponse.data.position).toBeDefined();
    expect(navigationStatusResponse.data.currentWaypoint).toBe(1);
    
    // Send STOP command to stop navigation
    await sendMessageAndWaitForResponse({
      type: 'STOP',
      data: {},
      id: 'stop-2',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
  });
  
  test('should control fodder operations', async () => {
    // Start cutter
    const startCutterResponse = await sendMessageAndWaitForResponse({
      type: 'CONTROL_IMPLEMENT',
      data: {
        implement: 'cutter',
        action: 'start',
        parameters: {
          height: 15,
          speed: 2500
        }
      },
      id: 'cutter-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(startCutterResponse.data.command).toBe('CONTROL_IMPLEMENT');
    
    // Simulate implement status update
    eventBus.publish('implements.status.updated', {
      cutter: {
        status: 'running',
        height: 15,
        speed: 2500
      },
      loader: {
        status: 'idle'
      },
      container: {
        status: 'idle',
        fillLevel: 0
      },
      timestamp: Date.now()
    });
    
    // Start loader
    const startLoaderResponse = await sendMessageAndWaitForResponse({
      type: 'CONTROL_IMPLEMENT',
      data: {
        implement: 'loader',
        action: 'start',
        parameters: {
          mode: 'normal'
        }
      },
      id: 'loader-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(startLoaderResponse.data.command).toBe('CONTROL_IMPLEMENT');
    
    // Simulate implement status update
    eventBus.publish('implements.status.updated', {
      cutter: {
        status: 'running',
        height: 15,
        speed: 2500
      },
      loader: {
        status: 'running',
        mode: 'normal'
      },
      container: {
        status: 'idle',
        fillLevel: 0.5
      },
      timestamp: Date.now()
    });
    
    // Unload container
    const unloadContainerResponse = await sendMessageAndWaitForResponse({
      type: 'CONTROL_IMPLEMENT',
      data: {
        implement: 'container',
        action: 'unload',
        parameters: {
          tiltAngle: 45
        }
      },
      id: 'container-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(unloadContainerResponse.data.command).toBe('CONTROL_IMPLEMENT');
    
    // Simulate implement status update
    eventBus.publish('implements.status.updated', {
      cutter: {
        status: 'running',
        height: 15,
        speed: 2500
      },
      loader: {
        status: 'running',
        mode: 'normal'
      },
      container: {
        status: 'unloading',
        fillLevel: 0.2,
        tiltAngle: 45
      },
      timestamp: Date.now()
    });
    
    // Stop all implements
    const stopImplementsResponse = await sendMessageAndWaitForResponse({
      type: 'CONTROL_IMPLEMENT',
      data: {
        implement: 'all',
        action: 'stop'
      },
      id: 'implements-stop-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(stopImplementsResponse.data.command).toBe('CONTROL_IMPLEMENT');
    
    // Simulate implement status update
    eventBus.publish('implements.status.updated', {
      cutter: {
        status: 'idle',
        height: 15,
        speed: 0
      },
      loader: {
        status: 'idle',
        mode: 'normal'
      },
      container: {
        status: 'idle',
        fillLevel: 0,
        tiltAngle: 0
      },
      timestamp: Date.now()
    });
  });
  
  test('should handle safety critical operations', async () => {
    // Set field boundaries
    const boundaries = [
      { x: -50, y: -50, z: 0 },
      { x: 50, y: -50, z: 0 },
      { x: 50, y: 50, z: 0 },
      { x: -50, y: 50, z: 0 }
    ];
    
    const setBoundariesResponse = await sendMessageAndWaitForResponse({
      type: 'SET_BOUNDARIES',
      data: {
        points: boundaries
      },
      id: 'boundaries-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(setBoundariesResponse.data.command).toBe('SET_BOUNDARIES');
    
    // Simulate boundary violation
    eventBus.publish('navigation.boundaryViolation', {
      position: { x: 51, y: 0, z: 0 },
      boundary: {
        index: 1,
        point1: boundaries[1],
        point2: boundaries[2]
      },
      distance: 1,
      timestamp: Date.now()
    });
    
    // Wait for boundary violation notification
    const boundaryViolationResponse = await new Promise((resolve) => {
      const messageHandler = (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'BOUNDARY_VIOLATION') {
          wsClient.removeEventListener('message', messageHandler);
          resolve(parsedMessage);
        }
      };
      
      wsClient.addEventListener('message', messageHandler);
    });
    
    expect(boundaryViolationResponse.type).toBe('BOUNDARY_VIOLATION');
    expect(boundaryViolationResponse.data.position).toBeDefined();
    
    // Send emergency stop
    const emergencyStopResponse = await sendMessageAndWaitForResponse({
      type: 'EMERGENCY_STOP',
      data: {
        reason: 'Boundary violation'
      },
      id: 'emergency-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(emergencyStopResponse.data.command).toBe('EMERGENCY_STOP');
    
    // Wait for safety status update
    const safetyStatusResponse = await new Promise((resolve) => {
      const messageHandler = (message) => {
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'SAFETY_STATUS' && parsedMessage.data.emergencyStopActive === true) {
          wsClient.removeEventListener('message', messageHandler);
          resolve(parsedMessage);
        }
      };
      
      wsClient.addEventListener('message', messageHandler);
      
      // Simulate safety status update
      eventBus.publish('safety.status.updated', {
        emergencyStopActive: true,
        emergencyStopReason: 'Boundary violation',
        safetySystemsActive: true,
        warnings: ['Tractor outside defined boundaries'],
        timestamp: Date.now()
      });
    });
    
    expect(safetyStatusResponse.data.emergencyStopActive).toBe(true);
    
    // Reset emergency stop
    const resetEmergencyResponse = await sendMessageAndWaitForResponse({
      type: 'RESET_EMERGENCY',
      data: {},
      id: 'reset-emergency-1',
      timestamp: Date.now()
    }, 'COMMAND_ACCEPTED');
    
    expect(resetEmergencyResponse.data.command).toBe('RESET_EMERGENCY');
    
    // Simulate safety status update
    eventBus.publish('safety.status.updated', {
      emergencyStopActive: false,
      safetySystemsActive: true,
      warnings: [],
      timestamp: Date.now()
    });
  });
  
  test('should get complete system status', async () => {
    // Send GET_STATUS command
    const statusResponse = await sendMessageAndWaitForResponse({
      type: 'GET_STATUS',
      data: {},
      id: 'status-1',
      timestamp: Date.now()
    }, 'STATUS');
    
    // Verify all status components are present
    expect(statusResponse.data.navigation).toBeDefined();
    expect(statusResponse.data.motor).toBeDefined();
    expect(statusResponse.data.sensor).toBeDefined();
    expect(statusResponse.data.safety).toBeDefined();
    expect(statusResponse.data.implements).toBeDefined();
    expect(statusResponse.data.battery).toBeDefined();
    expect(statusResponse.data.system).toBeDefined();
  });
});