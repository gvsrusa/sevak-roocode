import { renderHook, act } from '@testing-library/react-hooks';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn()
}));

describe('useNetworkStatus', () => {
  let addEventListenerCallback: ((state: any) => void) | null = null;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the addEventListener to capture the callback
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      addEventListenerCallback = callback;
      return jest.fn(); // Return unsubscribe function
    });
    
    // Mock the initial fetch
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
      isWifiEnabled: true,
      details: { ipAddress: '192.168.1.1' }
    });
  });
  
  test('should initialize with default values', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Initial state before any updates
    expect(result.current).toEqual({
      isNetworkConnected: false,
      connectionType: null,
      isInternetReachable: null,
      isWifiEnabled: null,
      details: null
    });
    
    // Wait for the effect to run and update state
    await waitForNextUpdate();
    
    // State after initial fetch
    expect(result.current).toEqual({
      isNetworkConnected: true,
      connectionType: 'wifi',
      isInternetReachable: true,
      isWifiEnabled: true,
      details: { ipAddress: '192.168.1.1' }
    });
  });
  
  test('should update state when network status changes', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Wait for the initial fetch
    await waitForNextUpdate();
    
    // Simulate network status change
    act(() => {
      if (addEventListenerCallback) {
        addEventListenerCallback({
          isConnected: false,
          type: 'none',
          isInternetReachable: false,
          isWifiEnabled: false,
          details: null
        });
      }
    });
    
    // State after network change
    expect(result.current).toEqual({
      isNetworkConnected: false,
      connectionType: 'none',
      isInternetReachable: false,
      isWifiEnabled: false,
      details: null
    });
  });
  
  test('should handle cellular connection', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Wait for the initial fetch
    await waitForNextUpdate();
    
    // Simulate cellular connection
    act(() => {
      if (addEventListenerCallback) {
        addEventListenerCallback({
          isConnected: true,
          type: 'cellular',
          isInternetReachable: true,
          isWifiEnabled: false,
          details: { cellularGeneration: '4g' }
        });
      }
    });
    
    // State after network change
    expect(result.current).toEqual({
      isNetworkConnected: true,
      connectionType: 'cellular',
      isInternetReachable: true,
      isWifiEnabled: false,
      details: { cellularGeneration: '4g' }
    });
  });
  
  test('should handle unknown internet reachability', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Wait for the initial fetch
    await waitForNextUpdate();
    
    // Simulate unknown internet reachability
    act(() => {
      if (addEventListenerCallback) {
        addEventListenerCallback({
          isConnected: true,
          type: 'wifi',
          isInternetReachable: null,
          isWifiEnabled: true,
          details: { ipAddress: '192.168.1.1' }
        });
      }
    });
    
    // State after network change
    expect(result.current).toEqual({
      isNetworkConnected: true,
      connectionType: 'wifi',
      isInternetReachable: null,
      isWifiEnabled: true,
      details: { ipAddress: '192.168.1.1' }
    });
  });
  
  test('should unsubscribe from NetInfo when unmounted', () => {
    const unsubscribeMock = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribeMock);
    
    const { unmount } = renderHook(() => useNetworkStatus());
    
    // Unmount the hook
    unmount();
    
    // Verify unsubscribe was called
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});