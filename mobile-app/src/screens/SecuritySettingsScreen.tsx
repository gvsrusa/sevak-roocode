import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import securityManager from '../utils/security';

/**
 * Security Settings Screen
 * Allows users to configure security features like MFA and offline operation
 */
const SecuritySettingsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState<{
    available: boolean;
    expiresAt?: Date;
  }>({ available: false });
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const {
    enableMfa,
    disableMfa,
    isMfaEnabled,
    enableOfflineOperation,
    disableOfflineOperation,
    isOfflineOperationEnabled
  } = useAuthStore();

  // Load security settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Initialize security manager if needed
        await securityManager.initialize();
        
        // Load MFA status
        const mfaStatus = isMfaEnabled();
        setMfaEnabled(mfaStatus);
        
        // Load offline operation status
        const offlineStatus = isOfflineOperationEnabled();
        setOfflineEnabled(offlineStatus);
        
        // Load certificate info
        const cert = securityManager.getClientCertificate();
        if (cert) {
          setCertificateInfo({
            available: true,
            expiresAt: new Date(cert.expiresAt)
          });
        }
        
        // Load security logs
        const logs = securityManager.getSecurityLogs();
        setSecurityLogs(logs.slice(-20).reverse()); // Get last 20 logs, most recent first
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading security settings:', error);
        Alert.alert('Error', 'Failed to load security settings');
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  /**
   * Handle MFA toggle
   */
  const handleMfaToggle = async () => {
    try {
      setIsLoading(true);
      
      if (mfaEnabled) {
        // Disable MFA
        const success = await disableMfa();
        if (success) {
          setMfaEnabled(false);
          Alert.alert('Success', 'Biometric authentication disabled');
        } else {
          Alert.alert('Error', 'Failed to disable biometric authentication');
        }
      } else {
        // Enable MFA
        const success = await enableMfa();
        if (success) {
          setMfaEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        } else {
          Alert.alert('Error', 'Failed to enable biometric authentication');
        }
      }
    } catch (error) {
      console.error('Error toggling MFA:', error);
      Alert.alert('Error', 'An error occurred while updating settings');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle offline operation toggle
   */
  const handleOfflineToggle = async () => {
    try {
      setIsLoading(true);
      
      if (offlineEnabled) {
        // Disable offline operation
        const success = await disableOfflineOperation();
        if (success) {
          setOfflineEnabled(false);
          Alert.alert('Success', 'Offline operation disabled');
        } else {
          Alert.alert('Error', 'Failed to disable offline operation');
        }
      } else {
        // Enable offline operation
        const success = await enableOfflineOperation();
        if (success) {
          setOfflineEnabled(true);
          Alert.alert('Success', 'Offline operation enabled');
        } else {
          Alert.alert('Error', 'Failed to enable offline operation');
        }
      }
    } catch (error) {
      console.error('Error toggling offline operation:', error);
      Alert.alert('Error', 'An error occurred while updating settings');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request new certificate
   */
  const handleRequestNewCertificate = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would request a new certificate from the server
      Alert.alert(
        'Confirm',
        'This will request a new certificate from the server. You will need to authenticate again. Continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsLoading(false)
          },
          {
            text: 'Continue',
            onPress: async () => {
              // Simulate certificate request
              const clientId = await securityManager.secureRetrieve('client_id') || '1';
              await securityManager.logSecurityEvent('Certificate renewal requested', 'info');
              
              setTimeout(async () => {
                try {
                  // Generate new certificate request
                  const csrData = await securityManager.generateCertificateRequest(clientId);
                  
                  // Simulate server response with certificate
                  const newCert = {
                    data: await securityManager.generateSecureToken(64),
                    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
                  };
                  
                  // Store certificate
                  await securityManager.storeClientCertificate(newCert);
                  
                  // Update certificate info
                  setCertificateInfo({
                    available: true,
                    expiresAt: new Date(newCert.expiresAt)
                  });
                  
                  Alert.alert('Success', 'New certificate installed');
                } catch (error) {
                  console.error('Error requesting certificate:', error);
                  Alert.alert('Error', 'Failed to request new certificate');
                } finally {
                  setIsLoading(false);
                }
              }, 2000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting certificate:', error);
      Alert.alert('Error', 'Failed to request new certificate');
      setIsLoading(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  /**
   * Get severity icon
   */
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Ionicons name="alert-circle" size={20} color="#d9534f" />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#f0ad4e" />;
      case 'warning':
        return <Ionicons name="warning" size={20} color="#f0ad4e" />;
      case 'info':
      default:
        return <Ionicons name="information-circle" size={20} color="#5bc0de" />;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading security settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Security Settings</Text>
        
        {/* Certificate Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certificate</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>
              {certificateInfo.available ? 'Installed' : 'Not Available'}
            </Text>
          </View>
          
          {certificateInfo.available && certificateInfo.expiresAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expires:</Text>
              <Text style={styles.infoValue}>
                {formatDate(certificateInfo.expiresAt)}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestNewCertificate}
          >
            <Text style={styles.buttonText}>Request New Certificate</Text>
          </TouchableOpacity>
        </View>
        
        {/* Authentication Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face recognition for secure login and critical operations
              </Text>
            </View>
            <Switch
              value={mfaEnabled}
              onValueChange={handleMfaToggle}
              trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
              thumbColor={mfaEnabled ? '#4CAF50' : '#f4f3f4'}
              ios_backgroundColor="#d3d3d3"
            />
          </View>
        </View>
        
        {/* Offline Operation Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Operation</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Offline Commands</Text>
              <Text style={styles.settingDescription}>
                Queue commands when offline to be sent when connection is restored
              </Text>
            </View>
            <Switch
              value={offlineEnabled}
              onValueChange={handleOfflineToggle}
              trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
              thumbColor={offlineEnabled ? '#4CAF50' : '#f4f3f4'}
              ios_backgroundColor="#d3d3d3"
            />
          </View>
        </View>
        
        {/* Security Logs */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowLogs(!showLogs)}
          >
            <Text style={styles.sectionTitle}>Security Logs</Text>
            <Ionicons
              name={showLogs ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#333"
            />
          </TouchableOpacity>
          
          {showLogs && (
            <View style={styles.logsContainer}>
              {securityLogs.length === 0 ? (
                <Text style={styles.noLogsText}>No security logs available</Text>
              ) : (
                securityLogs.map((log, index) => (
                  <View key={index} style={styles.logItem}>
                    <View style={styles.logHeader}>
                      {getSeverityIcon(log.severity)}
                      <Text style={styles.logTimestamp}>
                        {formatDate(new Date(log.timestamp))}
                      </Text>
                    </View>
                    <Text style={styles.logEvent}>{log.event}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontWeight: '600',
    color: '#555',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  logsContainer: {
    marginTop: 10,
  },
  noLogsText: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  logEvent: {
    fontSize: 14,
    color: '#333',
  },
});

export default SecuritySettingsScreen;