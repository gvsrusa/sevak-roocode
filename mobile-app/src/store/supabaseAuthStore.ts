import { create } from 'zustand';
import { Alert } from 'react-native';
import { supabase, getCurrentUser, getCurrentSession } from '../utils/supabaseClient';
import securityManager from '../utils/security';
import * as Crypto from 'expo-crypto';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: any | null;
  mfaEnabled: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithMfa: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  enableMfa: () => Promise<boolean>;
  disableMfa: () => Promise<boolean>;
  isMfaEnabled: () => boolean;
  enableOfflineOperation: () => Promise<boolean>;
  disableOfflineOperation: () => Promise<boolean>;
  isOfflineOperationEnabled: () => boolean;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

interface User {
  id: string;
  email: string;
  role: 'owner' | 'operator' | 'viewer';
  fullName?: string;
  lastLogin?: number;
  permissions?: string[];
}

export const useSupabaseAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  session: null,
  mfaEnabled: false,

  login: async (email: string, password: string) => {
    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        await securityManager.logSecurityEvent('Failed login attempt', 'warning', {
          email
        });
        
        Alert.alert('Authentication Failed', error.message);
        return false;
      }

      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      const role = profileData?.role || 'viewer';
      const fullName = profileData?.full_name || data.user.user_metadata?.full_name || '';
      
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        role: role as 'owner' | 'operator' | 'viewer',
        fullName,
        lastLogin: Date.now(),
        permissions: role === 'owner' 
          ? ['control', 'configure', 'monitor'] 
          : role === 'operator' 
            ? ['control', 'monitor'] 
            : ['monitor']
      };
      
      // Log successful login
      await securityManager.logSecurityEvent('User logged in successfully', 'info', {
        email: user.email,
        role: user.role
      });
      
      // Check if MFA is enabled
      const mfaEnabled = await securityManager.isMfaEnabled();
      
      set({ isAuthenticated: true, user, session: data.session, mfaEnabled });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      await securityManager.logSecurityEvent('Login error', 'error', { error });
      Alert.alert('Login Error', 'An error occurred during login');
      return false;
    }
  },

  loginWithMfa: async (email: string, password: string) => {
    try {
      // First perform regular login
      const loginSuccess = await get().login(email, password);
      
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
          email
        });
        
        await get().logout();
        Alert.alert('Authentication Failed', 'Biometric authentication required');
        return false;
      }
      
      await securityManager.logSecurityEvent('MFA authentication successful', 'info', {
        email
      });
      
      return true;
    } catch (error) {
      console.error('MFA login error:', error);
      await securityManager.logSecurityEvent('MFA login error', 'error', { error });
      Alert.alert('Login Error', 'An error occurred during MFA login');
      return false;
    }
  },

  loginWithGoogle: async () => {
    // This is handled by the SocialSignIn component
    // This method is just a placeholder for the store interface
    return false;
  },

  loginWithApple: async () => {
    // This is handled by the SocialSignIn component
    // This method is just a placeholder for the store interface
    return false;
  },

  loginWithFacebook: async () => {
    // This is handled by the SocialSignIn component
    // This method is just a placeholder for the store interface
    return false;
  },

  logout: async () => {
    try {
      // Log the logout event before clearing credentials
      if (get().user) {
        await securityManager.logSecurityEvent('User logged out', 'info', {
          email: get().user?.email
        });
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
      }
      
      set({ isAuthenticated: false, user: null, session: null });
    } catch (error) {
      console.error('Logout error:', error);
      await securityManager.logSecurityEvent('Logout error', 'error', { error });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      // Check if we have a valid session with Supabase
      const session = await getCurrentSession();
      const user = await getCurrentUser();
      
      if (session && user) {
        // Get user profile from database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        const role = profileData?.role || 'viewer';
        const fullName = profileData?.full_name || user.user_metadata?.full_name || '';
        
        const userData: User = {
          id: user.id,
          email: user.email || '',
          role: role as 'owner' | 'operator' | 'viewer',
          fullName,
          lastLogin: Date.now(),
          permissions: role === 'owner' 
            ? ['control', 'configure', 'monitor'] 
            : role === 'operator' 
              ? ['control', 'monitor'] 
              : ['monitor']
        };
        
        // Check if MFA is enabled
        const mfaEnabled = await securityManager.isMfaEnabled();
        
        set({ isAuthenticated: true, user: userData, session, mfaEnabled });
        
        // Log successful auth check
        await securityManager.logSecurityEvent('Authentication check successful', 'info', {
          email: userData.email
        });
      } else {
        set({ isAuthenticated: false, user: null, session: null });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await securityManager.logSecurityEvent('Authentication check error', 'error', { error });
      set({ isAuthenticated: false, user: null, session: null });
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
          email: get().user?.email
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
          email: get().user?.email
        });
        return false;
      }
      
      const success = await securityManager.setMfaEnabled(false);
      
      if (success) {
        set({ mfaEnabled: false });
        await securityManager.logSecurityEvent('MFA disabled', 'info', {
          email: get().user?.email
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
          email: get().user?.email
        });
        return false;
      }
      
      await securityManager.setOfflineOperationAllowed(true);
      await securityManager.logSecurityEvent('Offline operation enabled', 'info', {
        email: get().user?.email
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
        email: get().user?.email
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
  },

  register: async (email: string, password: string, fullName: string) => {
    try {
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        Alert.alert('Registration Failed', error.message);
        return false;
      }

      if (data?.user?.identities?.length === 0) {
        // User already exists
        Alert.alert(
          'User Already Exists',
          'An account with this email already exists. Please log in instead.'
        );
        return false;
      }

      // Log successful registration
      await securityManager.logSecurityEvent('User registered successfully', 'info', {
        email
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      await securityManager.logSecurityEvent('Registration error', 'error', { error });
      Alert.alert('Registration Error', 'An error occurred during registration');
      return false;
    }
  },

  resetPassword: async (email: string) => {
    try {
      // Send password reset email with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'sevaktractor://reset-password',
      });

      if (error) {
        Alert.alert('Password Reset Failed', error.message);
        return false;
      }

      // Log successful password reset request
      await securityManager.logSecurityEvent('Password reset requested', 'info', {
        email
      });

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      await securityManager.logSecurityEvent('Password reset error', 'error', { error });
      Alert.alert('Password Reset Error', 'An error occurred during password reset');
      return false;
    }
  }
}));