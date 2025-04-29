import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { io } from 'socket.io-client';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Import components and navigators
import AppNavigator from '../../src/navigation/AppNavigator';
import AuthNavigator from '../../src/navigation/AuthNavigator';
import { useAuthStore } from '../../src/store/authStore';
import { useConnectionStore } from '../../src/store/connectionStore';
import { TractorConnectionService } from '../../src/services/TractorConnectionService';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    })
  };
});

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
  setItemAsync: jest.fn((key, value) => Promise.resolve()),
  getItemAsync: jest.fn((key) => {
    if (key === 'auth_token') return Promise.resolve('auth-token-123');
    if (key === 'user') return Promise.resolve(JSON.stringify({
      id: '1',
      username: 'admin',
      role: 'owner'
    }));
    if (key === 'last_connected_tractor') return Promise.resolve('tractor-123');
    return Promise.resolve(null);
  }),
  deleteItemAsync: jest.fn(() => Promise.resolve())
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true
  }))
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Mock the auth store
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: jest.fn()
}));

// Mock the connection store
jest.mock('../../src/store/connectionStore', () => ({
  useConnectionStore: jest.fn()
}));

// Mock TractorConnectionService
jest.mock('../../src/services/TractorConnectionService', () => {
  return {
    TractorConnectionService: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue({
        success: true,
        connectionType: 'direct',
        connectionQuality: 80
      }),
      disconnect: jest.fn().mockResolvedValue({ success: true }),
      checkConnection: jest.fn().mockResolvedValue(true),
      subscribeToStatusUpdates: jest.fn(),
      getConnectionType: jest.fn().mockReturnValue('direct'),
      getConnectionQuality: jest.fn().mockReturnValue(80),
      sendCommand: jest.fn().mockResolvedValue({ success: true })
    }))
  };
});

