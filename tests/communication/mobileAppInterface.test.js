/**
 * Communication protocol tests for MobileAppInterface
 */

const MobileAppInterface = require('../../src/communication/mobileAppInterface');
const eventBus = require('../../src/utils/eventBus');
const WebSocket = require('ws');
const { Server: MockServer } = require('mock-socket');

// Mock dependencies
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/eventBus');
jest.mock('ws');
jest.mock('../../src/config', () => ({
  version: '1.0.0',
  communication: {
    mobileApp: {
      port: 8080,
      authToken: 'test-auth-token'
    }
  }
}));

describe('MobileAppInterface Communication Tests', () => {
  let mobileAppInterface;
  let mockServer;
  let mockWebSocket;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock WebSocket server
    mockServer = {
      on: jest.fn(),
      close: jest.fn((callback) => callback())
    };
    
    // Mock WebSocket.Server constructor
    WebSocket.Server = jest.fn().mockImplementation(() => mockServer);
    
    // Create mock WebSocket client
    mockWebSocket = {
      on: jest.fn(),
      send: jest.fn(),
      readyState: WebSocket.OPEN
    };
    
    // Create a new instance for each test
    mobileAppInterface = new MobileAppInterface();
  });
  
  afterEach(() => {
    // Clean up
    if (mobileAppInterface) {
      mobileAppInterface.shutdown();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize WebSocket server successfully', async () => {
      // Execute
      const result = await mobileAppInterface.initialize();
      
      // Verify
      expect(result).toBe(true);
      expect(WebSocket.Server).toHaveBeenCalledWith({
        port: 8080,
        clientTracking: true
      });
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockServer.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockServer.on).toHaveBeenCalledWith('listening', expect.any(Function));
    });
    
    test('should handle initialization failure', async () => {
      // Setup - make WebSocket.Server throw an error
      WebSocket.Server.mockImplementation(() => {
        throw new Error('Failed to start server');
      });
      
      // Execute and verify
      await expect(mobileAppInterface.initialize()).resolves.toBe(false);
    });
  });
  
  describe('Connection Handling', () => {
    test('should handle new client connection', () => {
      // Setup
      const req = { socket: { remoteAddress: '127.0.0.1' } };
      mobileAppInterface.initialize();
      
      // Get connection handler
      const connectionHandler = mockServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      // Execute connection handler
      connectionHandler(mockWebSocket, req);
      
      // Verify
      expect(mobileAppInterface.clients.size).toBe(1);
      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
      
      // Verify welcome message was sent
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('WELCOME')
      );
    });
    
    test('should handle client disconnection', () => {
      // Setup
      const req = { socket: { remoteAddress: '127.0.0.1' } };
      mobileAppInterface.initialize();
      
      // Get connection handler
      const connectionHandler = mockServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      // Execute connection handler
      connectionHandler(mockWebSocket, req);
      
      // Get close handler
      const closeHandler = mockWebSocket.on.mock.calls.find(
        call => call[0] === 'close'
      )[1];
      
      // Execute close handler
      closeHandler();
      
      // Verify
      expect(mobileAppInterface.clients.size).toBe(0);
    });
  });
  
  describe('Message Handling', () => {
    let messageHandler;
    
    beforeEach(() => {
      // Setup
      const req = { socket: { remoteAddress: '127.0.0.1' } };
      mobileAppInterface.initialize();
      
      // Get connection handler
      const connectionHandler = mockServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      // Execute connection handler
      connectionHandler(mockWebSocket, req);
      
      // Get message handler
      messageHandler = mockWebSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
    });
    
    test('should handle authentication message', () => {
      // Setup
      const message = JSON.stringify({
        type: 'AUTH',
        data: {
          token: 'test-auth-token'
        }
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('AUTH_SUCCESS')
      );
      
      // Verify client is authenticated
      expect(mobileAppInterface.authTokens.size).toBe(1);
    });
    
    test('should reject invalid authentication token', () => {
      // Setup
      const message = JSON.stringify({
        type: 'AUTH',
        data: {
          token: 'invalid-token'
        }
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('INVALID_TOKEN')
      );
      
      // Verify client is not authenticated
      expect(mobileAppInterface.authTokens.size).toBe(0);
    });
    
    test('should reject commands from unauthenticated clients', () => {
      // Setup
      const message = JSON.stringify({
        type: 'MOVE',
        data: {
          speed: 1.0,
          direction: 0.0
        }
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('UNAUTHORIZED')
      );
      
      // Verify command was not processed
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
    
    test('should handle MOVE command from authenticated client', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Setup MOVE command
      const message = JSON.stringify({
        type: 'MOVE',
        data: {
          speed: 1.0,
          direction: 0.0
        }
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('COMMAND_ACCEPTED')
      );
      
      // Verify command was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'command.move',
        expect.objectContaining({
          speed: 1.0,
          direction: 0.0
        })
      );
    });
    
    test('should handle NAVIGATE command from authenticated client', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Setup NAVIGATE command
      const waypoints = [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 10, y: 10, z: 0 }
      ];
      
      const message = JSON.stringify({
        type: 'NAVIGATE',
        data: {
          waypoints: waypoints
        }
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('COMMAND_ACCEPTED')
      );
      
      // Verify command was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'command.navigate',
        expect.objectContaining({
          waypoints: waypoints
        })
      );
    });
    
    test('should handle STOP command from authenticated client', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Setup STOP command
      const message = JSON.stringify({
        type: 'STOP',
        data: {}
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('COMMAND_ACCEPTED')
      );
      
      // Verify command was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'command.stop',
        expect.any(Object)
      );
    });
    
    test('should handle EMERGENCY_STOP command from authenticated client', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Setup EMERGENCY_STOP command
      const message = JSON.stringify({
        type: 'EMERGENCY_STOP',
        data: {
          reason: 'User initiated emergency stop'
        }
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('COMMAND_ACCEPTED')
      );
      
      // Verify command was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'command.emergencyStop',
        expect.objectContaining({
          reason: 'User initiated emergency stop',
          source: 'mobileApp'
        })
      );
    });
    
    test('should handle GET_STATUS command from authenticated client', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Mock status requests
      const navigationStatus = { position: { x: 0, y: 0, z: 0 } };
      const motorStatus = { speed: 1.0 };
      const sensorStatus = { gps: { connected: true } };
      const safetyStatus = { emergencyStopActive: false };
      
      eventBus.request.mockImplementation((type) => {
        if (type === 'navigation.getStatus') {
          return Promise.resolve(navigationStatus);
        } else if (type === 'motor.getStatus') {
          return Promise.resolve(motorStatus);
        } else if (type === 'sensor.getStatus') {
          return Promise.resolve(sensorStatus);
        } else if (type === 'safety.getStatus') {
          return Promise.resolve(safetyStatus);
        }
        return Promise.reject(new Error('Unknown request type'));
      });
      
      // Setup GET_STATUS command
      const message = JSON.stringify({
        type: 'GET_STATUS',
        data: {}
      });
      
      // Execute
      return new Promise(resolve => {
        // Mock send to capture async response
        mockWebSocket.send = jest.fn(response => {
          // Verify
          const parsedResponse = JSON.parse(response);
          expect(parsedResponse.type).toBe('STATUS');
          expect(parsedResponse.data.navigation).toEqual(navigationStatus);
          expect(parsedResponse.data.motor).toEqual(motorStatus);
          expect(parsedResponse.data.sensor).toEqual(sensorStatus);
          expect(parsedResponse.data.safety).toEqual(safetyStatus);
          resolve();
        });
        
        messageHandler(message);
      });
    });
    
    test('should handle SET_BOUNDARIES command from authenticated client', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Setup SET_BOUNDARIES command
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 10, y: 10, z: 0 },
        { x: 0, y: 10, z: 0 }
      ];
      
      const message = JSON.stringify({
        type: 'SET_BOUNDARIES',
        data: {
          points: points
        }
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('COMMAND_ACCEPTED')
      );
      
      // Verify command was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'command.setBoundaries',
        expect.objectContaining({
          points: points
        })
      );
    });
    
    test('should reject invalid message format', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Setup invalid message
      const message = JSON.stringify({
        type: 'MOVE'
        // Missing data field
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('INVALID_FORMAT')
      );
    });
    
    test('should handle unknown command type', () => {
      // Setup - authenticate client first
      messageHandler(JSON.stringify({
        type: 'AUTH',
        data: { token: 'test-auth-token' }
      }));
      
      // Clear previous calls
      mockWebSocket.send.mockClear();
      
      // Setup unknown command
      const message = JSON.stringify({
        type: 'UNKNOWN_COMMAND',
        data: {}
      });
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('UNKNOWN_COMMAND')
      );
    });
    
    test('should handle JSON parse errors', () => {
      // Setup
      const message = 'invalid json';
      
      // Execute
      messageHandler(message);
      
      // Verify
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('INTERNAL_ERROR')
      );
    });
  });
  
  describe('Event Broadcasting', () => {
    let authenticatedClient;
    
    beforeEach(() => {
      // Setup
      mobileAppInterface.initialize();
      
      // Create authenticated client
      authenticatedClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn()
      };
      
      // Add to authenticated clients
      mobileAppInterface.authTokens.set('test-session-token', authenticatedClient);
    });
    
    test('should broadcast navigation status to authenticated clients', () => {
      // Setup
      const navigationStatus = {
        position: { x: 0, y: 0, z: 0 },
        orientation: { roll: 0, pitch: 0, yaw: 0 },
        timestamp: Date.now()
      };
      
      // Execute
      mobileAppInterface._broadcastEvent('NAVIGATION_STATUS', navigationStatus);
      
      // Verify
      expect(authenticatedClient.send).toHaveBeenCalledWith(
        expect.stringContaining('NAVIGATION_STATUS')
      );
      
      // Parse the sent message
      const sentMessage = JSON.parse(authenticatedClient.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('NAVIGATION_STATUS');
      expect(sentMessage.data).toEqual(navigationStatus);
    });
    
    test('should broadcast motor status to authenticated clients', () => {
      // Setup
      const motorStatus = {
        speed: 1.0,
        direction: 0.0,
        timestamp: Date.now()
      };
      
      // Execute
      mobileAppInterface._broadcastEvent('MOTOR_STATUS', motorStatus);
      
      // Verify
      expect(authenticatedClient.send).toHaveBeenCalledWith(
        expect.stringContaining('MOTOR_STATUS')
      );
    });
    
    test('should broadcast safety status to authenticated clients', () => {
      // Setup
      const safetyStatus = {
        emergencyStopActive: false,
        timestamp: Date.now()
      };
      
      // Execute
      mobileAppInterface._broadcastEvent('SAFETY_STATUS', safetyStatus);
      
      // Verify
      expect(authenticatedClient.send).toHaveBeenCalledWith(
        expect.stringContaining('SAFETY_STATUS')
      );
    });
    
    test('should not broadcast to unauthenticated clients', () => {
      // Setup
      const unauthenticatedClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn()
      };
      
      // Add to clients but not to authTokens
      mobileAppInterface.clients.add(unauthenticatedClient);
      
      // Execute
      mobileAppInterface._broadcastEvent('NAVIGATION_STATUS', { timestamp: Date.now() });
      
      // Verify
      expect(unauthenticatedClient.send).not.toHaveBeenCalled();
      expect(authenticatedClient.send).toHaveBeenCalled();
    });
    
    test('should handle closed connections when broadcasting', () => {
      // Setup
      authenticatedClient.readyState = WebSocket.CLOSED;
      
      // Execute
      mobileAppInterface._broadcastEvent('NAVIGATION_STATUS', { timestamp: Date.now() });
      
      // Verify - should not throw an error
      expect(authenticatedClient.send).not.toHaveBeenCalled();
    });
  });
  
  describe('Shutdown', () => {
    test('should close WebSocket server and clean up resources', async () => {
      // Setup
      await mobileAppInterface.initialize();
      
      // Execute
      const result = await mobileAppInterface.shutdown();
      
      // Verify
      expect(result).toBe(true);
      expect(mockServer.close).toHaveBeenCalled();
      expect(mobileAppInterface.isConnected).toBe(false);
      expect(mobileAppInterface.clients.size).toBe(0);
      expect(mobileAppInterface.authTokens.size).toBe(0);
    });
    
    test('should handle shutdown errors', async () => {
      // Setup
      await mobileAppInterface.initialize();
      
      // Make close throw an error
      mockServer.close = jest.fn((callback) => callback(new Error('Close error')));
      
      // Execute and verify
      await expect(mobileAppInterface.shutdown()).rejects.toThrow('Close error');
    });
  });
});