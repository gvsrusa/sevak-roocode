import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

// Create i18n instance
export const i18n = new I18n({
  en: {
    welcome: 'Welcome to Sevak Tractor Control',
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    connect: 'Connect to Tractor',
    disconnect: 'Disconnect',
    dashboard: 'Dashboard',
    control: 'Control',
    tasks: 'Tasks',
    settings: 'Settings',
    status: {
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      offline: 'Offline Mode',
    },
    battery: {
      level: 'Battery Level',
      remaining: 'Remaining Time',
      critical: 'Battery Critical!',
      low: 'Battery Low',
    },
    controlPanel: {
      manual: 'Manual Control',
      autonomous: 'Autonomous',
      speed: 'Speed',
      direction: 'Direction',
      stop: 'Stop',
      emergencyStop: 'EMERGENCY STOP',
    },
    taskManager: {
      schedule: 'Schedule Task',
      current: 'Current Task',
      upcoming: 'Upcoming Tasks',
      completed: 'Completed Tasks',
      create: 'Create New Task',
      edit: 'Edit Task',
      delete: 'Delete Task',
      confirm: 'Confirm',
      cancel: 'Cancel',
    },
    settingsMenu: {
      language: 'Language',
      notifications: 'Notifications',
      darkMode: 'Dark Mode',
      about: 'About',
      help: 'Help',
      advanced: 'Advanced Settings',
    },
    errors: {
      connection: 'Connection failed',
      authentication: 'Authentication failed',
      permission: 'Permission denied',
      timeout: 'Connection timeout',
      unknown: 'Unknown error',
    },
    offline: {
      notice: 'You are currently offline',
      queuedCommands: 'Commands will be sent when connection is restored',
    },
  },
  hi: {
    welcome: 'सेवक ट्रैक्टर नियंत्रण में आपका स्वागत है',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    connect: 'ट्रैक्टर से कनेक्ट करें',
    disconnect: 'डिस्कनेक्ट करें',
    dashboard: 'डैशबोर्ड',
    control: 'नियंत्रण',
    tasks: 'कार्य',
    settings: 'सेटिंग्स',
    status: {
      connected: 'कनेक्टेड',
      disconnected: 'डिस्कनेक्टेड',
      connecting: 'कनेक्ट हो रहा है...',
      offline: 'ऑफलाइन मोड',
    },
    battery: {
      level: 'बैटरी स्तर',
      remaining: 'शेष समय',
      critical: 'बैटरी क्रिटिकल!',
      low: 'बैटरी कम है',
    },
    controlPanel: {
      manual: 'मैनुअल नियंत्रण',
      autonomous: 'स्वायत्त',
      speed: 'गति',
      direction: 'दिशा',
      stop: 'रोकें',
      emergencyStop: 'आपातकालीन स्टॉप',
    },
    taskManager: {
      schedule: 'कार्य शेड्यूल करें',
      current: 'वर्तमान कार्य',
      upcoming: 'आगामी कार्य',
      completed: 'पूर्ण कार्य',
      create: 'नया कार्य बनाएं',
      edit: 'कार्य संपादित करें',
      delete: 'कार्य हटाएं',
      confirm: 'पुष्टि करें',
      cancel: 'रद्द करें',
    },
    settingsMenu: {
      language: 'भाषा',
      notifications: 'सूचनाएं',
      darkMode: 'डार्क मोड',
      about: 'के बारे में',
      help: 'सहायता',
      advanced: 'उन्नत सेटिंग्स',
    },
    errors: {
      connection: 'कनेक्शन विफल',
      authentication: 'प्रमाणीकरण विफल',
      permission: 'अनुमति अस्वीकृत',
      timeout: 'कनेक्शन टाइमआउट',
      unknown: 'अज्ञात त्रुटि',
    },
    offline: {
      notice: 'आप वर्तमान में ऑफलाइन हैं',
      queuedCommands: 'कनेक्शन बहाल होने पर कमांड भेजे जाएंगे',
    },
  },
});

// Set the locale once at the beginning of your app
i18n.locale = Localization.locale;

// When a value is missing from a language it'll fallback to another language with the key present
i18n.enableFallback = true;

// Set the default locale to use as fallback
i18n.defaultLocale = 'en';

export default i18n;