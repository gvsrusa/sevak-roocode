import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { i18n } from '../utils/i18n';

const { width } = Dimensions.get('window');

/**
 * Component to display an offline notice when the device is not connected to the internet
 */
const OfflineNotice: React.FC = () => {
  const { isNetworkConnected, isInternetReachable } = useNetworkStatus();
  
  // Only show the notice if we're definitely offline
  // (either not connected to a network or connected but internet not reachable)
  const isOffline = !isNetworkConnected || isInternetReachable === false;
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <View style={styles.offlineContainer}>
      <Text style={styles.offlineText}>{i18n.t('offline.notice')}</Text>
      <Text style={styles.offlineSubText}>{i18n.t('offline.queuedCommands')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: '#b52424',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    width,
    position: 'absolute',
    bottom: 0,
    zIndex: 1000,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  offlineSubText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
});

export default OfflineNotice;