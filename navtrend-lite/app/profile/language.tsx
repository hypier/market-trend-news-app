import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguageStore } from '@/stores';
import { getSupportedLanguages } from '@/config/i18n';
import { MarketNewsBrand } from '@/config/brand';

export default function LanguageScreen() {
  const { t, currentLanguage } = useTranslation();
  const { setLanguage } = useLanguageStore();

  // 获取项目实际支持的所有语言，并将英文排在前面
  const supportedLanguages = getSupportedLanguages().sort((a, b) => {
    if (a.code === 'en') return -1;
    if (b.code === 'en') return 1;
    return 0;
  });

  // 语言对应的国旗 emoji
  const languageFlags: { [key: string]: string } = {
    'zh': '🇨🇳',
    'en': '🇺🇸',
    'de': '🇩🇪',
    'id': '🇮🇩',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'ms': '🇲🇾',
  };

  // 使用 i18n 系统获取语言名称翻译
  const getLanguageDisplayName = (languageCode: string): string => {
    return t(`profile.languages.${languageCode}` as any) || languageCode;
  };

  const handleLanguageSelect = (languageCode: string) => {
    if (languageCode !== currentLanguage) {
      setLanguage(languageCode as any);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.languageList}>
            {supportedLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code && styles.languageItemSelected
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.6}
              >
                <View style={styles.languageInfo}>
                  <View style={styles.languageFlag}>
                    <Text style={styles.flagEmoji}>
                      {languageFlags[language.code] || '🌐'}
                    </Text>
                  </View>
                  <View style={styles.languageText}>
                    <Text style={styles.languageName}>{getLanguageDisplayName(language.code)}</Text>
                    <Text style={styles.languageEnglishName}>{language.nativeName}</Text>
                  </View>
                </View>
                {currentLanguage === language.code && (
                  <Ionicons name="checkmark" size={24} color={MarketNewsBrand.colors.primary[400]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
  },
  sectionTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 16,
  },
  languageList: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  languageItemSelected: {
    backgroundColor: MarketNewsBrand.colors.market.successBg,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  flagEmoji: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 2,
  },
  languageEnglishName: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
  },
}); 