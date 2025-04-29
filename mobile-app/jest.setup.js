// Mock the expo-secure-store module
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve())
}));

// Mock the @react-native-community/netinfo module
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
    isWifiEnabled: true,
    details: {}
  }))
}));

// Mock the socket.io-client
jest.mock('socket.io-client', () => {
  const mockOn = jest.fn();
  const mockEmit = jest.fn();
  const mockDisconnect = jest.fn();
  const mockConnect = jest.fn();
  
  return {
    io: jest.fn(() => ({
      on: mockOn,
      emit: mockEmit,
      disconnect: mockDisconnect,
      connect: mockConnect,
      connected: false
    }))
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve())
}));

// Mock the react-native-maps module
jest.mock('react-native-maps', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: class MockMapView extends React.Component {
      render() {
        return React.createElement('MockMapView', this.props, this.props.children);
      }
    },
    Marker: class MockMarker extends React.Component {
      render() {
        return React.createElement('MockMarker', this.props, this.props.children);
      }
    },
    Polyline: class MockPolyline extends React.Component {
      render() {
        return React.createElement('MockPolyline', this.props, this.props.children);
      }
    }
  };
});

// Mock the expo-location module
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.78825,
      longitude: -122.4324,
      altitude: 0,
      accuracy: 5,
      altitudeAccuracy: 5,
      heading: 0,
      speed: 0
    },
    timestamp: 1622885743000
  })),
  watchPositionAsync: jest.fn(() => ({
    remove: jest.fn()
  }))
}));

// Mock the react-native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Setup for handling image imports
jest.mock('../src/assets/logo-placeholder.png', () => 'logo-placeholder.png');

// Create mock file for assets
global.__TEST__ = true;