import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';
import { useSupabaseAuthStore } from './src/store/supabaseAuthStore';
import { useConnectionStore } from './src/store/connectionStore';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import OfflineNotice from './src/components/OfflineNotice';
import { LanguageProvider } from './src/contexts/LanguageContext';
import 'react-native-url-polyfill/auto';

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useSupabaseAuthStore();
  const { isConnected, checkConnection } = useConnectionStore();
  const { isNetworkConnected } = useNetworkStatus();

  // Initialize app
  useEffect(() => {
    // Check authentication status
    checkAuth();
    
    // Check tractor connection status
    checkConnection();
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <NavigationContainer
          // Enable web linking for authentication callbacks
          linking={Platform.OS === 'web' ? {
            prefixes: ['http://localhost:19006', 'https://sevaktractor.app'],
            config: {
              screens: {
                Login: 'login',
                Register: 'register',
                ForgotPassword: 'forgot-password',
                ResetPassword: 'reset-password',
                Dashboard: 'dashboard',
                Settings: 'settings',
                Control: 'control',
                Tasks: 'tasks',
                Monitoring: 'monitoring',
              },
            },
          } : undefined}
        >
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
        <StatusBar style="auto" />
        {!isNetworkConnected && <OfflineNotice />}
      </SafeAreaProvider>
    </LanguageProvider>
  );
}