// Mock components that might be difficult to render in tests
jest.mock('../../src/components/CameraFeed', () => 'CameraFeed');
jest.mock('../../src/components/MapPreview', () => 'MapPreview');
jest.mock('../../src/components/JoystickControl', () => 'JoystickControl');

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Authentication Flow', () => {
    test('should navigate from login to dashboard on successful authentication', async () => {
      // Mock auth store for unauthenticated state
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn().mockResolvedValue(true),
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
      
      // Mock connection store
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        isConnected: false,
        isConnecting: false,
        connectionType: null,
        connectionQuality: 0,
        tractorId: null,
        tractorStatus: null,
        error: null,
        connectToTractor: jest.fn().mockResolvedValue(true),
        disconnectFromTractor: jest.fn(),
        checkConnection: jest.fn(),
        updateTractorStatus: jest.fn(),
        sendCommand: jest.fn(),
        queueCommand: jest.fn(),
        processQueuedCommands: jest.fn()
      });
      
      // Render the auth navigator
      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      );
      
      // Enter credentials
      fireEvent.changeText(getByPlaceholderText('username'), 'admin');
      fireEvent.changeText(getByPlaceholderText('password'), 'password');
      
      // Press login button
      fireEvent.press(getByText('login'));
      
      // Wait for login to complete
      await waitFor(() => {
        expect(useAuthStore().login).toHaveBeenCalledWith('admin', 'password');
      });
      
      // Now mock auth store for authenticated state
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', username: 'admin', role: 'owner' },
        token: 'auth-token-123',
        login: jest.fn().mockResolvedValue(true),
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
      
      // Render the app navigator
      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
      
      // Verify dashboard is rendered
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
    });
    
    test('should persist authentication state across app restarts', async () => {
      // Mock SecureStore to return stored credentials
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('auth-token-123');
        if (key === 'user') return Promise.resolve(JSON.stringify({
          id: '1',
          username: 'admin',
          role: 'owner'
        }));
        return Promise.resolve(null);
      });
      
      // Mock auth store with loading state
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn().mockImplementation(async () => {
          // Simulate checking auth
          await Promise.resolve();
          
          // Update mock to authenticated state
          (useAuthStore as unknown as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            user: { id: '1', username: 'admin', role: 'owner' },
            token: 'auth-token-123',
            login: jest.fn(),
            logout: jest.fn(),
            checkAuth: jest.fn()
          });
        })
      });
      
      // Mock connection store
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        isConnected: false,
        isConnecting: false,
        connectionType: null,
        connectionQuality: 0,
        tractorId: null,
        tractorStatus: null,
        error: null,
        connectToTractor: jest.fn().mockResolvedValue(true),
        disconnectFromTractor: jest.fn(),
        checkConnection: jest.fn(),
        updateTractorStatus: jest.fn(),
        sendCommand: jest.fn(),
        queueCommand: jest.fn(),
        processQueuedCommands: jest.fn()
      });
      
      // Render the app navigator
      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
      
      // Verify loading screen is shown initially
      expect(() => getByTestId('loading-screen')).not.toThrow();
      
      // Wait for auth check to complete
      await waitFor(() => {
        expect(useAuthStore().checkAuth).toHaveBeenCalled();
      });
      
      // Verify dashboard is rendered after auth check
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
    });
  });
  
  describe('Tractor Connection Flow', () => {
    test('should connect to tractor and show status', async () => {
      // Mock auth store for authenticated state
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', username: 'admin', role: 'owner' },
        token: 'auth-token-123',
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
      
      // Mock connection store with initial state
      const mockConnectToTractor = jest.fn().mockImplementation(async () => {
        // Simulate successful connection
        await Promise.resolve();
        
        // Update mock to connected state
        (useConnectionStore as unknown as jest.Mock).mockReturnValue({
          isConnected: true,
          isConnecting: false,
          connectionType: 'direct',
          connectionQuality: 80,
          tractorId: 'tractor-123',
          tractorStatus: {
            batteryLevel: 80,
            batteryTimeRemaining: 120,
            speed: 0,
            position: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 5
            },
            operationStatus: 'idle',
            currentOperation: null,
            motorTemperature: 35,
            safetyStatus: 'normal',
            alerts: []
          },
          error: null,
          connectToTractor: mockConnectToTractor,
          disconnectFromTractor: jest.fn(),
          checkConnection: jest.fn(),
          updateTractorStatus: jest.fn(),
          sendCommand: jest.fn(),
          queueCommand: jest.fn(),
          processQueuedCommands: jest.fn()
        });
        
        return true;
      });
      
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        isConnected: false,
        isConnecting: false,
        connectionType: null,
        connectionQuality: 0,
        tractorId: null,
        tractorStatus: null,
        error: null,
        connectToTractor: mockConnectToTractor,
        disconnectFromTractor: jest.fn(),
        checkConnection: jest.fn(),
        updateTractorStatus: jest.fn(),
        sendCommand: jest.fn(),
        queueCommand: jest.fn(),
        processQueuedCommands: jest.fn()
      });
      
      // Render the app navigator
      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
      
      // Wait for dashboard to render
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      // Press connect button
      fireEvent.press(getByText('connect'));
      
      // Wait for connection to complete
      await waitFor(() => {
        expect(mockConnectToTractor).toHaveBeenCalled();
      });
      
      // Verify tractor status is displayed
      await waitFor(() => {
        expect(getByText('Battery: 80%')).toBeTruthy();
        expect(getByText('Status: idle')).toBeTruthy();
      });
    });
    
    test('should handle offline mode gracefully', async () => {
      // Mock NetInfo to return offline status
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false
      });
      
      // Mock auth store for authenticated state
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', username: 'admin', role: 'owner' },
        token: 'auth-token-123',
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
      
      // Mock connection store
      const mockSendCommand = jest.fn().mockImplementation(async () => {
        // Simulate offline mode - command is queued
        return false;
      });
      
      const mockQueueCommand = jest.fn();
      
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        isConnected: false,
        isConnecting: false,
        connectionType: null,
        connectionQuality: 0,
        tractorId: 'tractor-123',
        tractorStatus: null,
        error: null,
        connectToTractor: jest.fn().mockResolvedValue(false),
        disconnectFromTractor: jest.fn(),
        checkConnection: jest.fn(),
        updateTractorStatus: jest.fn(),
        sendCommand: mockSendCommand,
        queueCommand: mockQueueCommand,
        processQueuedCommands: jest.fn()
      });
      
      // Render the app navigator
      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
      
      // Wait for dashboard to render
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      // Navigate to control screen
      fireEvent.press(getByText('control'));
      
      // Wait for control screen to render
      await waitFor(() => {
        expect(getByTestId('control-screen')).toBeTruthy();
      });
      
      // Send a command
      fireEvent.press(getByTestId('forward-button'));
      
      // Wait for command to be processed
      await waitFor(() => {
        expect(mockSendCommand).toHaveBeenCalled();
      });
      
      // Verify command was queued
      expect(mockQueueCommand).toHaveBeenCalled();
      
      // Verify offline notice is displayed
      expect(getByText('You are offline')).toBeTruthy();
      expect(getByText('Commands will be queued for later')).toBeTruthy();
    });
  });
  
  describe('Control Flow', () => {
    test('should send movement commands and update tractor status', async () => {
      // Mock auth store for authenticated state
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', username: 'admin', role: 'owner' },
        token: 'auth-token-123',
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
      
      // Mock connection store with connected state
      const mockSendCommand = jest.fn().mockImplementation(async (command) => {
        // Simulate successful command
        await Promise.resolve();
        
        // Update mock with new status based on command
        if (command.type === 'move') {
          const newSpeed = command.data.direction === 'forward' ? 5 : 0;
          
          (useConnectionStore as unknown as jest.Mock).mockReturnValue({
            isConnected: true,
            isConnecting: false,
            connectionType: 'direct',
            connectionQuality: 80,
            tractorId: 'tractor-123',
            tractorStatus: {
              batteryLevel: 80,
              batteryTimeRemaining: 120,
              speed: newSpeed,
              position: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 5
              },
              operationStatus: newSpeed > 0 ? 'running' : 'idle',
              currentOperation: null,
              motorTemperature: 35,
              safetyStatus: 'normal',
              alerts: []
            },
            error: null,
            connectToTractor: jest.fn(),
            disconnectFromTractor: jest.fn(),
            checkConnection: jest.fn(),
            updateTractorStatus: jest.fn(),
            sendCommand: mockSendCommand,
            queueCommand: jest.fn(),
            processQueuedCommands: jest.fn()
          });
        }
        
        return true;
      });
      
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'direct',
        connectionQuality: 80,
        tractorId: 'tractor-123',
        tractorStatus: {
          batteryLevel: 80,
          batteryTimeRemaining: 120,
          speed: 0,
          position: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 5
          },
          operationStatus: 'idle',
          currentOperation: null,
          motorTemperature: 35,
          safetyStatus: 'normal',
          alerts: []
        },
        error: null,
        connectToTractor: jest.fn(),
        disconnectFromTractor: jest.fn(),
        checkConnection: jest.fn(),
        updateTractorStatus: jest.fn(),
        sendCommand: mockSendCommand,
        queueCommand: jest.fn(),
        processQueuedCommands: jest.fn()
      });
      
      // Render the app navigator
      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
      
      // Navigate to control screen
      fireEvent.press(getByText('control'));
      
      // Wait for control screen to render
      await waitFor(() => {
        expect(getByTestId('control-screen')).toBeTruthy();
      });
      
      // Verify initial status
      expect(getByText('Speed: 0 km/h')).toBeTruthy();
      expect(getByText('Status: idle')).toBeTruthy();
      
      // Send forward command
      fireEvent.press(getByTestId('forward-button'));
      
      // Wait for command to be processed
      await waitFor(() => {
        expect(mockSendCommand).toHaveBeenCalledWith(expect.objectContaining({
          type: 'move',
          data: expect.objectContaining({
            direction: 'forward'
          })
        }));
      });
      
      // Verify status is updated
      await waitFor(() => {
        expect(getByText('Speed: 5 km/h')).toBeTruthy();
        expect(getByText('Status: running')).toBeTruthy();
      });
      
      // Send stop command
      fireEvent.press(getByTestId('stop-button'));
      
      // Wait for command to be processed
      await waitFor(() => {
        expect(mockSendCommand).toHaveBeenCalledWith(expect.objectContaining({
          type: 'move',
          data: expect.objectContaining({
            direction: 'stop'
          })
        }));
      });
      
      // Verify status is updated
      await waitFor(() => {
        expect(getByText('Speed: 0 km/h')).toBeTruthy();
        expect(getByText('Status: idle')).toBeTruthy();
      });
    });
    
    test('should handle emergency stop command with highest priority', async () => {
      // Mock auth store for authenticated state
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', username: 'admin', role: 'owner' },
        token: 'auth-token-123',
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
      
      // Mock connection store with tractor in motion
      const mockSendCommand = jest.fn().mockImplementation(async (command) => {
        // Simulate successful command
        await Promise.resolve();
        
        // Update mock with new status based on command
        if (command.type === 'emergencyStop') {
          (useConnectionStore as unknown as jest.Mock).mockReturnValue({
            isConnected: true,
            isConnecting: false,
            connectionType: 'direct',
            connectionQuality: 80,
            tractorId: 'tractor-123',
            tractorStatus: {
              batteryLevel: 80,
              batteryTimeRemaining: 120,
              speed: 0,
              position: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 5
              },
              operationStatus: 'idle',
              currentOperation: null,
              motorTemperature: 35,
              safetyStatus: 'normal',
              alerts: [{
                id: 'alert-123',
                type: 'info',
                message: 'Emergency stop activated',
                timestamp: Date.now(),
                resolved: false
              }]
            },
            error: null,
            connectToTractor: jest.fn(),
            disconnectFromTractor: jest.fn(),
            checkConnection: jest.fn(),
            updateTractorStatus: jest.fn(),
            sendCommand: mockSendCommand,
            queueCommand: jest.fn(),
            processQueuedCommands: jest.fn()
          });
        }
        
        return true;
      });
      
      (useConnectionStore as unknown as jest.Mock).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'direct',
        connectionQuality: 80,
        tractorId: 'tractor-123',
        tractorStatus: {
          batteryLevel: 80,
          batteryTimeRemaining: 120,
          speed: 5,
          position: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 5
          },
          operationStatus: 'running',
          currentOperation: null,
          motorTemperature: 35,
          safetyStatus: 'normal',
          alerts: []
        },
        error: null,
        connectToTractor: jest.fn(),
        disconnectFromTractor: jest.fn(),
        checkConnection: jest.fn(),
        updateTractorStatus: jest.fn(),
        sendCommand: mockSendCommand,
        queueCommand: jest.fn(),
        processQueuedCommands: jest.fn()
      });
      
      // Render the app navigator
      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
      
      // Navigate to control screen
      fireEvent.press(getByText('control'));
      
      // Wait for control screen to render
      await waitFor(() => {
        expect(getByTestId('control-screen')).toBeTruthy();
      });
      
      // Verify initial status
      expect(getByText('Speed: 5 km/h')).toBeTruthy();
      expect(getByText('Status: running')).toBeTruthy();
      
      // Send emergency stop command
      fireEvent.press(getByTestId('emergency-stop-button'));
      
      // Wait for command to be processed
      await waitFor(() => {
        expect(mockSendCommand).toHaveBeenCalledWith(expect.objectContaining({
          type: 'emergencyStop'
        }));
      });
      
      // Verify status is updated
      await waitFor(() => {
        expect(getByText('Speed: 0 km/h')).toBeTruthy();
        expect(getByText('Status: idle')).toBeTruthy();
        expect(getByText('Emergency stop activated')).toBeTruthy();
      });
    });
  });
});