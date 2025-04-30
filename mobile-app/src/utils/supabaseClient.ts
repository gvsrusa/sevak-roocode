import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create a custom storage implementation using AsyncStorage
const customStorage = {
  getItem: (key: string) => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return AsyncStorage.removeItem(key);
  },
};

// Create Supabase client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

/**
 * Get the current user session
 * @returns The current session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Get the current user
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error getting user:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Sign out the current user
 * @returns True if sign out was successful, false otherwise
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

/**
 * Get user profile data
 * @param userId The user ID to get profile data for
 * @returns The user profile data or null if not found
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Update user profile data
 * @param userId The user ID to update profile data for
 * @param updates The profile data to update
 * @returns The updated profile data or null if update failed
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};