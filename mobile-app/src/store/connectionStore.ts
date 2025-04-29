import { create } from 'zustand';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TractorConnectionService } from '../services/TractorConnectionService';

// Tractor connection interface for API calls
export interface TractorConnection {
  sendRequest: (requestType: string, data?: any) => Promise<any>;
  sendCommand: (commandType: string, data?: any) => Promise<boolean>;
  subscribeToEvent: (eventType: string, callback: (data: any) => void) => () => void;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionType: 'direct' | 'cloud' | null;
  connectionQuality: number; // 0-100
  lastConnectedTime: number | null;
  tractorId: string | null;
  tractorStatus: TractorStatus | null;
  tractorConnection: TractorConnection | null;
  error: string | null;
  connectToTractor: (tractorId: string) => Promise<boolean>;
  disconnectFromTractor: () => Promise<boolean>;
  checkConnection: () => Promise<void>;
  updateTractorStatus: (status: Partial<TractorStatus>) => void;
  sendCommand: (command: TractorCommand) => Promise<boolean>;
  queueCommand: (command: TractorCommand) => void;
  processQueuedCommands: () => Promise<void>;
}

export interface TractorStatus {
  batteryLevel: number; // 0-100
  batteryTimeRemaining: number; // minutes
  speed: number; // km/h
  position: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  operationStatus: 'idle' | 'running' | 'paused' | 'error';
  currentOperation: {
    type: string;
    progress: number; // 0-100
    estimatedTimeRemaining: number; // minutes
  } | null;
  motorTemperature: number; // Celsius
  safetyStatus: 'normal' | 'warning' | 'critical';
  alerts: TractorAlert[];
}

export interface TractorAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export interface TractorCommand {
  type: 'move' | 'navigate' | 'stop' | 'emergencyStop' | 'setBoundaries' | 'startOperation' | 'pauseOperation' | 'resumeOperation' | 'stopOperation';
  data: any;
  timestamp: number;
  id: string;
  sent: boolean;
  acknowledged: boolean;
  signature?: string;
}

