# Sevak Tractor App Setup Guide

This guide will help you resolve dependency conflicts and get the app running.

## Step 1: Download Required Assets

Run the asset download script to create placeholder images:

```bash
chmod +x download-assets.sh
./download-assets.sh
```

## Step 2: Clean Installation

Remove node_modules and package-lock.json to start fresh:

```bash
rm -rf node_modules
rm package-lock.json
```

## Step 3: Install Dependencies with Legacy Peer Deps

Install dependencies with the legacy-peer-deps flag to bypass peer dependency conflicts:

```bash
npm install --legacy-peer-deps
```

## Step 4: Fix React Native Version Issues

If you encounter React Native version issues, try using Expo's install command:

```bash
npx expo install --fix
```

## Step 5: Run the App

Start the Expo development server:

```bash
npm start
```

Then follow the instructions in the terminal to run on your preferred platform:
- Press `a` to run on Android
- Press `i` to run on iOS (Mac only)
- Press `w` to run on web

## Troubleshooting

### Missing Assets
If you encounter missing asset errors, make sure the download-assets.sh script ran successfully and created all required image files in the src/assets directory.

### Dependency Conflicts
If you encounter dependency conflicts, try the following:

1. Use the `--force` flag:
```bash
npm install --force
```

2. Use Expo's install command to fix version mismatches:
```bash
npx expo install --fix
```

3. Manually update package.json with compatible versions:
```bash
npx expo-doctor
```
Then update the versions in package.json based on the recommendations.

### React Native Version Issues
If you encounter React Native version issues, try installing a specific version:

```bash
npm install react-native@0.72.6 --legacy-peer-deps
```

### Metro Bundler Issues
If Metro bundler fails to start, try clearing its cache:

```bash
npx react-native start --reset-cache
```

### Platform-Specific Issues

#### Android
Make sure you have Android Studio installed with an emulator set up, or a physical device connected with USB debugging enabled.

#### iOS (Mac only)
Make sure you have Xcode installed with iOS simulator, or a physical iOS device with Expo Go app installed.