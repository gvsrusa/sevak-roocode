import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { i18n } from '../utils/i18n';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import ControlScreen from '../screens/ControlScreen';
import TasksScreen from '../screens/TasksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';

// Create stack navigator for settings
const SettingsStack = createStackNavigator();

/**
 * Settings stack navigator
 */
const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator
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
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: i18n.t('settings') }}
      />
      <SettingsStack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={{ title: 'Security Settings' }}
      />
    </SettingsStack.Navigator>
  );
};

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

/**
 * Main app navigation with bottom tabs
 */
const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          // Set icon based on route name
          if (route.name === 'Dashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'Control') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          // Return Ionicons component
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ 
          title: i18n.t('dashboard'),
        }} 
      />
      <Tab.Screen 
        name="Control" 
        component={ControlScreen} 
        options={{ 
          title: i18n.t('control'),
        }} 
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ 
          title: i18n.t('tasks'),
        }} 
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          title: i18n.t('settings'),
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;