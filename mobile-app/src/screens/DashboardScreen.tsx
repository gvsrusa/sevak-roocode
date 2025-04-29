import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { i18n } from '../utils/i18n';
import { useConnectionStore, TractorStatus } from '../store/connectionStore';
import { formatBatteryTimeRemaining, formatSpeed, formatTemperature } from '../utils/helpers';

// Components
import StatusCard from '../components/StatusCard';
import BatteryIndicator from '../components/BatteryIndicator';
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';
import AlertsList from '../components/AlertsList';
import MapPreview from '../components/MapPreview';

/**
 * Dashboard screen component
 * Shows tractor status, metrics, and alerts
 */
const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    isConnected, 
    connectionType, 
    connectionQuality, 
    tractorStatus, 
    connectToTractor,
    disconnectFromTractor
  } = useConnectionStore();

  // Placeholder for when we don't have a real tractor connection
  const [mockTractorStatus, setMockTractorStatus] = useState<TractorStatus>({
    batteryLevel: 75,
    batteryTimeRemaining: 180, // 3 hours
    speed: 0,
    position: {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 5
    },
    operationStatus: 'idle',
    currentOperation: null,
    motorTemperature: 35,
    safetyStatus: 'normal',
    alerts: [
      {
        id: '1',
        type: 'info',
        message: 'System ready for operation',
        timestamp: Date.now() - 60000, // 1 minute ago
        resolved: true
      }
    ]
  });

  // Use mock data when not connected to a real tractor
  const status = tractorStatus || mockTractorStatus;

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // In a real app, this would refresh data from the tractor
      // For now, we'll just simulate a refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock data for demonstration
      setMockTractorStatus(prev => ({
        ...prev,
        batteryLevel: Math.max(1, Math.min(100, prev.batteryLevel - 1)),
        batteryTimeRemaining: Math.max(10, prev.batteryTimeRemaining - 5),
        motorTemperature: Math.max(25, Math.min(90, prev.motorTemperature + (Math.random() > 0.5 ? 1 : -1))),
      }));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle connect button press
   */
  const handleConnect = async () => {
    try {
      // In a real app, we would show a list of available tractors
      // For now, we'll just connect to a mock tractor
      const success = await connectToTractor('tractor-001');
      
      if (!success) {
        Alert.alert(
          i18n.t('error'),
          i18n.t('connectionFailed'),
          [{ text: i18n.t('ok') }]
        );
      }
    } catch (error) {
      console.error('Connect error:', error);
      Alert.alert(
        i18n.t('error'),
        i18n.t('connectionError'),
        [{ text: i18n.t('ok') }]
      );
    }
  };

  /**
   * Handle disconnect button press
   */
  const handleDisconnect = async () => {
    try {
      await disconnectFromTractor();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  /**
   * Get battery status color based on level
   */
  const getBatteryStatusColor = (level: number): string => {
    if (level <= 10) return '#FF3B30'; // Critical
    if (level <= 20) return '#FF9500'; // Warning
    return '#4CAF50'; // Normal
  };

  /**
   * Get safety status color based on status
   */
  const getSafetyStatusColor = (safetyStatus: string): string => {
    switch (safetyStatus) {
      case 'critical':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      default:
        return '#4CAF50';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status */}
        <View style={styles.connectionContainer}>
          <ConnectionStatusBadge 
            isConnected={isConnected} 
            connectionType={connectionType} 
            connectionQuality={connectionQuality} 
          />
          
          <TouchableOpacity
            style={styles.connectionButton}
            onPress={isConnected ? handleDisconnect : handleConnect}
          >
            <Text style={styles.connectionButtonText}>
              {isConnected ? i18n.t('disconnect') : i18n.t('connect')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map Preview */}
        <MapPreview 
          position={status.position}
          style={styles.mapPreview}
        />

        {/* Status Cards */}
        <View style={styles.cardsContainer}>
          {/* Battery Status */}
          <StatusCard
            title={i18n.t('battery.level')}
            icon="battery-charging"
            iconColor={getBatteryStatusColor(status.batteryLevel)}
          >
            <BatteryIndicator 
              level={status.batteryLevel} 
              style={styles.batteryIndicator} 
            />
            <Text style={styles.batteryText}>
              {status.batteryLevel}% • {formatBatteryTimeRemaining(status.batteryTimeRemaining)}
            </Text>
          </StatusCard>

          {/* Operation Status */}
          <StatusCard
            title={i18n.t('operationStatusTitle')}
            icon="analytics"
            iconColor="#4CAF50"
          >
            <View style={styles.operationStatusContainer}>
              <Text style={styles.operationStatusText}>
                {i18n.t(`operationStatus.${status.operationStatus}`)}
              </Text>
              
              {status.currentOperation && (
                <View style={styles.currentOperationContainer}>
                  <Text style={styles.currentOperationText}>
                    {status.currentOperation.type}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${status.currentOperation.progress}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {status.currentOperation.progress}% • 
                    {formatBatteryTimeRemaining(status.currentOperation.estimatedTimeRemaining)}
                  </Text>
                </View>
              )}
            </View>
          </StatusCard>

          {/* Speed */}
          <StatusCard
            title={i18n.t('speed')}
            icon="speedometer"
            iconColor="#2196F3"
          >
            <Text style={styles.metricValue}>
              {formatSpeed(status.speed)}
            </Text>
          </StatusCard>

          {/* Motor Temperature */}
          <StatusCard
            title={i18n.t('motorTemperature')}
            icon="thermometer"
            iconColor="#FF9800"
          >
            <Text style={styles.metricValue}>
              {formatTemperature(status.motorTemperature)}
            </Text>
          </StatusCard>

          {/* Safety Status */}
          <StatusCard
            title={i18n.t('safetyStatusTitle')}
            icon="shield-checkmark"
            iconColor={getSafetyStatusColor(status.safetyStatus)}
          >
            <Text style={[
              styles.safetyStatusText,
              { color: getSafetyStatusColor(status.safetyStatus) }
            ]}>
              {i18n.t(`safetyStatus.${status.safetyStatus}`)}
            </Text>
          </StatusCard>
        </View>

        {/* Alerts */}
        <View style={styles.alertsContainer}>
          <Text style={styles.sectionTitle}>{i18n.t('recentAlerts')}</Text>
          <AlertsList alerts={status.alerts} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  connectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mapPreview: {
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardsContainer: {
    marginBottom: 16,
  },
  batteryIndicator: {
    marginBottom: 8,
  },
  batteryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  operationStatusContainer: {
    width: '100%',
  },
  operationStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  currentOperationContainer: {
    width: '100%',
  },
  currentOperationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  safetyStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
});

export default DashboardScreen;