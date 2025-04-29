import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  GestureResponderEvent,
  PanResponderGestureState
} from 'react-native';

interface JoystickControlProps {
  size?: number;
  innerSize?: number;
  onMove: (x: number, y: number) => void;
  disabled?: boolean;
}

/**
 * Joystick control component
 * Provides a virtual joystick for directional control
 */
const JoystickControl: React.FC<JoystickControlProps> = ({
  size = 200,
  innerSize = 60,
  onMove,
  disabled = false
}) => {
  // Calculate maximum distance the joystick can move
  const maxDistance = (size - innerSize) / 2;
  
  // Animation values for joystick position
  const pan = useRef(new Animated.ValueXY()).current;
  
  // Current normalized values (-1 to 1)
  const [values, setValues] = useState({ x: 0, y: 0 });
  
  // Create pan responder for touch handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      
      onPanResponderGrant: () => {
        // Keep the current position when the gesture starts
        pan.setOffset({
          x: pan.x as unknown as number,
          y: pan.y as unknown as number
        });
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Calculate distance from center
        const distance = Math.sqrt(
          Math.pow(gestureState.dx, 2) + Math.pow(gestureState.dy, 2)
        );
        
        // If distance is greater than maxDistance, normalize the position
        if (distance > maxDistance) {
          const angle = Math.atan2(gestureState.dy, gestureState.dx);
          const x = Math.cos(angle) * maxDistance;
          const y = Math.sin(angle) * maxDistance;
          
          pan.setValue({ x, y });
        } else {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
        
        // Calculate normalized values (-1 to 1)
        const normalizedX = parseFloat(((pan.x as unknown as number) / maxDistance).toFixed(2));
        const normalizedY = parseFloat(((pan.y as unknown as number) / maxDistance).toFixed(2));
        
        // Update values and call onMove callback
        setValues({ x: normalizedX, y: normalizedY });
        onMove(normalizedX, normalizedY);
      },
      
      onPanResponderRelease: () => {
        // Reset position when released
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5
        }).start();
        
        // Reset values and call onMove callback
        setValues({ x: 0, y: 0 });
        onMove(0, 0);
        
        // Clear offset
        pan.flattenOffset();
      }
    })
  ).current;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: disabled ? 0.5 : 1
        }
      ]}
    >
      {/* Crosshair */}
      <View style={styles.crosshairHorizontal} />
      <View style={styles.crosshairVertical} />
      
      {/* Joystick handle */}
      <Animated.View
        style={[
          styles.joystick,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  joystick: {
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: '90%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 1,
    height: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default JoystickControl;