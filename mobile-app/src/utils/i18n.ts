import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Import translations
import { enTranslations } from '../translations/en';
import { hiTranslations } from '../translations/hi';
import { teTranslations } from '../translations/te';
import { taTranslations } from '../translations/ta';
import { knTranslations } from '../translations/kn';
import { mlTranslations } from '../translations/ml';

// Create a new i18n instance
export const i18n = new I18n({
  en: enTranslations,
  hi: hiTranslations,
  te: teTranslations,
  ta: taTranslations,
  kn: knTranslations,
  ml: mlTranslations,
});

// Set the locale
i18n.locale = Localization.locale;

// When a value is missing from a language it'll fallback to another language with the key present
i18n.enableFallback = true;

// Set the default locale to use as a fallback
i18n.defaultLocale = 'en';

// Create a translation function that can be imported and used throughout the app
export const t = (key: string, params = {}) => {
  return i18n.t(key, params);
};

// Create a hook for functional components
export const useTranslation = () => {
  // We'll use the context directly in components that need to change the language
  // This hook is just for translation functionality
  return { 
    t,
    i18n,
    // Add a helper function to format dates according to the current locale
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(i18n.locale, options).format(date);
    },
    // Add a helper function to format numbers according to the current locale
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(i18n.locale, options).format(number);
    }
  };
};