import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../utils/i18n';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import SocialSignIn from '../components/SocialSignIn';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * RegisterScreen component for user registration
 * Supports email/password registration and social sign-in
 */
const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { register } = useSupabaseAuthStore();

  /**
   * Handle email/password registration
   */
  const handleRegister = async () => {
    // Validate inputs
    if (!email || !password || !confirmPassword || !fullName) {
      Alert.alert(t('auth.error'), t('auth.allFieldsRequired'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('auth.error'), t('auth.passwordTooShort'));
      return;
    }

    try {
      setLoading(true);
      
      // Register with email and password using the auth store
      const success = await register(email, password, fullName);

      if (success) {
        // Show success message
        Alert.alert(
          t('auth.registrationSuccess'),
          t('auth.verifyEmail'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Login' as never),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Registration error:', error.message);
      Alert.alert(t('auth.error'), error.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to login screen
   */
  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  /**
   * Handle successful social sign-in
   */
  const handleSocialSignInSuccess = () => {
    // This will be called after successful social sign-in
    console.log('Social sign-in successful');
  };

  /**
   * Handle social sign-in error
   */
  const handleSocialSignInError = (error: string) => {
    console.error('Social sign-in error:', error);
    Alert.alert(t('auth.error'), t('auth.socialSignInFailed'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('auth.registerToContinue')}</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.fullName')}</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('auth.enterFullName')}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.enterEmail')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.enterPassword')}
                secureTextEntry
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('auth.enterConfirmPassword')}
                secureTextEntry
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>{t('auth.register')}</Text>
              )}
            </TouchableOpacity>

            {/* Social Sign-In */}
            <SocialSignIn
              onSuccess={handleSocialSignInSuccess}
              onError={handleSocialSignInError}
            />

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                {t('auth.alreadyHaveAccount')}
              </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>{t('auth.login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  registerButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default RegisterScreen;