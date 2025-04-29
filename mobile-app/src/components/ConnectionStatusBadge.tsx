import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { i18n } from '../utils/i18n';

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  connectionType: 'direct' | 'cloud' | 'websocket' | null;
  connectionQuality: number | string;
}

/**
 * Connection status badge component
 * Shows connection status, type, and quality
 */
const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  isConnected,
  connectionType,
  connectionQuality
}) => {
  /**
   * Get connection status text
   */
  const getStatusText = (): string => {
    if (!isConnected) {
      return i18n.t('status.disconnected');
    }
    
    if (connectionType === 'direct') {
      return i18n.t('status.directConnection');
    } else if (connectionType === 'cloud') {
      return i18n.t('status.cloudConnection');
    } else if (connectionType === 'websocket') {
      return i18n.t('status.websocketConnection') || 'WebSocket';
    } else {
      return i18n.t('status.connected');
    }
  };
  
  /**
   * Get connection icon name
   */
  const getIconName = (): string => {
    if (!isConnected) {
      return 'cloud-offline-outline';
    }
    
    if (connectionType === 'direct') {
      return 'wifi';
    } else if (connectionType === 'cloud') {
      return 'cloud-done-outline';
    } else if (connectionType === 'websocket') {
      return 'globe-outline';
    } else {
      return 'checkmark-circle-outline';
    }
  };
  
  /**
   * Get connection quality icon name
   */
  const getQualityIconName = (): string => {
    if (!isConnected) {
      return 'remove';
    }
    
    const quality = typeof connectionQuality === 'string'
      ? (connectionQuality === 'good' ? 80 : connectionQuality === 'medium' ? 50 : 20)
      : connectionQuality;
    
    if (quality >= 70) {
      return 'cellular';
    } else if (quality >= 30) {
      return 'cellular-outline';
    } else {
      return 'warning-outline';
    }
  };
  
  /**
   * Get connection quality color
   */
  const getQualityColor = (): string => {
    if (!isConnected) {
      return '#999';
    }
    
    const quality = typeof connectionQuality === 'string'
      ? (connectionQuality === 'good' ? 80 : connectionQuality === 'medium' ? 50 : 20)
      : connectionQuality;
    
    if (quality >= 70) {
      return '#4CAF50';
    } else if (quality >= 30) {
      return '#FF9800';
    } else {
      return '#F44336';
    }
  };
  
  /**
   * Get connection status color
   */
  const getStatusColor = (): string => {
    if (!isConnected) {
      return '#F44336';
    }
    
    if (connectionType === 'direct') {
      return '#4CAF50';
    } else if (connectionType === 'cloud') {
      return '#2196F3';
    } else if (connectionType === 'websocket') {
      return '#9C27B0';
    } else {
      return '#607D8B';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getIconName() as any} size={16} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{getStatusText()}</Text>
      </View>
      
      {isConnected && (
        <View style={[styles.qualityBadge, { backgroundColor: getQualityColor() }]}>
          <Ionicons name={getQualityIconName() as any} size={12} color="#fff" />
          <Text style={styles.qualityText}>{connectionQuality}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  qualityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});

export default ConnectionStatusBadge;