// Initialize connection service
const connectionService = new TractorConnectionService();

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  connectionType: null,
  connectionQuality: 0,
  lastConnectedTime: null,
  tractorId: null,
  tractorStatus: null,
  tractorConnection: null,
  error: null,
  
  connectToTractor: async (tractorId: string) => {
    try {
      set({ isConnecting: true, error: null });
      
      // Get client ID or generate a new one
      let clientId = await SecureStore.getItemAsync('client_id');
      
      if (!clientId) {
        // Generate a new client ID
        clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        await SecureStore.setItemAsync('client_id', clientId);
      }
      
      // Try to connect with certificate-based authentication
      const result = await connectionService.connect(tractorId, clientId);
      
      if (result.success) {
        // Create mock tractor connection for monitoring API
        const mockTractorConnection: TractorConnection = {
          sendRequest: async (requestType: string, data?: any) => {
            console.log(`Sending request: ${requestType}`, data);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock responses based on request type
            switch (requestType) {
              case 'monitoring.getStatus':
                return {
                  isRunning: true,
                  activeAlerts: [],
                  maintenanceItems: [],
                  metricsCollected: {
                    performance: 120,
                    usage: 48,
                    errors: 5,
                    security: 24,
                    battery: 72,
                    maintenance: 12
                  },
                  lastUpdate: Date.now()
                };
              
              case 'monitoring.getAlerts':
                return [];
              
              case 'monitoring.getMaintenanceSchedule':
                return [
                  {
                    id: 'motor-inspection',
                    name: 'Motor Inspection',
                    lastPerformed: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
                    interval: 100, // hours
                    currentUsage: 80,
                    status: 'scheduled',
                    priority: 'normal'
                  },
                  {
                    id: 'battery-service',
                    name: 'Battery Service',
                    lastPerformed: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
                    interval: 200, // hours
                    currentUsage: 150,
                    status: 'scheduled',
                    priority: 'normal'
                  }
                ];
              
              case 'monitoring.getMetrics':
                const timeRange = data?.timeRange || 3600000;
                const now = Date.now();
                const metrics = {
                  performance: Array.from({ length: 10 }, (_, i) => ({
                    timestamp: now - (timeRange / 10) * (9 - i),
                    system: {
                      cpu: 20 + Math.random() * 30,
                      memory: 40 + Math.random() * 20,
                      uptime: 3600 + i * 360
                    },
                    tractor: {
                      motorLoad: 30 + Math.random() * 40,
                      motorTemperature: 35 + Math.random() * 15,
                      controllerTemperature: 30 + Math.random() * 10
                    },
                    communication: {
                      latency: 50 + Math.random() * 100,
                      packetLoss: Math.random() * 2
                    }
                  })),
                  battery: Array.from({ length: 10 }, (_, i) => ({
                    timestamp: now - (timeRange / 10) * (9 - i),
                    level: 70 + Math.random() * 10,
                    voltage: 12 + Math.random() * 0.5,
                    current: 2 + Math.random() * 3,
                    temperature: 25 + Math.random() * 10,
                    chargeRate: 0,
                    dischargeRate: 2 + Math.random() * 3,
                    estimatedRuntime: 120 + Math.random() * 60,
                    cycleCount: 100 + i
                  }))
                };
                return metrics;
              
              case 'monitoring.runDiagnostics':
                return {
                  summary: {
                    total: 7,
                    passed: 6,
                    failed: 1
                  },
                  results: {
                    system: { status: 'pass', details: { testsRun: 5, testsPassed: 5, warnings: 0, errors: 0 } },
                    motors: { status: 'pass', details: { testsRun: 8, testsPassed: 8, warnings: 0, errors: 0 } },
                    sensors: { status: 'pass', details: { testsRun: 12, testsPassed: 11, warnings: 1, errors: 0 } },
                    battery: { status: 'pass', details: { testsRun: 6, testsPassed: 6, warnings: 0, errors: 0 } },
                    communication: { status: 'fail', details: { testsRun: 4, testsPassed: 3, warnings: 0, errors: 1 } },
                    navigation: { status: 'pass', details: { testsRun: 7, testsPassed: 7, warnings: 0, errors: 0 } },
                    safety: { status: 'pass', details: { testsRun: 10, testsPassed: 10, warnings: 0, errors: 0 } }
                  },
                  timestamp: Date.now()
                };
              
              default:
                return null;
            }
          },
          
          sendCommand: async (commandType: string, data?: any) => {
            console.log(`Sending command: ${commandType}`, data);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Simulate command success
            return true;
          },
          
          subscribeToEvent: (eventType: string, callback: (data: any) => void) => {
            console.log(`Subscribing to event: ${eventType}`);
            
            // Return unsubscribe function
            return () => {
              console.log(`Unsubscribing from event: ${eventType}`);
            };
          }
        };
        
        set({
          isConnected: true,
          isConnecting: false,
          connectionType: result.connectionType,
          connectionQuality: result.connectionQuality || 0,
          lastConnectedTime: Date.now(),
          tractorId,
          tractorConnection: mockTractorConnection
        });
        
        // Start listening for status updates
        connectionService.subscribeToStatusUpdates((status) => {
          get().updateTractorStatus(status);
        });
        
        // Process any queued commands
        get().processQueuedCommands();
        
        return true;
      } else {
        set({
          isConnected: false,
          isConnecting: false,
          error: result.error || 'Failed to connect to tractor'
        });
        return false;
      }
    } catch (error) {
      console.error('Connection error:', error);
      set({
        isConnected: false,
        isConnecting: false,
        error: 'Connection error'
      });
      return false;
    }
  },
  
  disconnectFromTractor: async () => {
    try {
      const result = await connectionService.disconnect();
      
      if (result.success) {
        set({
          isConnected: false,
          connectionType: null,
          connectionQuality: 0,
          tractorStatus: null,
          tractorConnection: null
        });
        return true;
      } else {
        set({ error: result.error || 'Failed to disconnect' });
        return false;
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      set({ error: 'Disconnect error' });
      return false;
    }
  },
  
  checkConnection: async () => {
    try {
      // Check if we have a stored tractor ID
      const tractorId = await SecureStore.getItemAsync('last_connected_tractor');
      
      if (tractorId) {
        set({ tractorId });
        
        // Try to reconnect
        const isConnected = await connectionService.checkConnection(tractorId);
        
        if (isConnected) {
          set({ 
            isConnected: true,
            connectionType: connectionService.getConnectionType(),
            connectionQuality: connectionService.getConnectionQuality(),
            lastConnectedTime: Date.now()
          });
          
          // Start listening for status updates
          connectionService.subscribeToStatusUpdates((status) => {
            get().updateTractorStatus(status);
          });
          
          // Process any queued commands
          get().processQueuedCommands();
        }
      }
    } catch (error) {
      console.error('Check connection error:', error);
    }
  },
  
  updateTractorStatus: (status: Partial<TractorStatus>) => {
    const currentStatus = get().tractorStatus || {
      batteryLevel: 0,
      batteryTimeRemaining: 0,
      speed: 0,
      position: null,
      operationStatus: 'idle',
      currentOperation: null,
      motorTemperature: 0,
      safetyStatus: 'normal',
      alerts: []
    };
    
    set({ 
      tractorStatus: { 
        ...currentStatus, 
        ...status 
      } 
    });
  },
  
  sendCommand: async (command: TractorCommand) => {
    try {
      if (!get().isConnected) {
        // Queue command for later if offline
        get().queueCommand(command);
        return false;
      }
      
      const result = await connectionService.sendCommand(command);
      
      if (result.success) {
        return true;
      } else {
        set({ error: result.error || 'Failed to send command' });
        return false;
      }
    } catch (error) {
      console.error('Send command error:', error);
      set({ error: 'Send command error' });
      return false;
    }
  },
  
  queueCommand: (command: TractorCommand) => {
    // In a real app, we would store this in persistent storage
    // For now, we'll just log it
    console.log('Command queued for later:', command);
    Alert.alert('Offline Mode', 'Command queued for when connection is restored');
  },
  
  processQueuedCommands: async () => {
    // In a real app, we would retrieve queued commands from storage
    // and send them one by one
    console.log('Processing queued commands');
  }
}));