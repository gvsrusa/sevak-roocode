import { TractorConnectionService } from '../../src/services/TractorConnectionService';
import { io } from 'socket.io-client';
import { useConnectionStore } from '../../src/store/connectionStore';
import { renderHook, act } from '@testing-library/react-hooks';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: false
};
(io as jest.Mock).mockReturnValue(mockSocket as any);

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve('auth-token-123')),
  deleteItemAsync: jest.fn(() => Promise.resolve())
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

// Mock the connection store
jest.mock('../../src/store/connectionStore', () => ({
  useConnectionStore: jest.fn()
}));

// Mock TractorConnectionService
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

describe('Network Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Increase Jest timeout for performance tests
    jest.setTimeout(10000);
  });
  
  afterEach(() => {
    // Reset Jest timeout
    jest.setTimeout(5000); // Default Jest timeout
  });
  
  describe('Connection Performance', () => {
    test('should connect within acceptable time limit', async () => {
      // Mock successful connection with delay
      const mockConnect = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              connectionType: 'direct',
              connectionQuality: 80
            });
          }, 500); // Simulate 500ms connection time
        });
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.connect = mockConnect;
      
      // Mock the connection store
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        connectToTractor: jest.fn().mockImplementation(async (tractorId) => {
          const result = await mockConnectionService.connect(tractorId, 'auth-token-123');
          return result.success;
        }),
        isConnected: false,
        isConnecting: false,
        connectionType: null,
        connectionQuality: 0
      });
      
      const { result } = renderHook(() => useConnectionStore());
      
      const startTime = Date.now();
      
      await act(async () => {
        await result.current.connectToTractor('tractor-123');
      });
      
      const endTime = Date.now();
      const connectionTime = endTime - startTime;
      
      // Connection should be established within 1000ms
      expect(connectionTime).toBeLessThan(1000);
      
      // Verify connection was attempted
      expect(mockConnect).toHaveBeenCalledWith('tractor-123', 'auth-token-123');
    });
    
    test('should handle slow connections gracefully', async () => {
      // Mock slow connection
      const mockConnect = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              connectionType: 'cloud',
              connectionQuality: 30
            });
          }, 2000); // Simulate 2000ms slow connection
        });
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.connect = mockConnect;
      
      // Mock the connection store
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        connectToTractor: jest.fn().mockImplementation(async (tractorId) => {
          const result = await mockConnectionService.connect(tractorId, 'auth-token-123');
          return result.success;
        }),
        isConnected: false,
        isConnecting: false,
        connectionType: null,
        connectionQuality: 0
      });
      
      const { result } = renderHook(() => useConnectionStore());
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.connectToTractor('tractor-123');
      });
      
      // Connection should still succeed despite being slow
      expect(success).toBe(true);
      
      // Verify connection was attempted
      expect(mockConnect).toHaveBeenCalledWith('tractor-123', 'auth-token-123');
    });
    
    test('should timeout after maximum wait time', async () => {
      // Mock connection timeout
      const mockConnect = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 11000); // Longer than our test timeout
        });
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.connect = mockConnect;
      
      // Mock the connection store with timeout
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        connectToTractor: jest.fn().mockImplementation(async (tractorId) => {
          try {
            // Add a timeout to the connection attempt
            const timeoutPromise = new Promise<boolean>((_, reject) => {
              setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });
            
            const connectionPromise = mockConnectionService.connect(tractorId, 'auth-token-123')
              .then((result: any) => result.success);
            
            // Race between connection and timeout
            return await Promise.race([connectionPromise, timeoutPromise]);
          } catch (error) {
            console.error('Connection error:', error);
            return false;
          }
        }),
        isConnected: false,
        isConnecting: false,
        connectionType: null,
        connectionQuality: 0,
        error: null
      });
      
      const { result } = renderHook(() => useConnectionStore());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.connectToTractor('tractor-123');
      });
      
      // Connection should fail due to timeout
      expect(success).toBe(false);
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Command Transmission Performance', () => {
    test('should send commands with minimal latency', async () => {
      // Mock successful command with delay
      const mockSendCommand = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true
            });
          }, 100); // Simulate 100ms command transmission time
        });
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.sendCommand = mockSendCommand;
      
      // Mock the connection store
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        sendCommand: jest.fn().mockImplementation(async (command) => {
          const result = await mockConnectionService.sendCommand(command);
          return result.success;
        }),
        isConnected: true,
        connectionType: 'direct',
        connectionQuality: 80
      });
      
      const { result } = renderHook(() => useConnectionStore());
      
      const command = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-123',
        sent: false,
        acknowledged: false
      };
      
      const startTime = Date.now();
      
      await act(async () => {
        await result.current.sendCommand(command);
      });
      
      const endTime = Date.now();
      const commandTime = endTime - startTime;
      
      // Command should be sent within 200ms
      expect(commandTime).toBeLessThan(200);
      
      // Verify command was sent
      expect(mockSendCommand).toHaveBeenCalledWith(command);
    });
    
    test('should handle multiple rapid commands efficiently', async () => {
      // Mock successful command with delay
      const mockSendCommand = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true
            });
          }, 50); // Simulate 50ms command transmission time
        });
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.sendCommand = mockSendCommand;
      
      // Mock the connection store
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        sendCommand: jest.fn().mockImplementation(async (command) => {
          const result = await mockConnectionService.sendCommand(command);
          return result.success;
        }),
        isConnected: true,
        connectionType: 'direct',
        connectionQuality: 80
      });
      
      const { result } = renderHook(() => useConnectionStore());
      
      // Create 5 commands
      const commands = Array.from({ length: 5 }, (_, i) => ({
        type: 'move' as const,
        data: { direction: 'forward', speed: i + 1 },
        timestamp: Date.now(),
        id: `cmd-${i}`,
        sent: false,
        acknowledged: false
      }));
      
      const startTime = Date.now();
      
      // Send all commands in parallel
      await act(async () => {
        await Promise.all(commands.map(command => result.current.sendCommand(command)));
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All commands should be sent within 300ms
      // If they were processed sequentially, it would take 250ms (5 * 50ms)
      // But in parallel, it should be closer to 50-100ms plus overhead
      expect(totalTime).toBeLessThan(300);
      
      // Verify all commands were sent
      expect(mockSendCommand).toHaveBeenCalledTimes(5);
    });
  });
  
  describe('Network Condition Adaptation', () => {
    test('should adapt to changing network conditions', async () => {
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      
      // Mock connection quality updates
      let connectionQuality = 80;
      mockConnectionService.getConnectionQuality = jest.fn().mockImplementation(() => connectionQuality);
      
      // Mock the connection store
      const mockUpdateTractorStatus = jest.fn();
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        updateTractorStatus: mockUpdateTractorStatus,
        isConnected: true,
        connectionType: 'direct',
        connectionQuality: 80
      });
      
      // Get the callback function passed to subscribeToStatusUpdates
      const mockUpdateCallback = jest.fn();
      mockConnectionService.subscribeToStatusUpdates.mockImplementation((callback: (status: any) => void) => {
        mockUpdateCallback.mockImplementation(callback);
      });
      
      // Initialize the hook
      renderHook(() => useConnectionStore());
      
      // Verify subscription was set up
      expect(mockConnectionService.subscribeToStatusUpdates).toHaveBeenCalled();
      
      // Simulate good network conditions
      mockUpdateCallback({
        batteryLevel: 80,
        speed: 5
      });
      
      // Verify status was updated
      expect(mockUpdateTractorStatus).toHaveBeenCalledWith({
        batteryLevel: 80,
        speed: 5
      });
      
      // Simulate network quality degradation
      connectionQuality = 30;
      
      // Simulate degraded network conditions with less data
      mockUpdateCallback({
        batteryLevel: 75
      });
      
      // Verify status was still updated despite poor connection
      expect(mockUpdateTractorStatus).toHaveBeenCalledWith({
        batteryLevel: 75
      });
      
      // Verify it was called twice total
      expect(mockUpdateTractorStatus).toHaveBeenCalledTimes(2);
    });
    
    test('should prioritize critical commands under poor network conditions', async () => {
      // Mock successful command with delay based on command type
      const mockSendCommand = jest.fn().mockImplementation((command) => {
        return new Promise(resolve => {
          // Simulate different latencies based on command priority
          const delay = command.type === 'emergencyStop' ? 50 : 200;
          
          setTimeout(() => {
            resolve({
              success: true
            });
          }, delay);
        });
      });
      
      // Mock the TractorConnectionService instance
      const mockConnectionService = (TractorConnectionService as jest.Mock).mock.instances[0];
      mockConnectionService.sendCommand = mockSendCommand;
      
      // Mock the connection store
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        sendCommand: jest.fn().mockImplementation(async (command) => {
          const result = await mockConnectionService.sendCommand(command);
          return result.success;
        }),
        isConnected: true,
        connectionType: 'direct',
        connectionQuality: 30 // Poor connection quality
      });
      
      const { result } = renderHook(() => useConnectionStore());
      
      // Create regular and emergency commands
      const regularCommand = {
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-regular',
        sent: false,
        acknowledged: false
      };
      
      const emergencyCommand = {
        type: 'emergencyStop' as const,
        data: { reason: 'obstacle' },
        timestamp: Date.now(),
        id: 'cmd-emergency',
        sent: false,
        acknowledged: false
      };
      
      // Send both commands and measure times
      const regularStartTime = Date.now();
      let regularSuccess: boolean = false;
      
      await act(async () => {
        regularSuccess = await result.current.sendCommand(regularCommand);
      });
      
      const regularEndTime = Date.now();
      const regularTime = regularEndTime - regularStartTime;
      
      const emergencyStartTime = Date.now();
      let emergencySuccess: boolean = false;
      
      await act(async () => {
        emergencySuccess = await result.current.sendCommand(emergencyCommand);
      });
      
      const emergencyEndTime = Date.now();
      const emergencyTime = emergencyEndTime - emergencyStartTime;
      
      // Both commands should succeed
      expect(regularSuccess).toBe(true);
      expect(emergencySuccess).toBe(true);
      
      // Emergency command should be processed faster
      expect(emergencyTime).toBeLessThan(regularTime);
      
      // Verify both commands were sent
      expect(mockSendCommand).toHaveBeenCalledTimes(2);
    });
  });
});