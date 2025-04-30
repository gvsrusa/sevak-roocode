import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../utils/i18n';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * SettingsScreen component for app settings
 */
const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const navigation = useNavigation();
  const {
    logout,
    user,
    enableMfa,
    disableMfa,
    isMfaEnabled,
    enableOfflineOperation,
    disableOfflineOperation,
    isOfflineOperationEnabled,
  } = useSupabaseAuthStore();

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.ok'),
          onPress: async () => {
            setLoading(true);
            await logout();
            setLoading(false);
          },
        },
      ]
    );
  };

  /**
   * Handle MFA toggle
   */
  const handleMfaToggle = async () => {
    setLoading(true);
    
    try {
      if (isMfaEnabled()) {
        await disableMfa();
      } else {
        await enableMfa();
      }
    } catch (error) {
      console.error('MFA toggle error:', error);
      Alert.alert(
        t('settings.error'),
        t('settings.mfaToggleError')
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle offline operation toggle
   */
  const handleOfflineOperationToggle = async () => {
    setLoading(true);
    
    try {
      if (isOfflineOperationEnabled()) {
        await disableOfflineOperation();
      } else {
        await enableOfflineOperation();
      }
    } catch (error) {
      console.error('Offline operation toggle error:', error);
      Alert.alert(
        t('settings.error'),
        t('settings.offlineToggleError')
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle dark mode toggle
   */
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // In a real app, you would apply the theme change here
  };

  /**
   * Handle notifications toggle
   */
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    // In a real app, you would update notification settings here
  };

  /**
   * Handle language change
   */
  const handleLanguageChange = (newLocale: string) => {
    console.log(`Language changed to ${newLocale}`);
    // The actual language change is handled by the LanguageSelector component
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          
          <View style={styles.profileSection}>
            <Text style={styles.profileName}>{user?.fullName || user?.email}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={styles.settingLabel}>{t('settings.profile')}</Text>
            <Text style={styles.settingValue}>{'>'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('Security' as never)}
          >
            <Text style={styles.settingLabel}>{t('settings.security')}</Text>
            <Text style={styles.settingValue}>{'>'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.darkMode')}</Text>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.notifications')}</Text>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.enableMfa')}</Text>
            <Switch
              value={isMfaEnabled()}
              onValueChange={handleMfaToggle}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              thumbColor="#FFFFFF"
              disabled={loading}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.enableOfflineMode')}</Text>
            <Switch
              value={isOfflineOperationEnabled()}
              onValueChange={handleOfflineOperationToggle}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              thumbColor="#FFFFFF"
              disabled={loading}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <LanguageSelector onLanguageChange={handleLanguageChange} />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('Help' as never)}
          >
            <Text style={styles.settingLabel}>{t('settings.help')}</Text>
            <Text style={styles.settingValue}>{'>'}</Text>
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.version')}</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
  },
  profileSection: {
    marginBottom: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
  },
  settingValue: {
    fontSize: 16,
    color: '#999999',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;