import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { formatSpeed } from '../utils/helpers';

interface SpeedControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

/**
 * Speed control component
 * Provides a slider for controlling tractor speed
 */
const SpeedControl: React.FC<SpeedControlProps> = ({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
  disabled = false
}) => {
  /**
   * Handle increment button press
   */
  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  /**
   * Handle decrement button press
   */
  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  /**
   * Get color based on speed value
   */
  const getSpeedColor = (speed: number): string => {
    if (speed <= max * 0.3) return '#4CAF50'; // Low speed - green
    if (speed <= max * 0.7) return '#FF9800'; // Medium speed - orange
    return '#F44336'; // High speed - red
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.valueContainer}>
        <Text style={styles.valueLabel}>Current Speed:</Text>
        <Text style={[styles.value, { color: getSpeedColor(value) }]}>
          {formatSpeed(value)}
        </Text>
      </View>

      <View style={styles.controlContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDecrement}
          disabled={disabled || value <= min}
        >
          <Ionicons
            name="remove-circle"
            size={32}
            color={disabled || value <= min ? '#ccc' : '#4CAF50'}
          />
        </TouchableOpacity>

        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={getSpeedColor(value)}
          maximumTrackTintColor="#ccc"
          thumbTintColor={getSpeedColor(value)}
          disabled={disabled}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleIncrement}
          disabled={disabled || value >= max}
        >
          <Ionicons
            name="add-circle"
            size={32}
            color={disabled || value >= max ? '#ccc' : '#4CAF50'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.markersContainer}>
        <Text style={styles.marker}>{formatSpeed(min)}</Text>
        <Text style={styles.marker}>{formatSpeed(max / 2)}</Text>
        <Text style={styles.marker}>{formatSpeed(max)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    padding: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  markersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  marker: {
    fontSize: 12,
    color: '#666',
  },
});

export default SpeedControl;