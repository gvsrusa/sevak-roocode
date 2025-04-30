import 'dotenv/config';

export default {
  expo: {
    name: 'Sevak Tractor Control',
    slug: 'sevak-tractor-control',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    splash: {
      image: './src/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sevak.tractorcontrol',
      buildNumber: '1.0.0',
      infoPlist: {
        NSCameraUsageDescription: 'This app uses the camera to display the tractor camera feed.',
        NSLocationWhenInUseUsageDescription: 'This app uses your location to display it on the map.',
        NSLocationAlwaysUsageDescription: 'This app uses your location to display it on the map.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'This app uses your location to display it on the map.',
        NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      package: 'com.sevak.tractorcontrol',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
      ],
    },
    web: {
      favicon: './src/assets/favicon.png',
      name: 'Sevak Tractor Control',
      shortName: 'Sevak',
      description: 'Mobile app for Sevak mini tractor remote control',
      lang: 'en',
      themeColor: '#007AFF',
      backgroundColor: '#FFFFFF',
      startUrl: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
    },
    plugins: [
      'expo-localization',
      'expo-secure-store',
      'expo-location',
      'expo-local-authentication',
      'expo-web-browser',
      'expo-auth-session',
    ],
    extra: {
      // Pass environment variables to the app
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
      APPLE_SERVICE_ID: process.env.APPLE_SERVICE_ID,
      APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
      eas: {
        projectId: 'your-eas-project-id',
      },
    },
    scheme: 'sevaktractor',
  },
};