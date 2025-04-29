import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface MapPreviewProps {
  position: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  style?: ViewStyle;
}

/**
 * Map preview component
 * Shows tractor location on a map
 */
const MapPreview: React.FC<MapPreviewProps> = ({ position, style }) => {
  // If no position data, show placeholder
  if (!position) {
    return (
      <View style={[styles.placeholderContainer, style]}>
        <Ionicons name="map-outline" size={40} color="#999" />
        <Text style={styles.placeholderText}>Location data unavailable</Text>
      </View>
    );
  }
  
  // Default region with some zoom
  const region = {
    latitude: position.latitude,
    longitude: position.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };
  
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        region={region}
      >
        <Marker
          coordinate={{
            latitude: position.latitude,
            longitude: position.longitude,
          }}
          title="Tractor Location"
        >
          <View style={styles.markerContainer}>
            <Ionicons name="car-outline" size={24} color="#4CAF50" />
          </View>
        </Marker>
      </MapView>
      
      {/* Accuracy indicator */}
      <View style={styles.accuracyContainer}>
        <Ionicons name="locate" size={14} color="#666" />
        <Text style={styles.accuracyText}>
          Accuracy: ±{position.accuracy}m
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  accuracyContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
});

export default MapPreview;