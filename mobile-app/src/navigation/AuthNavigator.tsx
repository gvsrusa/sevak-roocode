import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { i18n } from '../utils/i18n';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Create stack navigator
const Stack = createStackNavigator();

/**
 * Authentication navigation stack
 */
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ 
          title: i18n.t('login'),
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ 
          title: i18n.t('forgotPassword'),
        }} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;