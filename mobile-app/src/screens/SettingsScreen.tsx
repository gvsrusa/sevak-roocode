import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import { i18n } from '../utils/i18n';
import { useAuthStore } from '../store/authStore';
import { useConnectionStore } from '../store/connectionStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Dashboard: undefined;
  Control: undefined;
  Tasks: undefined;
  Settings: undefined;
  SecuritySettings: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

// Supported languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' }
];

/**
 * Settings screen component
 */
const SettingsScreen: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(Localization.locale.split('-')[0]);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { logout, user } = useAuthStore();
  const { isConnected } = useConnectionStore();

  /**
   * Handle dark mode toggle
   */
  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    // In a real app, we would apply the theme change
  };

  /**
   * Handle notifications toggle
   */
  const handleNotificationsToggle = (value: boolean) => {
    setNotifications(value);
    // In a real app, we would update notification settings
  };

  /**
   * Handle offline mode toggle
   */
  const handleOfflineModeToggle = (value: boolean) => {
    setOfflineMode(value);
    // In a real app, we would update offline mode settings
  };

  /**
   * Handle language selection
   */
  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    i18n.locale = languageCode;
    setLanguageModalVisible(false);
    
    // In a real app, we would persist this setting
  };

  /**
   * Handle logout button press
   */
  const handleLogout = () => {
    Alert.alert(
      i18n.t('confirmLogout'),
      i18n.t('confirmLogoutMessage'),
      [
        {
          text: i18n.t('cancel'),
          style: 'cancel'
        },
        {
          text: i18n.t('logout'),
          style: 'destructive',
          onPress: () => {
            logout();
          }
        }
      ]
    );
  };

  /**
   * Get language name by code
   */
  const getLanguageName = (code: string): string => {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  /**
   * Render language item
   */
  const renderLanguageItem = ({ item }: { item: { code: string, name: string } }) => {
    const isSelected = selectedLanguage === item.code;
    
    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.languageItemSelected]}
        onPress={() => handleLanguageSelect(item.code)}
      >
        <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
          {item.name}
        </Text>
        
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.username.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.username || 'User'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Guest'}</Text>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settingsMenu.preferences')}</Text>
          
          {/* Language */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="language-outline" size={24} color="#666" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>{i18n.t('settingsMenu.language')}</Text>
                <Text style={styles.settingValue}>{getLanguageName(selectedLanguage)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          {/* Dark Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{i18n.t('settingsMenu.darkMode')}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkMode ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          
          {/* Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{i18n.t('settingsMenu.notifications')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notifications ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          
          {/* Offline Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="cloud-offline-outline" size={24} color="#666" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>{i18n.t('settingsMenu.offlineMode')}</Text>
                <Text style={styles.settingDescription}>{i18n.t('settingsMenu.offlineModeDescription')}</Text>
              </View>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={handleOfflineModeToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={offlineMode ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settingsMenu.connection')}</Text>
          
          {/* Connection Status */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons
                name={isConnected ? "wifi" : "wifi-outline"}
                size={24}
                color={isConnected ? "#4CAF50" : "#666"}
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingLabel}>{i18n.t('settingsMenu.connectionStatus')}</Text>
                <Text style={[
                  styles.settingValue,
                  { color: isConnected ? '#4CAF50' : '#F44336' }
                ]}>
                  {isConnected ? i18n.t('status.connected') : i18n.t('status.disconnected')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          {/* Security Settings */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('SecuritySettings')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#666" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>Security Settings</Text>
                <Text style={styles.settingValue}>Certificates, MFA, Offline Access</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settingsMenu.about')}</Text>
          
          {/* About */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setAboutModalVisible(true)}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={24} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{i18n.t('settingsMenu.about')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          {/* Help */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={24} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{i18n.t('settingsMenu.help')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>{i18n.t('logout')}</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        {/* Language Selection Modal */}
        <Modal
          visible={languageModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{i18n.t('settingsMenu.selectLanguage')}</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setLanguageModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={LANGUAGES}
                renderItem={renderLanguageItem}
                keyExtractor={(item) => item.code}
                style={styles.languageList}
              />
            </View>
          </View>
        </Modal>

        {/* About Modal */}
        <Modal
          visible={aboutModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAboutModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{i18n.t('settingsMenu.about')}</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setAboutModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>Sevak Tractor Control App</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                
                <Text style={styles.aboutDescription}>
                  The Sevak mini tractor control application provides a user-friendly interface for monitoring and controlling the Sevak autonomous electric agricultural vehicle designed for small-scale farmers in rural India.
                </Text>
                
                <Text style={styles.aboutSectionTitle}>Features:</Text>
                <Text style={styles.aboutText}>• Manual and autonomous tractor control</Text>
                <Text style={styles.aboutText}>• Real-time status monitoring</Text>
                <Text style={styles.aboutText}>• Task scheduling for autonomous operations</Text>
                <Text style={styles.aboutText}>• Offline operation capabilities</Text>
                <Text style={styles.aboutText}>• Multi-language support</Text>
                
                <Text style={styles.aboutSectionTitle}>Developed by:</Text>
                <Text style={styles.aboutText}>Sevak Agricultural Technologies</Text>
                
                <Text style={styles.aboutCopyright}>© 2025 Sevak Agricultural Technologies. All rights reserved.</Text>
              </ScrollView>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAboutModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>{i18n.t('close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    width: '90%',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageItemSelected: {
    backgroundColor: '#4CAF50',
  },
  languageName: {
    fontSize: 16,
    color: '#333',
  },
  languageNameSelected: {
    color: '#fff',
  },
  aboutContent: {
    padding: 16,
    maxHeight: 300,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'justify',
  },
  aboutSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  aboutCopyright: {
    fontSize: 12,
    color: '#999',
    marginTop: 24,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 12,
    margin: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;