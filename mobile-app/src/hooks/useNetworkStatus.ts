import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isNetworkConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  isWifiEnabled: boolean | null;
  details: any;
}

/**
 * Hook to monitor network connectivity status
 * @returns {NetworkStatus} Current network status
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isNetworkConnected: false,
    connectionType: null,
    isInternetReachable: null,
    isWifiEnabled: null,
    details: null
  });

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then(state => {
      updateNetworkStatus(state);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      updateNetworkStatus(state);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Update network status state
   * @param {NetInfoState} state - Network info state
   */
  const updateNetworkStatus = (state: NetInfoState) => {
    setNetworkStatus({
      isNetworkConnected: state.isConnected !== null ? state.isConnected : false,
      connectionType: state.type,
      isInternetReachable: state.isInternetReachable,
      isWifiEnabled: state.isWifiEnabled || null,
      details: state.details
    });
  };

  return networkStatus;
};

export default useNetworkStatus;