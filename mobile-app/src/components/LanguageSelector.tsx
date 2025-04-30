import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/i18n';

interface LanguageSelectorProps {
  onLanguageChange?: (locale: string) => void;
}

/**
 * LanguageSelector component for changing the app language
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
  const { locale, setLocale, isRTL, availableLanguages } = useLanguage();
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState<string | null>(null);

  // Convert languages object to array for FlatList
  const languages = Object.values(availableLanguages);

  /**
   * Handle language selection
   */
  const handleSelectLanguage = async (languageCode: string) => {
    if (languageCode === locale) return;
    
    setLoading(languageCode);
    
    try {
      const success = await setLocale(languageCode);
      
      if (success) {
        // Call the onLanguageChange callback if provided
        if (onLanguageChange) {
          onLanguageChange(languageCode);
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Render a language item
   */
  const renderLanguageItem = ({ item }: { item: typeof languages[0] }) => {
    const isSelected = item.code === locale;
    
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          isSelected && styles.selectedLanguageItem,
        ]}
        onPress={() => handleSelectLanguage(item.code)}
        disabled={loading !== null}
      >
        <Text
          style={[
            styles.languageName,
            isSelected && styles.selectedLanguageName,
          ]}
        >
          {item.name}
        </Text>
        
        {loading === item.code && (
          <ActivityIndicator size="small" color="#007AFF" />
        )}
        
        {isSelected && !loading && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.language')}</Text>
      
      <FlatList
        data={languages}
        renderItem={renderLanguageItem}
        keyExtractor={(item) => item.code}
        style={styles.languageList}
        contentContainerStyle={styles.languageListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333333',
  },
  languageList: {
    width: '100%',
  },
  languageListContent: {
    paddingBottom: 10,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  selectedLanguageItem: {
    backgroundColor: '#E3F2FD',
  },
  languageName: {
    fontSize: 16,
    color: '#333333',
  },
  selectedLanguageName: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default LanguageSelector;