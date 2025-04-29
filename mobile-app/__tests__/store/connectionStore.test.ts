import { act, renderHook } from '@testing-library/react-hooks';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { useConnectionStore } from '../../src/store/connectionStore';
import { TractorConnectionService } from '../../src/services/TractorConnectionService';

// Mock the TractorConnectionService
jest.mock('../../src/services/TractorConnectionService', () => {
  return {
    TractorConnectionService: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      checkConnection: jest.fn(),
      subscribeToStatusUpdates: jest.fn(),
      getConnectionType: jest.fn(),
      getConnectionQuality: jest.fn(),
      sendCommand: jest.fn()
    }))
  };
});

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve())
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

describe('connectionStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useConnectionStore());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.connectionType).toBeNull();
    expect(result.current.connectionQuality).toBe(0);
    expect(result.current.lastConnectedTime).toBeNull();
    expect(result.current.tractorId).toBeNull();
    expect(result.current.tractorStatus).toBeNull();
    expect(result.current.error).toBeNull();
  });

  describe('connectToTractor', () => {
    test('should connect successfully', async () => {
      // Mock SecureStore to return a token
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('auth-token-123');
      
      // Mock successful connection
      const mockConnect = jest.fn().mockResolvedValue({
        success: true,
        connectionType: 'direct',
        connectionQuality: 80
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.connect = mockConnect;
      
      const { result } = renderHook(() => useConnectionStore());
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.connectToTractor('tractor-123');
      });
      
      // Check return value
      expect(success).toBe(true);
      
      // Check state updates
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.connectionType).toBe('direct');
      expect(result.current.connectionQuality).toBe(80);
      expect(result.current.lastConnectedTime).not.toBeNull();
      expect(result.current.tractorId).toBe('tractor-123');
      expect(result.current.error).toBeNull();
      
      // Check connection service was called
      expect(mockConnect).toHaveBeenCalledWith('tractor-123', 'auth-token-123');
      
      // Check subscribeToStatusUpdates was called
      expect(mockConnectionService.subscribeToStatusUpdates).toHaveBeenCalled();
    });
    
    test('should handle missing auth token', async () => {
      // Mock SecureStore to return null (no token)
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      
      const { result } = renderHook(() => useConnectionStore());
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.connectToTractor('tractor-123');
      });
      
      // Check return value
      expect(success).toBe(false);
      
      // Check state updates
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBe('Authentication required');
    });
    
    test('should handle connection failure', async () => {
      // Mock SecureStore to return a token
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('auth-token-123');
      
      // Mock failed connection
      const mockConnect = jest.fn().mockResolvedValue({
        success: false,
        error: 'Connection failed'
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.connect = mockConnect;
      
      const { result } = renderHook(() => useConnectionStore());
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.connectToTractor('tractor-123');
      });
      
      // Check return value
      expect(success).toBe(false);
      
      // Check state updates
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBe('Connection failed');
    });
    
    test('should handle connection errors', async () => {
      // Mock SecureStore to return a token
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('auth-token-123');
      
      // Mock connection throwing an error
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection error'));
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.connect = mockConnect;
      
      const { result } = renderHook(() => useConnectionStore());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.connectToTractor('tractor-123');
      });
      
      // Check return value
      expect(success).toBe(false);
      
      // Check state updates
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBe('Connection error');
      
      // Check error was logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('disconnectFromTractor', () => {
    test('should disconnect successfully', async () => {
      // Mock successful disconnect
      const mockDisconnect = jest.fn().mockResolvedValue({
        success: true
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.disconnect = mockDisconnect;
      
      const { result } = renderHook(() => useConnectionStore());
      
      // First set connected state
      act(() => {
        result.current.updateTractorStatus({
          batteryLevel: 80,
          batteryTimeRemaining: 120,
          speed: 5,
          position: null,
          operationStatus: 'idle',
          currentOperation: null,
          motorTemperature: 35,
          safetyStatus: 'normal',
          alerts: []
        });
      });
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.disconnectFromTractor();
      });
      
      // Check return value
      expect(success).toBe(true);
      
      // Check state updates
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionType).toBeNull();
      expect(result.current.connectionQuality).toBe(0);
      expect(result.current.tractorStatus).toBeNull();
    });
    
    test('should handle disconnect failure', async () => {
      // Mock failed disconnect
      const mockDisconnect = jest.fn().mockResolvedValue({
        success: false,
        error: 'Disconnect failed'
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.disconnect = mockDisconnect;
      
      const { result } = renderHook(() => useConnectionStore());
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.disconnectFromTractor();
      });
      
      // Check return value
      expect(success).toBe(false);
      
      // Check state updates
      expect(result.current.error).toBe('Disconnect failed');
    });
  });
  
  describe('sendCommand', () => {
    test('should send command when connected', async () => {
      // Mock successful command
      const mockSendCommand = jest.fn().mockResolvedValue({
        success: true
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.sendCommand = mockSendCommand;
      
      const { result } = renderHook(() => useConnectionStore());
      
      // Set connected state
      act(() => {
        // @ts-ignore - directly setting state for testing
        result.current.isConnected = true;
      });
      
      const command = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-123',
        sent: false,
        acknowledged: false
      };
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.sendCommand(command);
      });
      
      // Check return value
      expect(success).toBe(true);
      
      // Check command was sent
      expect(mockSendCommand).toHaveBeenCalledWith(command);
    });
    
    test('should queue command when offline', async () => {
      const { result } = renderHook(() => useConnectionStore());
      const alertSpy = jest.spyOn(Alert, 'alert');
      
      // Spy on queueCommand method
      const queueSpy = jest.spyOn(result.current, 'queueCommand');
      
      const command = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-123',
        sent: false,
        acknowledged: false
      };
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.sendCommand(command);
      });
      
      // Check return value
      expect(success).toBe(false);
      
      // Check command was queued
      expect(queueSpy).toHaveBeenCalledWith(command);
      
      // Check alert was shown
      expect(alertSpy).toHaveBeenCalled();
    });
  });
  
  describe('updateTractorStatus', () => {
    test('should update tractor status', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      const status = {
        batteryLevel: 75,
        speed: 5
      };
      
      act(() => {
        result.current.updateTractorStatus(status);
      });
      
      // Check state updates
      expect(result.current.tractorStatus).toEqual({
        batteryLevel: 75,
        batteryTimeRemaining: 0,
        speed: 5,
        position: null,
        operationStatus: 'idle',
        currentOperation: null,
        motorTemperature: 0,
        safetyStatus: 'normal',
        alerts: []
      });
    });
    
    test('should merge with existing status', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      // Set initial status
      act(() => {
        result.current.updateTractorStatus({
          batteryLevel: 80,
          batteryTimeRemaining: 120,
          speed: 0,
          position: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 5
          },
          operationStatus: 'idle',
          currentOperation: null,
          motorTemperature: 35,
          safetyStatus: 'normal',
          alerts: []
        });
      });
      
      // Update partial status
      act(() => {
        result.current.updateTractorStatus({
          speed: 5,
          operationStatus: 'running',
          currentOperation: {
            type: 'harvesting',
            progress: 25,
            estimatedTimeRemaining: 45
          }
        });
      });
      
      // Check state updates
      expect(result.current.tractorStatus).toEqual({
        batteryLevel: 80,
        batteryTimeRemaining: 120,
        speed: 5,
        position: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5
        },
        operationStatus: 'running',
        currentOperation: {
          type: 'harvesting',
          progress: 25,
          estimatedTimeRemaining: 45
        },
        motorTemperature: 35,
        safetyStatus: 'normal',
        alerts: []
      });
    });
  });
  
  describe('checkConnection', () => {
    test('should reconnect to last connected tractor', async () => {
      // Mock SecureStore to return a tractor ID
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('tractor-123');
      
      // Mock successful connection check
      const mockCheckConnection = jest.fn().mockResolvedValue(true);
      const mockGetConnectionType = jest.fn().mockReturnValue('direct');
      const mockGetConnectionQuality = jest.fn().mockReturnValue(80);
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.checkConnection = mockCheckConnection;
      mockConnectionService.getConnectionType = mockGetConnectionType;
      mockConnectionService.getConnectionQuality = mockGetConnectionQuality;
      
      const { result } = renderHook(() => useConnectionStore());
      
      // Spy on processQueuedCommands method
      const processSpy = jest.spyOn(result.current, 'processQueuedCommands');
      
      await act(async () => {
        await result.current.checkConnection();
      });
      
      // Check state updates
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionType).toBe('direct');
      expect(result.current.connectionQuality).toBe(80);
      expect(result.current.tractorId).toBe('tractor-123');
      expect(result.current.lastConnectedTime).not.toBeNull();
      
      // Check connection service was called
      expect(mockCheckConnection).toHaveBeenCalledWith('tractor-123');
      
      // Check subscribeToStatusUpdates was called
      expect(mockConnectionService.subscribeToStatusUpdates).toHaveBeenCalled();
      
      // Check processQueuedCommands was called
      expect(processSpy).toHaveBeenCalled();
    });
    
    test('should handle no last connected tractor', async () => {
      // Mock SecureStore to return null (no tractor ID)
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      
      const { result } = renderHook(() => useConnectionStore());
      
      await act(async () => {
        await result.current.checkConnection();
      });
      
      // Check state remains unchanged
      expect(result.current.isConnected).toBe(false);
      expect(result.current.tractorId).toBeNull();
    });
  });
});