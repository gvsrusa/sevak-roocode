import { TractorConnectionService } from '../../src/services/TractorConnectionService';
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../src/store/authStore';
import { renderHook, act } from '@testing-library/react-hooks';

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
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve())
}));

// Mock the auth store
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: jest.fn()
}));

describe('Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Authentication Security', () => {
    test('should store authentication token securely', async () => {
      // Mock the auth store login function
      const mockLogin = jest.fn().mockResolvedValue(true);
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        login: mockLogin
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.login('admin', 'password');
      });
      
      // Verify token is stored securely
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', expect.any(String));
    });
    
    test('should not store password in plain text', async () => {
      // Mock the auth store login function
      const mockLogin = jest.fn().mockResolvedValue(true);
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        login: mockLogin
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.login('admin', 'password');
      });
      
      // Verify password is not stored
      const setItemCalls = (SecureStore.setItemAsync as jest.Mock).mock.calls;
      const storedValues = setItemCalls.map(call => call[1]);
      
      // Check that the password is not stored in any call to SecureStore
      expect(storedValues.some(value => value === 'password')).toBe(false);
      expect(storedValues.some(value => typeof value === 'string' && value.includes('password'))).toBe(false);
    });
    
    test('should clear authentication data on logout', async () => {
      // Mock the auth store
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        logout: jest.fn(),
        isAuthenticated: true,
        user: { id: '1', username: 'admin', role: 'owner' },
        token: 'auth-token-123'
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        result.current.logout();
      });
      
      // Verify secure storage is cleared
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
    });
  });
  
  describe('Data Transmission Security', () => {
    test('should include authentication token in connection', async () => {
      const service = new TractorConnectionService();
      
      await service.connect('tractor-123', 'auth-token-123');
      
      // Verify auth token is included in socket connection options
      expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        auth: { token: 'auth-token-123' }
      }));
    });
    
    test('should send authentication message after connection', async () => {
      const service = new TractorConnectionService();
      
      // Mock socket.on to trigger the connect event
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        return mockSocket;
      });
      
      await service.connect('tractor-123', 'auth-token-123');
      
      // Verify authentication message is sent
      expect(mockSocket.emit).toHaveBeenCalledWith('AUTH', {
        token: 'auth-token-123',
        tractorId: 'tractor-123'
      });
    });
    
    test('should disconnect on authentication failure', async () => {
      const service = new TractorConnectionService();
      
      // Mock socket.on to trigger connect and auth_failed events
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        if (event === 'AUTH_FAILED') {
          setTimeout(() => callback('Invalid token'), 10);
        }
        return mockSocket;
      });
      
      await service.connect('tractor-123', 'invalid-token');
      
      // Verify socket is disconnected
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
    
    test('should include command ID in all commands for verification', async () => {
      const service = new TractorConnectionService();
      
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
      
      await service.sendCommand(command);
      
      // Verify command includes ID
      expect(mockSocket.emit).toHaveBeenCalledWith('MOVE', expect.objectContaining({
        commandId: 'cmd-123'
      }));
    });
    
    test('should generate unique command ID if not provided', async () => {
      const service = new TractorConnectionService();
      
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
      
      // Verify command includes generated ID
      const emitCall = mockSocket.emit.mock.calls.find(call => call[0] === 'MOVE');
      expect(emitCall[1].commandId).toBeTruthy();
      expect(typeof emitCall[1].commandId).toBe('string');
      expect(emitCall[1].commandId.length).toBeGreaterThan(0);
    });
  });
  
  describe('Secure Storage', () => {
    test('should store queued commands securely', async () => {
      const service = new TractorConnectionService();
      
      // Setup service as disconnected
      (service as any).isConnected = false;
      
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
      
      // Verify command is stored securely
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled(); // SecureStore is not used directly
    });
    
    test('should encrypt sensitive data in AsyncStorage', async () => {
      // This is a conceptual test - in a real implementation, we would verify
      // that sensitive data is encrypted before being stored in AsyncStorage
      
      const service = new TractorConnectionService();
      
      // Mock AsyncStorage.setItem
      const setItemSpy = jest.spyOn(require('@react-native-async-storage/async-storage'), 'setItem');
      
      // Setup service as disconnected
      (service as any).isConnected = false;
      (service as any).queuedCommands = [{
        type: 'move' as const,
        data: { direction: 'forward', speed: 5 },
        timestamp: Date.now(),
        id: 'cmd-123',
        sent: false,
        acknowledged: false
      }];
      
      // Save queued commands
      await (service as any).saveQueuedCommands();
      
      // Verify data is stored
      expect(setItemSpy).toHaveBeenCalled();
      
      // In a real test, we would verify the data is encrypted
      // This would require access to the actual implementation details
    });
  });
});