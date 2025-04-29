# Sevak Tractor Mobile App

## Installation

```bash
# Install dependencies
npm install
```

## Running the App

### Option 1: Run on Android

```bash
# Start the app on Android
npm run android
```

Requirements:
- Android Studio installed with an emulator set up, OR
- Physical Android device connected via USB with USB debugging enabled

### Option 2: Run on iOS (Mac only)

```bash
# Start the app on iOS
npm run ios
```

Requirements:
- Xcode installed with iOS simulator, OR
- Physical iOS device with Expo Go app installed

### Option 3: Run on Web

```bash
# Start the app on web browser
npm run web
```

### Option 4: Run with Expo Go app

```bash
# Start the Expo development server
npm start
```

Then scan the QR code with:
- Expo Go app on Android
- Camera app on iOS (with Expo Go installed)

## Troubleshooting

### Android Emulator Setup
1. Install Android Studio
2. Go to SDK Manager and install the latest Android SDK
3. Go to AVD Manager and create a new virtual device
4. Start the emulator before running `npm run android`

### iOS Simulator Setup (Mac only)
1. Install Xcode from the App Store
2. Open Xcode and install additional components if prompted
3. Run `npm run ios` to start the simulator

### Physical Device Setup
1. Install Expo Go app from App Store or Google Play Store
2. Make sure your device is on the same network as your development machine
3. Run `npm start` and scan the QR code with your device