// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript in node_modules
config.resolver.sourceExts = process.env.RN_SRC_EXT
  ? [...process.env.RN_SRC_EXT.split(',').filter(Boolean), ...config.resolver.sourceExts]
  : [...config.resolver.sourceExts];

// Add support for TypeScript in node_modules
config.transformer.babelTransformerPath = require.resolve('react-native-typescript-transformer');

// Add support for web
config.resolver.assetExts.push('ttf');
config.resolver.assetExts.push('woff');
config.resolver.assetExts.push('woff2');

module.exports = config;