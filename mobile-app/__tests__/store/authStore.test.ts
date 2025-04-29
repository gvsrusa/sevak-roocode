import { act, renderHook } from '@testing-library/react-hooks';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

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

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  describe('login', () => {
    test('should authenticate with valid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.login('admin', 'password');
      });
      
      // Check return value
      expect(success).toBe(true);
      
      // Check state updates
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: '1',
        username: 'admin',
        role: 'owner'
      });
      expect(result.current.token).toBe('sevak-auth-token-123');
      
      // Check secure storage
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'sevak-auth-token-123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user', JSON.stringify({
        id: '1',
        username: 'admin',
        role: 'owner'
      }));
    });
    
    test('should fail with invalid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());
      const alertSpy = jest.spyOn(Alert, 'alert');
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.login('wrong', 'credentials');
      });
      
      // Check return value
      expect(success).toBe(false);
      
      // Check state remains unchanged
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      
      // Check alert was shown
      expect(alertSpy).toHaveBeenCalledWith('Authentication Failed', 'Invalid username or password');
      
      // Check secure storage was not called
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
    
    test('should handle login errors', async () => {
      const { result } = renderHook(() => useAuthStore());
      const alertSpy = jest.spyOn(Alert, 'alert');
      
      // Mock SecureStore to throw an error
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      let success: boolean = false;
      
      await act(async () => {
        success = await result.current.login('admin', 'password');
      });
      
      // Check return value
      expect(success).toBe(false);
      
      // Check alert was shown
      expect(alertSpy).toHaveBeenCalledWith('Login Error', 'An error occurred during login');
    });
  });
  
  describe('logout', () => {
    test('should clear authentication state', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // First login
      await act(async () => {
        await result.current.login('admin', 'password');
      });
      
      // Then logout
      await act(async () => {
        result.current.logout();
      });
      
      // Check state updates
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      
      // Check secure storage
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
    });
    
    test('should handle logout errors', async () => {
      const { result } = renderHook(() => useAuthStore());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock SecureStore to throw an error
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      // First login
      await act(async () => {
        await result.current.login('admin', 'password');
      });
      
      // Then logout
      await act(async () => {
        result.current.logout();
      });
      
      // Check error was logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('checkAuth', () => {
    test('should restore authentication state from storage', async () => {
      // Mock stored credentials
      const storedUser = {
        id: '1',
        username: 'admin',
        role: 'owner'
      };
      const storedToken = 'sevak-auth-token-123';
      
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve(storedToken);
        if (key === 'user') return Promise.resolve(JSON.stringify(storedUser));
        return Promise.resolve(null);
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.checkAuth();
      });
      
      // Check state updates
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(storedUser);
      expect(result.current.token).toBe(storedToken);
      expect(result.current.isLoading).toBe(false);
    });
    
    test('should handle missing credentials', async () => {
      // Mock no stored credentials
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.checkAuth();
      });
      
      // Check state updates
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
    
    test('should handle storage errors', async () => {
      // Mock storage error
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const { result } = renderHook(() => useAuthStore());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        await result.current.checkAuth();
      });
      
      // Check state updates
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
      
      // Check error was logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});