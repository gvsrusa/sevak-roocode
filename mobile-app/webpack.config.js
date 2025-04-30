const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // Create the default Expo webpack config
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add support for .env files
  config.plugins.push(
    new (require('dotenv-webpack'))({
      path: path.resolve(__dirname, '.env'),
      safe: true,
      systemvars: true,
      silent: true,
    })
  );

  // Add polyfills for web
  if (config.resolve.alias) {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-webview': 'react-native-web-webview',
      // Add polyfills for libraries that don't have web support
      'react-native-maps': 'react-native-web-maps',
    };
  }

  // Use the web entry point
  if (env.mode === 'production') {
    config.entry = path.resolve(__dirname, 'src/web/index.js');
  }

  // Add support for web-specific file extensions
  config.resolve.extensions = [
    '.web.tsx',
    '.web.ts',
    '.web.jsx',
    '.web.js',
    ...config.resolve.extensions,
  ];

  // Add support for PWA
  if (env.mode === 'production') {
    config.plugins.push(
      new (require('workbox-webpack-plugin')).GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      })
    );

    // Add web app manifest
    config.plugins.push(
      new (require('webpack-pwa-manifest'))({
        name: 'Sevak Tractor Control',
        short_name: 'Sevak',
        description: 'Mobile app for Sevak mini tractor remote control',
        background_color: '#ffffff',
        theme_color: '#007AFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: path.resolve('src/assets/icon.png'),
            sizes: [96, 128, 192, 256, 384, 512],
            destination: path.join('icons'),
          },
        ],
      })
    );
  }

  // Add HTML template
  config.plugins.forEach((plugin) => {
    if (plugin.constructor.name === 'HtmlWebpackPlugin') {
      plugin.options.template = path.resolve(__dirname, 'src/web/index.html');
    }
  });

  return config;
};