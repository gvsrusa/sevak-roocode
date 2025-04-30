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
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * ForgotPasswordScreen component for password reset
 */
const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { resetPassword } = useSupabaseAuthStore();

  /**
   * Handle password reset request
   */
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('auth.error'), t('auth.emailRequired'));
      return;
    }

    try {
      setLoading(true);
      
      // Send password reset email using the auth store
      const success = await resetPassword(email);

      if (success) {
        Alert.alert(
          t('auth.passwordResetSent'),
          t('auth.passwordResetInstructions'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Login' as never),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Password reset error:', error.message);
      Alert.alert(t('auth.error'), error.message || t('auth.passwordResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate back to login screen
   */
  const navigateToLogin = () => {
    navigation.goBack();
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
            <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgotPasswordInstructions')}
            </Text>
          </View>

          <View style={styles.formContainer}>
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

            {/* Reset Password Button */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.resetButtonText}>
                  {t('auth.sendResetLink')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={navigateToLogin}
            >
              <Text style={styles.backButtonText}>
                {t('auth.backToLogin')}
              </Text>
            </TouchableOpacity>
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
    textAlign: 'center',
    marginHorizontal: 20,
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
  resetButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
});

export default ForgotPasswordScreen;