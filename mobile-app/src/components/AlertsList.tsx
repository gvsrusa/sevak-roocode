import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TractorAlert } from '../store/connectionStore';
import { formatDateTime } from '../utils/helpers';

interface AlertsListProps {
  alerts: TractorAlert[];
}

/**
 * Alerts list component
 * Shows a list of tractor alerts
 */
const AlertsList: React.FC<AlertsListProps> = ({ alerts }) => {
  /**
   * Get alert icon name based on type
   */
  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'critical':
        return 'alert-circle';
      case 'error':
        return 'warning';
      case 'warning':
        return 'warning-outline';
      case 'info':
      default:
        return 'information-circle-outline';
    }
  };
  
  /**
   * Get alert color based on type
   */
  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'critical':
        return '#F44336';
      case 'error':
        return '#FF5722';
      case 'warning':
        return '#FF9800';
      case 'info':
      default:
        return '#2196F3';
    }
  };
  
  /**
   * Render alert item
   */
  const renderAlertItem = ({ item }: { item: TractorAlert }) => {
    const iconName = getAlertIcon(item.type);
    const iconColor = getAlertColor(item.type);
    
    return (
      <View style={[
        styles.alertItem,
        item.resolved ? styles.resolvedAlert : null
      ]}>
        <View style={[styles.alertIconContainer, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName as any} size={20} color="#fff" />
        </View>
        
        <View style={styles.alertContent}>
          <Text style={styles.alertMessage}>{item.message}</Text>
          <Text style={styles.alertTime}>{formatDateTime(item.timestamp)}</Text>
        </View>
        
        {item.resolved && (
          <View style={styles.resolvedIconContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>
    );
  };
  
  // If no alerts, show a message
  if (!alerts || alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={styles.emptyText}>No alerts to display</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={alerts}
      renderItem={renderAlertItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  listContent: {
    paddingBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resolvedAlert: {
    opacity: 0.7,
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  resolvedIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  emptyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default AlertsList;