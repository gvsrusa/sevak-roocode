import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { i18n } from '../utils/i18n';

// Define the available languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', isRTL: false },
  hi: { code: 'hi', name: 'हिन्दी', isRTL: false },
  te: { code: 'te', name: 'తెలుగు', isRTL: false },
  ta: { code: 'ta', name: 'தமிழ்', isRTL: false },
  kn: { code: 'kn', name: 'ಕನ್ನಡ', isRTL: false },
  ml: { code: 'ml', name: 'മലയാളം', isRTL: false },
};

// Define the context type
interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<boolean>;
  isRTL: boolean;
  availableLanguages: typeof LANGUAGES;
}

// Create the context
const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: async () => false,
  isRTL: false,
  availableLanguages: LANGUAGES,
});

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'sevak_language_preference';

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState(Localization.locale.split('-')[0]);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  // Load saved language preference on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage) {
          await changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };

    loadSavedLanguage();
  }, []);

  // Function to change the language
  const changeLanguage = async (languageCode: string) => {
    try {
      // Check if language is supported
      if (!LANGUAGES[languageCode as keyof typeof LANGUAGES]) {
        console.warn(`Language ${languageCode} is not supported, falling back to English`);
        languageCode = 'en';
      }

      // Get RTL status for the language
      const isRTL = LANGUAGES[languageCode as keyof typeof LANGUAGES]?.isRTL || false;

      // Update RTL setting if needed
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        // This requires a reload to take effect properly
        // In a real app, you might want to show a message to the user
        // and reload the app
      }

      // Update i18n locale
      i18n.locale = languageCode;

      // Update state
      setLocaleState(languageCode);
      setIsRTL(isRTL);

      // Save preference
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);

      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  };

  // Context value
  const contextValue: LanguageContextType = {
    locale,
    setLocale: changeLanguage,
    isRTL,
    availableLanguages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// HOC to wrap components that need language context
export const withLanguage = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const languageContext = useContext(LanguageContext);
    return <Component {...props} language={languageContext} />;
  };
};