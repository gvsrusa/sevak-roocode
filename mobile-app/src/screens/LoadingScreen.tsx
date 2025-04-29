import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { i18n } from '../utils/i18n';

/**
 * Loading screen displayed during app initialization
 */
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/logo-placeholder.png')} 
          style={styles.logo}
          resizeMode="contain"
          // Fallback for when the image doesn't exist yet
          onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
        />
      </View>
      
      <Text style={styles.title}>{i18n.t('welcome')}</Text>
      
      <ActivityIndicator 
        size="large" 
        color="#4CAF50" 
        style={styles.spinner} 
      />
      
      <Text style={styles.loadingText}>
        {i18n.t('loading')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 30,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default LoadingScreen;