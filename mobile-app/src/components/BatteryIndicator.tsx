import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface BatteryIndicatorProps {
  level: number;
  style?: ViewStyle;
}

/**
 * Battery indicator component
 * Shows battery level with appropriate colors
 */
const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({ level, style }) => {
  // Ensure level is between 0 and 100
  const batteryLevel = Math.max(0, Math.min(100, level));
  
  // Determine color based on battery level
  const getBatteryColor = (level: number): string => {
    if (level <= 10) return '#FF3B30'; // Critical
    if (level <= 20) return '#FF9500'; // Warning
    return '#4CAF50'; // Normal
  };
  
  const batteryColor = getBatteryColor(batteryLevel);
  
  return (
    <View style={[styles.container, style]}>
      {/* Battery body */}
      <View style={styles.batteryBody}>
        {/* Battery fill */}
        <View 
          style={[
            styles.batteryFill, 
            { 
              width: `${batteryLevel}%`,
              backgroundColor: batteryColor
            }
          ]} 
        />
      </View>
      
      {/* Battery tip */}
      <View style={styles.batteryTip} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  batteryBody: {
    width: 50,
    height: 24,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
  },
  batteryTip: {
    width: 3,
    height: 10,
    backgroundColor: '#333',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});

export default BatteryIndicator;