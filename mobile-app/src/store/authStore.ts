import { create } from 'zustand';
import { Alert } from 'react-native';
import securityManager from '../utils/security';
import * as Crypto from 'expo-crypto';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  mfaEnabled: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithMfa: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  enableMfa: () => Promise<boolean>;
  disableMfa: () => Promise<boolean>;
  isMfaEnabled: () => boolean;
  enableOfflineOperation: () => Promise<boolean>;
  disableOfflineOperation: () => Promise<boolean>;
  isOfflineOperationEnabled: () => boolean;
}

interface User {
  id: string;
  username: string;
  role: 'owner' | 'operator' | 'viewer';
  lastLogin?: number;
  permissions?: string[];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  mfaEnabled: false,

  login: async (username: string, password: string) => {
    try {
      // In a real app, this would be an API call to authenticate
      // For now, we'll simulate authentication with hardcoded credentials
      if (username === 'admin' && password === 'password') {
        // Hash the password before comparing (in a real app)
        const passwordHash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          password
        );
        
        const user: User = {
          id: '1',
          username: 'admin',
          role: 'owner',
          lastLogin: Date.now(),
          permissions: ['control', 'configure', 'monitor']
        };
        
        // Generate a secure token
        const token = await securityManager.generateSecureToken(32);
        
        // Store credentials securely
        await securityManager.secureStore('auth_token', token);
        await securityManager.secureStore('user', JSON.stringify(user));
        await securityManager.secureStore('client_id', user.id);
        
        // Log successful login
        await securityManager.logSecurityEvent('User logged in successfully', 'info', {
          username: user.username,
          role: user.role
        });
        
        // Check if MFA is enabled
        const mfaEnabled = await securityManager.isMfaEnabled();
        
        set({ isAuthenticated: true, user, token, mfaEnabled });
        return true;
      } else {
        // Log failed login attempt
        await securityManager.logSecurityEvent('Failed login attempt', 'warning', {
          username
        });
        
        Alert.alert('Authentication Failed', 'Invalid username or password');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      await securityManager.logSecurityEvent('Login error', 'error', { error });
      Alert.alert('Login Error', 'An error occurred during login');
      return false;
    }
  },

  loginWithMfa: async (username: string, password: string) => {
    try {
      // First perform regular login
      const loginSuccess = await get().login(username, password);
      
      if (!loginSuccess) {
        return false;
      }
      
      // Then require biometric authentication
      const biometricSuccess = await securityManager.authenticateWithBiometrics(
        'Authenticate to complete login'
      );
      
      if (!biometricSuccess) {
        // If biometric auth fails, log out and return false
        await securityManager.logSecurityEvent('MFA authentication failed', 'warning', {
          username
        });
        
        await get().logout();
        Alert.alert('Authentication Failed', 'Biometric authentication required');
        return false;
      }
      
      await securityManager.logSecurityEvent('MFA authentication successful', 'info', {
        username
      });
      
      return true;
    } catch (error) {
      console.error('MFA login error:', error);
      await securityManager.logSecurityEvent('MFA login error', 'error', { error });
      Alert.alert('Login Error', 'An error occurred during MFA login');
      return false;
    }
  },

  logout: async () => {
    try {
      // Log the logout event before clearing credentials
      if (get().user) {
        await securityManager.logSecurityEvent('User logged out', 'info', {
          username: get().user?.username
        });
      }
      
      // Clear stored credentials
      await securityManager.secureDelete('auth_token');
      await securityManager.secureDelete('user');
      
      set({ isAuthenticated: false, user: null, token: null });
    } catch (error) {
      console.error('Logout error:', error);
      await securityManager.logSecurityEvent('Logout error', 'error', { error });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      // Check if we have stored credentials
      const token = await securityManager.secureRetrieve('auth_token');
      const userString = await securityManager.secureRetrieve('user');
      
      if (token && userString) {
        const user = JSON.parse(userString);
        
        // Check if MFA is enabled
        const mfaEnabled = await securityManager.isMfaEnabled();
        
        set({ isAuthenticated: true, user, token, mfaEnabled });
        
        // Log successful auth check
        await securityManager.logSecurityEvent('Authentication check successful', 'info', {
          username: user.username
        });
      } else {
        set({ isAuthenticated: false, user: null, token: null });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await securityManager.logSecurityEvent('Authentication check error', 'error', { error });
      set({ isAuthenticated: false, user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },
  
  enableMfa: async () => {
    try {
      const success = await securityManager.setMfaEnabled(true);
      
      if (success) {
        set({ mfaEnabled: true });
        await securityManager.logSecurityEvent('MFA enabled', 'info', {
          username: get().user?.username
        });
      }
      
      return success;
    } catch (error) {
      console.error('Enable MFA error:', error);
      await securityManager.logSecurityEvent('Enable MFA error', 'error', { error });
      return false;
    }
  },
  
  disableMfa: async () => {
    try {
      // Require biometric authentication to disable MFA
      const authenticated = await securityManager.authenticateWithBiometrics(
        'Authenticate to disable MFA'
      );
      
      if (!authenticated) {
        await securityManager.logSecurityEvent('MFA disable attempt failed - authentication failed', 'warning', {
          username: get().user?.username
        });
        return false;
      }
      
      const success = await securityManager.setMfaEnabled(false);
      
      if (success) {
        set({ mfaEnabled: false });
        await securityManager.logSecurityEvent('MFA disabled', 'info', {
          username: get().user?.username
        });
      }
      
      return success;
    } catch (error) {
      console.error('Disable MFA error:', error);
      await securityManager.logSecurityEvent('Disable MFA error', 'error', { error });
      return false;
    }
  },
  
  isMfaEnabled: () => {
    return get().mfaEnabled;
  },
  
  enableOfflineOperation: async () => {
    try {
      // Require authentication to enable offline operation
      const authenticated = await securityManager.authenticateWithBiometrics(
        'Authenticate to enable offline operation'
      );
      
      if (!authenticated) {
        await securityManager.logSecurityEvent('Offline operation enable attempt failed - authentication failed', 'warning', {
          username: get().user?.username
        });
        return false;
      }
      
      await securityManager.setOfflineOperationAllowed(true);
      await securityManager.logSecurityEvent('Offline operation enabled', 'info', {
        username: get().user?.username
      });
      
      return true;
    } catch (error) {
      console.error('Enable offline operation error:', error);
      await securityManager.logSecurityEvent('Enable offline operation error', 'error', { error });
      return false;
    }
  },
  
  disableOfflineOperation: async () => {
    try {
      await securityManager.setOfflineOperationAllowed(false);
      await securityManager.logSecurityEvent('Offline operation disabled', 'info', {
        username: get().user?.username
      });
      
      return true;
    } catch (error) {
      console.error('Disable offline operation error:', error);
      await securityManager.logSecurityEvent('Disable offline operation error', 'error', { error });
      return false;
    }
  },
  
  isOfflineOperationEnabled: () => {
    return securityManager.isOfflineOperationAllowed();
  }
}));