# Sevak Tractor Mobile App

Mobile application for controlling and monitoring the Sevak mini tractor, designed for small-scale farmers in rural India.

## Features

- **Manual Control**: Direct control of the tractor with virtual joystick and speed controls
- **Status Monitoring**: Real-time dashboard showing tractor metrics and status
- **Task Scheduling**: Schedule autonomous operations for the tractor
- **Emergency Stop**: Quick access emergency stop functionality
- **Authentication**: Secure login and user management
- **Offline Operation**: Works in areas with intermittent connectivity
- **Multi-language Support**: Available in English, Hindi, Bengali, Tamil, Telugu, and Marathi

## Technology Stack

- React Native with Expo
- TypeScript
- React Navigation
- Zustand for state management
- Socket.IO for real-time communication
- React Native Maps for location visualization

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository
```bash
git clone https://github.com/your-organization/sevak-tractor-app.git
cd sevak-tractor-app/mobile-app
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

4. Run on a device or emulator
```bash
# For iOS
npm run ios
# or
yarn ios

# For Android
npm run android
# or
yarn android
```

## Project Structure

```
mobile-app/
├── src/
│   ├── assets/           # Images, fonts, and other static assets
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API and service integrations
│   ├── store/            # State management
│   ├── utils/            # Utility functions and helpers
│   └── hooks/            # Custom React hooks
├── App.tsx               # Main application component
├── app.json              # Expo configuration
└── package.json          # Project dependencies
```

## Key Components

- **Dashboard**: Shows tractor status, battery level, and alerts
- **Control Panel**: Manual control interface with joystick and speed controls
- **Task Scheduler**: Interface for scheduling autonomous operations
- **Settings**: App configuration, language selection, and user preferences

## Offline Functionality

The app is designed to work in areas with limited connectivity:

- Caches essential tractor data for offline viewing
- Queues control commands when connectivity is temporarily lost
- Synchronizes data when connectivity is restored
- Clearly indicates offline status to the user

## Security Features

- Multi-factor authentication options
- Role-based access control (owner, operator, viewer)
- Encrypted data storage and communication
- Session management and secure token handling

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.