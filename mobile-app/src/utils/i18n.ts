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
      preferences: 'Preferences',
      offlineMode: 'Offline Mode',
      offlineModeDescription: 'Allow operation without internet connection',
      connection: 'Connection',
      connectionStatus: 'Connection Status',
      selectLanguage: 'Select Language',
      security: 'Security',
      securitySettings: 'Security Settings',
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
    // Added missing translations
    error: 'Error',
    enterUsernameAndPassword: 'Please enter both username and password',
    ok: 'OK',
    loginFailed: 'Login failed. Please try again.',
    forgotPassword: 'Forgot Password?',
    secureLogin: 'Secure Login',
    useBiometricAuth: 'Use biometric authentication',
    loading: 'Loading...',
    
    // Dashboard screen translations
    operationStatusTitle: 'Operation Status',
    operationStatus: {
      idle: 'Idle',
      running: 'Running',
      paused: 'Paused',
      completed: 'Completed',
      error: 'Error'
    },
    speed: 'Speed',
    motorTemperature: 'Motor Temperature',
    safetyStatusTitle: 'Safety Status',
    safetyStatus: {
      normal: 'Normal',
      warning: 'Warning',
      critical: 'Critical'
    },
    recentAlerts: 'Recent Alerts',
    connectionFailed: 'Failed to connect to tractor',
    connectionError: 'Connection error occurred',
    
    // Control screen translations
    hideCamera: 'Hide Camera',
    showCamera: 'Show Camera',
    emergencyStop: 'Emergency Stop',
    confirmEmergencyStop: 'Are you sure you want to perform an emergency stop?',
    cancel: 'Cancel',
    stop: 'Stop',
    
    // Tasks screen translations
    confirmCancelTask: 'Cancel Task',
    confirmCancelTaskMessage: 'Are you sure you want to cancel this task?',
    no: 'No',
    yes: 'Yes',
    createTask: 'Create Task',
    taskName: 'Task Name',
    enterTaskName: 'Enter task name',
    taskTypeTitle: 'Task Type',
    taskType: {
      cutting: 'Cutting',
      loading: 'Loading',
      transport: 'Transport',
      custom: 'Custom'
    },
    scheduledTime: 'Scheduled Time',
    estimatedDuration: 'Estimated Duration',
    field: 'Field',
    enterFieldName: 'Enter field name',
    description: 'Description',
    enterDescription: 'Enter description',
    
    // Settings screen translations
    confirmLogout: 'Confirm Logout',
    confirmLogoutMessage: 'Are you sure you want to log out?',
    close: 'Close'
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
      preferences: 'प्राथमिकताएँ',
      offlineMode: 'ऑफलाइन मोड',
      offlineModeDescription: 'इंटरनेट कनेक्शन के बिना संचालन की अनुमति दें',
      connection: 'कनेक्शन',
      connectionStatus: 'कनेक्शन स्थिति',
      selectLanguage: 'भाषा चुनें',
      security: 'सुरक्षा',
      securitySettings: 'सुरक्षा सेटिंग्स',
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
    // Added missing translations
    error: 'त्रुटि',
    enterUsernameAndPassword: 'कृपया उपयोगकर्ता नाम और पासवर्ड दोनों दर्ज करें',
    ok: 'ठीक है',
    loginFailed: 'लॉगिन विफल। कृपया पुनः प्रयास करें।',
    forgotPassword: 'पासवर्ड भूल गए?',
    secureLogin: 'सुरक्षित लॉगिन',
    useBiometricAuth: 'बायोमेट्रिक प्रमाणीकरण का उपयोग करें',
    loading: 'लोड हो रहा है...',
    
    // Dashboard screen translations
    operationStatusTitle: 'संचालन स्थिति',
    operationStatus: {
      idle: 'निष्क्रिय',
      running: 'चल रहा है',
      paused: 'रुका हुआ',
      completed: 'पूर्ण',
      error: 'त्रुटि'
    },
    speed: 'गति',
    motorTemperature: 'मोटर तापमान',
    safetyStatusTitle: 'सुरक्षा स्थिति',
    safetyStatus: {
      normal: 'सामान्य',
      warning: 'चेतावनी',
      critical: 'गंभीर'
    },
    recentAlerts: 'हाल के अलर्ट',
    connectionFailed: 'ट्रैक्टर से कनेक्ट करने में विफल',
    connectionError: 'कनेक्शन त्रुटि हुई',
    
    // Control screen translations
    hideCamera: 'कैमरा छिपाएं',
    showCamera: 'कैमरा दिखाएं',
    emergencyStop: 'आपातकालीन रोक',
    confirmEmergencyStop: 'क्या आप वाकई आपातकालीन रोक करना चाहते हैं?',
    cancel: 'रद्द करें',
    stop: 'रोकें',
    
    // Tasks screen translations
    confirmCancelTask: 'कार्य रद्द करें',
    confirmCancelTaskMessage: 'क्या आप वाकई इस कार्य को रद्द करना चाहते हैं?',
    no: 'नहीं',
    yes: 'हां',
    createTask: 'कार्य बनाएं',
    taskName: 'कार्य का नाम',
    enterTaskName: 'कार्य का नाम दर्ज करें',
    taskTypeTitle: 'कार्य प्रकार',
    taskType: {
      cutting: 'कटाई',
      loading: 'लोडिंग',
      transport: 'परिवहन',
      custom: 'कस्टम'
    },
    scheduledTime: 'निर्धारित समय',
    estimatedDuration: 'अनुमानित अवधि',
    field: 'खेत',
    enterFieldName: 'खेत का नाम दर्ज करें',
    description: 'विवरण',
    enterDescription: 'विवरण दर्ज करें',
    
    // Settings screen translations
    confirmLogout: 'लॉगआउट की पुष्टि करें',
    confirmLogoutMessage: 'क्या आप वाकई लॉगआउट करना चाहते हैं?',
    close: 'बंद करें'
  },
});

// Set the locale once at the beginning of your app
i18n.locale = Localization.locale;

// When a value is missing from a language it'll fallback to another language with the key present
i18n.enableFallback = true;

// Set the default locale to use as fallback
i18n.defaultLocale = 'en';

export default i18n;