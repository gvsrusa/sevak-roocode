import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { i18n } from '../utils/i18n';
import { useAuthStore } from '../store/authStore';
import securityManager from '../utils/security';

type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

/**
 * Login screen component
 */
const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useMfa, setUseMfa] = useState(false);
  const [mfaAvailable, setMfaAvailable] = useState(false);
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loginWithMfa } = useAuthStore();
  
  // Check if biometric authentication is available
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        // Initialize security manager
        await securityManager.initialize();
        
        // In a real implementation, this would check for biometric hardware
        // For now, we'll just set it to true
        setMfaAvailable(true);
      } catch (error) {
        console.error('Error checking biometric availability:', error);
        setMfaAvailable(false);
      }
    };
    
    checkBiometricAvailability();
  }, []);

  /**
   * Handle login button press with optional MFA
   */
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(
        i18n.t('error'),
        i18n.t('enterUsernameAndPassword'),
        [{ text: i18n.t('ok') }]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      // Use MFA login if enabled
      const success = useMfa
        ? await loginWithMfa(username, password)
        : await login(username, password);
      
      if (!success) {
        // Login failed - error alert is shown by the login function
        await securityManager.logSecurityEvent('Login failed', 'warning', {
          username,
          usedMfa: useMfa
        });
      } else {
        await securityManager.logSecurityEvent('Login successful', 'info', {
          username,
          usedMfa: useMfa
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      await securityManager.logSecurityEvent('Login error', 'error', { error });
      Alert.alert(
        i18n.t('error'),
        i18n.t('loginFailed'),
        [{ text: i18n.t('ok') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate to forgot password screen
   */
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo-placeholder.png')}
              style={styles.logo}
              resizeMode="contain"
              // Fallback for when the image doesn't exist yet
              onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
            />
            <Text style={styles.title}>{i18n.t('welcome')}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={i18n.t('username')}
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={i18n.t('password')}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeIcon}
                testID="password-visibility-toggle"
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            
            {mfaAvailable && (
              <View style={styles.mfaContainer}>
                <Text style={styles.mfaText}>{i18n.t('useBiometricAuth')}</Text>
                <Switch
                  value={useMfa}
                  onValueChange={setUseMfa}
                  trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
                  thumbColor={useMfa ? '#4CAF50' : '#f4f3f4'}
                  ios_backgroundColor="#d3d3d3"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" testID="loading-indicator" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {useMfa ? i18n.t('secureLogin') : i18n.t('login')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>{i18n.t('forgotPassword')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  mfaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  mfaText: {
    fontSize: 16,
    color: '#333',
  },
});

export default LoginScreen;