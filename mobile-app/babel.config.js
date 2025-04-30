module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'FACEBOOK_APP_ID',
            'FACEBOOK_APP_SECRET',
            'APPLE_SERVICE_ID',
            'APPLE_TEAM_ID',
            'APP_ENV',
            'APP_URL'
          ],
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};