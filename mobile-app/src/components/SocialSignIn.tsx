import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../utils/i18n';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import { supabase } from '../utils/supabaseClient';

// Ensure WebBrowser redirects are handled properly
WebBrowser.maybeCompleteAuthSession();

// Define the props for the SocialSignIn component
interface SocialSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * SocialSignIn component for handling social authentication
 * Supports Google, Apple, and Facebook sign-in
 */
const SocialSignIn: React.FC<SocialSignInProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    google: false,
    apple: false,
    facebook: false,
  });
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { loginWithGoogle, loginWithApple, loginWithFacebook } = useSupabaseAuthStore();

  /**
   * Handle Google sign-in
   */
  const handleGoogleSignIn = async () => {
    try {
      setLoading({ ...loading, google: true });

      // Create a redirect URL
      const redirectUri = AuthSession.makeRedirectUri({
        path: 'auth/callback',
      });

      // Sign in with Google using Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open the authentication URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        if (result.type === 'success') {
          // Extract the access token from the URL
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            // Set the session with the access token
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              throw new Error(sessionError.message);
            }

            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }

            // Navigate to the dashboard
            navigation.navigate('Dashboard' as never);
          }
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert(t('auth.error'), t('auth.googleSignInFailed'));
      
      // Call the onError callback if provided
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setLoading({ ...loading, google: false });
    }
  };

  /**
   * Handle Apple sign-in
   */
  const handleAppleSignIn = async () => {
    try {
      setLoading({ ...loading, apple: true });

      // Create a redirect URL
      const redirectUri = AuthSession.makeRedirectUri({
        path: 'auth/callback',
      });

      // Sign in with Apple using Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open the authentication URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        if (result.type === 'success') {
          // Extract the access token from the URL
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            // Set the session with the access token
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              throw new Error(sessionError.message);
            }

            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }

            // Navigate to the dashboard
            navigation.navigate('Dashboard' as never);
          }
        }
      }
    } catch (error) {
      console.error('Apple sign-in error:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert(t('auth.error'), t('auth.appleSignInFailed'));
      
      // Call the onError callback if provided
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setLoading({ ...loading, apple: false });
    }
  };

  /**
   * Handle Facebook sign-in
   */
  const handleFacebookSignIn = async () => {
    try {
      setLoading({ ...loading, facebook: true });

      // Create a redirect URL
      const redirectUri = AuthSession.makeRedirectUri({
        path: 'auth/callback',
      });

      // Sign in with Facebook using Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open the authentication URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        if (result.type === 'success') {
          // Extract the access token from the URL
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            // Set the session with the access token
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              throw new Error(sessionError.message);
            }

            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }

            // Navigate to the dashboard
            navigation.navigate('Dashboard' as never);
          }
        }
      }
    } catch (error) {
      console.error('Facebook sign-in error:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert(t('auth.error'), t('auth.facebookSignInFailed'));
      
      // Call the onError callback if provided
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setLoading({ ...loading, facebook: false });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.orText}>{t('auth.orContinueWith')}</Text>
      
      <View style={styles.socialButtonsContainer}>
        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={loading.google}
        >
          <FontAwesome name="google" size={20} color="#FFFFFF" />
          {loading.google && <Text style={styles.loadingText}>...</Text>}
        </TouchableOpacity>

        {/* Apple Sign-In Button (iOS only) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading.apple}
          >
            <FontAwesome name="apple" size={20} color="#FFFFFF" />
            {loading.apple && <Text style={styles.loadingText}>...</Text>}
          </TouchableOpacity>
        )}

        {/* Facebook Sign-In Button */}
        <TouchableOpacity
          style={[styles.socialButton, styles.facebookButton]}
          onPress={handleFacebookSignIn}
          disabled={loading.facebook}
        >
          <FontAwesome name="facebook" size={20} color="#FFFFFF" />
          {loading.facebook && <Text style={styles.loadingText}>...</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  loadingText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 10,
    bottom: 5,
  },
});

export default SocialSignIn;