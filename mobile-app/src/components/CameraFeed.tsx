import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConnectionStore } from '../store/connectionStore';

interface CameraFeedProps {
  style?: ViewStyle;
}

/**
 * Camera feed component
 * Shows live camera feed from the tractor
 * Currently shows a placeholder image when not connected
 */
const CameraFeed: React.FC<CameraFeedProps> = ({ style }) => {
  const { isConnected } = useConnectionStore();
  
  // In a real app, we would stream video from the tractor
  // For now, we'll just show a placeholder
  
  if (!isConnected) {
    return (
      <View style={[styles.container, styles.placeholderContainer, style]}>
        <Ionicons name="videocam-outline" size={40} color="#999" />
        <Text style={styles.placeholderText}>Camera feed unavailable</Text>
        <Text style={styles.placeholderSubtext}>Connect to tractor to view camera feed</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      {/* Placeholder image - in a real app, this would be a video stream */}
      <Image
        source={require('../assets/camera-placeholder.svg')}
        style={styles.cameraFeed}
        resizeMode="cover"
        // Fallback for when the image doesn't exist yet
        onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
      />
      
      {/* Camera info overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#fff" />
          <Text style={styles.infoText}>Live</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.infoText}>Front Camera</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  cameraFeed: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  infoOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default CameraFeed;