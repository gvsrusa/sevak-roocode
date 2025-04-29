import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { i18n } from '../utils/i18n';
import { useConnectionStore } from '../store/connectionStore';
import { generateUniqueId } from '../utils/helpers';

// Components
import JoystickControl from '../components/JoystickControl';
import SpeedControl from '../components/SpeedControl';
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';
import CameraFeed from '../components/CameraFeed';

/**
 * Control screen component
 * Provides manual control of the tractor
 */
const ControlScreen: React.FC = () => {
  const [speed, setSpeed] = useState(0);
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [isManualMode, setIsManualMode] = useState(true);
  const [isCameraVisible, setIsCameraVisible] = useState(true);
  
  const { 
    isConnected, 
    connectionType, 
    connectionQuality, 
    sendCommand 
  } = useConnectionStore();

  /**
   * Handle speed change
   */
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    
    // Send speed command to tractor
    if (isConnected && isManualMode) {
      sendCommand({
        type: 'move',
        data: {
          speed: newSpeed,
          direction: direction
        },
        timestamp: Date.now(),
        id: generateUniqueId(),
        sent: false,
        acknowledged: false
      });
    }
  };

  /**
   * Handle joystick movement
   */
  const handleJoystickMove = (x: number, y: number) => {
    const newDirection = { x, y };
    setDirection(newDirection);
    
    // Send direction command to tractor
    if (isConnected && isManualMode && (x !== 0 || y !== 0)) {
      sendCommand({
        type: 'move',
        data: {
          speed: speed,
          direction: newDirection
        },
        timestamp: Date.now(),
        id: generateUniqueId(),
        sent: false,
        acknowledged: false
      });
    }
  };

  /**
   * Handle stop button press
   */
  const handleStop = () => {
    setSpeed(0);
    setDirection({ x: 0, y: 0 });
    
    // Send stop command to tractor
    if (isConnected) {
      sendCommand({
        type: 'stop',
        data: {},
        timestamp: Date.now(),
        id: generateUniqueId(),
        sent: false,
        acknowledged: false
      });
    }
  };

  /**
   * Handle emergency stop button press
   */
  const handleEmergencyStop = () => {
    Alert.alert(
      i18n.t('emergencyStop'),
      i18n.t('confirmEmergencyStop'),
      [
        {
          text: i18n.t('cancel'),
          style: 'cancel'
        },
        {
          text: i18n.t('stop'),
          style: 'destructive',
          onPress: () => {
            setSpeed(0);
            setDirection({ x: 0, y: 0 });
            
            // Send emergency stop command to tractor
            if (isConnected) {
              sendCommand({
                type: 'emergencyStop',
                data: {
                  reason: 'User initiated emergency stop'
                },
                timestamp: Date.now(),
                id: generateUniqueId(),
                sent: false,
                acknowledged: false
              });
            }
          }
        }
      ]
    );
  };

  /**
   * Handle control mode toggle
   */
  const handleControlModeToggle = (value: boolean) => {
    // If switching to manual mode, stop the tractor first
    if (value && !isManualMode) {
      handleStop();
    }
    
    setIsManualMode(value);
  };

  /**
   * Handle camera toggle
   */
  const handleCameraToggle = () => {
    setIsCameraVisible(!isCameraVisible);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Connection Status */}
        <View style={styles.connectionContainer}>
          <ConnectionStatusBadge 
            isConnected={isConnected} 
            connectionType={connectionType} 
            connectionQuality={connectionQuality} 
          />
        </View>

        {/* Camera Feed */}
        {isCameraVisible && (
          <CameraFeed style={styles.cameraFeed} />
        )}

        {/* Camera Toggle Button */}
        <TouchableOpacity 
          style={styles.cameraToggleButton} 
          onPress={handleCameraToggle}
        >
          <Ionicons 
            name={isCameraVisible ? 'camera-outline' : 'camera-reverse-outline'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.cameraToggleText}>
            {isCameraVisible ? i18n.t('hideCamera') : i18n.t('showCamera')}
          </Text>
        </TouchableOpacity>

        {/* Control Mode Toggle */}
        <View style={styles.controlModeContainer}>
          <Text style={styles.controlModeLabel}>
            {isManualMode ? i18n.t('controlPanel.manual') : i18n.t('controlPanel.autonomous')}
          </Text>
          <Switch
            value={isManualMode}
            onValueChange={handleControlModeToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isManualMode ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        {/* Manual Controls */}
        {isManualMode && (
          <View style={styles.controlsContainer}>
            {/* Speed Control */}
            <View style={styles.speedControlContainer}>
              <Text style={styles.sectionTitle}>{i18n.t('controlPanel.speed')}</Text>
              <SpeedControl 
                value={speed} 
                onChange={handleSpeedChange} 
                disabled={!isConnected}
              />
            </View>

            {/* Direction Control */}
            <View style={styles.joystickContainer}>
              <Text style={styles.sectionTitle}>{i18n.t('controlPanel.direction')}</Text>
              <JoystickControl 
                onMove={handleJoystickMove} 
                disabled={!isConnected}
              />
            </View>

            {/* Stop Button */}
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStop}
              disabled={!isConnected}
            >
              <Ionicons name="stop-circle" size={32} color="#fff" />
              <Text style={styles.stopButtonText}>{i18n.t('controlPanel.stop')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Autonomous Controls */}
        {!isManualMode && (
          <View style={styles.autonomousContainer}>
            <Text style={styles.notImplementedText}>
              Autonomous control features will be implemented in a future update.
            </Text>
          </View>
        )}

        {/* Emergency Stop Button */}
        <TouchableOpacity
          style={styles.emergencyStopButton}
          onPress={handleEmergencyStop}
        >
          <Ionicons name="alert-circle" size={32} color="#fff" />
          <Text style={styles.emergencyStopText}>{i18n.t('controlPanel.emergencyStop')}</Text>
        </TouchableOpacity>
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
    padding: 16,
  },
  connectionContainer: {
    marginBottom: 16,
  },
  cameraFeed: {
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cameraToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  cameraToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  controlModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  controlModeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  controlsContainer: {
    marginBottom: 16,
  },
  speedControlContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  joystickContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stopButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  autonomousContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  notImplementedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emergencyStopButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  emergencyStopText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ControlScreen;