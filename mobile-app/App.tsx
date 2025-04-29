import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import { i18n } from './src/utils/i18n';
import { useAuthStore } from './src/store/authStore';
import { useConnectionStore } from './src/store/connectionStore';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import OfflineNotice from './src/components/OfflineNotice';

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { isConnected, checkConnection } = useConnectionStore();
  const { isNetworkConnected } = useNetworkStatus();

  // Initialize app
  useEffect(() => {
    // Set up localization
    i18n.locale = Localization.locale;
    I18nManager.forceRTL(Localization.isRTL);
    
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
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
      <StatusBar style="auto" />
      {!isNetworkConnected && <OfflineNotice />}
    </SafeAreaProvider>
  );
}