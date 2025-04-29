import { TractorConnectionService } from '../../src/services/TractorConnectionService';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock socket.io-client
jest.mock('socket.io-client');
// Create mock socket
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: false
};

// Mock the io function
(io as jest.Mock).mockReturnValue(mockSocket as any);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve())
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true
  }))
}));

describe('TractorConnectionService', () => {
  let service: TractorConnectionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new TractorConnectionService();
  });
  
  describe('connect', () => {
    test('should attempt direct connection first', async () => {
      // Setup mock for successful direct connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        if (event === 'AUTH_SUCCESS') {
          setTimeout(() => callback(), 10);
        }
        return mockSocket;
      });
      
      const result = await service.connect('tractor-123', 'auth-token-123');
      
      // Verify socket.io was initialized with correct URL
      expect(io).toHaveBeenCalledWith('ws://localhost:8080', expect.any(Object));
      
      // Verify authentication was sent
      expect(mockSocket.emit).toHaveBeenCalledWith('AUTH', {
        token: 'auth-token-123',
        tractorId: 'tractor-123'
      });
      
      // Verify result
      expect(result).toEqual({
        success: true,
        connectionType: 'direct',
        connectionQuality: 80
      });
      
      // Verify tractor ID was stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('last_connected_tractor', 'tractor-123');
    });
    
    test('should fall back to cloud connection if direct connection fails', async () => {
      // Setup mock for failed direct connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(new Error('Connection error')), 10);
        }
        return mockSocket;
      });
      
      const result = await service.connect('tractor-123', 'auth-token-123');
      
      // Verify socket.io was initialized
      expect(io).toHaveBeenCalledWith('ws://localhost:8080', expect.any(Object));
      
      // Verify result (cloud connection is mocked to succeed)
      expect(result).toEqual({
        success: true,
        connectionType: 'cloud',
        connectionQuality: 50
      });
    });
    
    test('should return error if both connection methods fail', async () => {
      // Setup mock for failed direct connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(new Error('Connection error')), 10);
        }
        return mockSocket;
      });
      
      // Mock cloud connection to fail
      jest.spyOn(service as any, 'connectCloud').mockResolvedValue({
        success: false,
        error: 'Cloud connection failed'
      });
      
      const result = await service.connect('tractor-123', 'auth-token-123');
      
      // Verify result
      expect(result).toEqual({
        success: false,
        error: 'Failed to connect to tractor via direct or cloud connection'
      });
    });
    
    test('should handle authentication failure', async () => {
      // Setup mock for authentication failure
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        if (event === 'AUTH_FAILED') {
          setTimeout(() => callback('Invalid token'), 10);
        }
        return mockSocket;
      });
      
      // Mock cloud connection to fail
      jest.spyOn(service as any, 'connectCloud').mockResolvedValue({
        success: false,
        error: 'Cloud connection failed'
      });
      
      const result = await service.connect('tractor-123', 'auth-token-123');
      
      // Verify socket.io was initialized
      expect(io).toHaveBeenCalledWith('ws://localhost:8080', expect.any(Object));
      
      // Verify authentication was sent
      expect(mockSocket.emit).toHaveBeenCalledWith('AUTH', {
        token: 'auth-token-123',
        tractorId: 'tractor-123'
      });
      
      // Verify result
      expect(result).toEqual({
        success: false,
        error: 'Failed to connect to tractor via direct or cloud connection'
      });
    });
  });
  
  describe('disconnect', () => {
    test('should disconnect socket if connected', async () => {
      // Setup service with mock socket
      (service as any).socket = mockSocket;
      
      const result = await service.disconnect();
      
      // Verify socket was disconnected
      expect(mockSocket.disconnect).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({ success: true });
    });
    
    test('should return success if not connected', async () => {
      // Service starts with no socket
      const result = await service.disconnect();
      
      // Verify result
      expect(result).toEqual({ success: true });
      
      // Verify socket was not disconnected
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });
  
  describe('sendCommand', () => {
    test('should send command if connected', async () => {
      // Setup service with mock socket
      (service as any).socket = mockSocket;
      (service as any).isConnected = true;
      
      const command = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-123',
        sent: false,
        acknowledged: false
      };
      
      const result = await service.sendCommand(command);
      
      // Verify command was sent
      expect(mockSocket.emit).toHaveBeenCalledWith('MOVE', {
        direction: 'forward',
        speed: 5,
        commandId: 'cmd-123'
      });
      
      // Verify result
      expect(result).toEqual({ success: true });
    });
    
    test('should queue command if not connected', async () => {
      // Setup service as disconnected
      (service as any).isConnected = false;
      
      // Spy on queueCommand method
      const queueSpy = jest.spyOn(service as any, 'queueCommand');
      
      const command = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-123',
        sent: false,
        acknowledged: false
      };
      
      const result = await service.sendCommand(command);
      
      // Verify command was queued
      expect(queueSpy).toHaveBeenCalledWith(command);
      
      // Verify result
      expect(result).toEqual({
        success: false,
        error: 'Not connected to tractor'
      });
    });
    
    test('should generate ID if not provided', async () => {
      // Setup service with mock socket
      (service as any).socket = mockSocket;
      (service as any).isConnected = true;
      
      const command = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: '',
        sent: false,
        acknowledged: false
      };
      
      await service.sendCommand(command);
      
      // Verify command was sent with generated ID
      expect(mockSocket.emit).toHaveBeenCalledWith('MOVE', {
        direction: 'forward',
        speed: 5,
        commandId: expect.any(String)
      });
    });
  });
  
  describe('status updates', () => {
    test('should notify subscribers of status updates', () => {
      // Create mock callback
      const mockCallback = jest.fn();
      
      // Subscribe to status updates
      service.subscribeToStatusUpdates(mockCallback);
      
      // Simulate status update
      const status = {
        batteryLevel: 75,
        speed: 5
      };
      (service as any).notifyStatusUpdate(status);
      
      // Verify callback was called with status
      expect(mockCallback).toHaveBeenCalledWith(status);
    });
  });
  
  describe('reconnection', () => {
    test('should attempt to reconnect when connection is lost', () => {
      // Setup service with mock socket
      (service as any).socket = mockSocket;
      (service as any).isConnected = true;
      (service as any).tractorId = 'tractor-123';
      (service as any).authToken = 'auth-token-123';
      
      // Spy on reconnect method
      const reconnectSpy = jest.spyOn(service as any, 'reconnect');
      
      // Simulate disconnect event
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      
      if (disconnectCallback) {
        disconnectCallback('transport error');
      }
      
      // Verify reconnect was called
      expect(reconnectSpy).toHaveBeenCalled();
    });
    
    test('should not attempt to reconnect when intentionally disconnected', () => {
      // Setup service with mock socket
      (service as any).socket = mockSocket;
      (service as any).isConnected = true;
      
      // Spy on reconnect method
      const reconnectSpy = jest.spyOn(service as any, 'reconnect');
      
      // Simulate disconnect event with "io client disconnect" reason
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      
      if (disconnectCallback) {
        disconnectCallback('io client disconnect');
      }
      
      // Verify reconnect was not called
      expect(reconnectSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('offline functionality', () => {
    test('should queue commands when offline', async () => {
      // Setup service as disconnected
      (service as any).isConnected = false;
      
      // Spy on saveQueuedCommands method
      const saveSpy = jest.spyOn(service as any, 'saveQueuedCommands');
      
      const command = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-123',
        sent: false,
        acknowledged: false
      };
      
      // Queue command
      await (service as any).queueCommand(command);
      
      // Verify command was added to queue
      expect((service as any).queuedCommands).toContain(command);
      
      // Verify queue was saved
      expect(saveSpy).toHaveBeenCalled();
    });
    
    test('should load queued commands on initialization', () => {
      // Mock AsyncStorage.getItem to return queued commands
      const queuedCommands = [
        {
          type: 'move' as const,
          data: { direction: 'forward', speed: 5 },
          timestamp: Date.now(),
          id: 'cmd-123',
          sent: false,
          acknowledged: false
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(queuedCommands));
      
      // Create new service instance (which calls loadQueuedCommands)
      const newService = new TractorConnectionService();
      
      // Verify AsyncStorage.getItem was called
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('queued_commands');
    });
  });
});