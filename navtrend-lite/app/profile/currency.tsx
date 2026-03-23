import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettingsStore } from '@/stores';
import { CURRENCY_SYMBOLS, CURRENCY_FLAGS, CURRENCY_NAMES_ZH } from '../../utils/currencyFormatter';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';

// 从CURRENCY_SYMBOLS生成支持的货币列表
const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS).map(code => ({
  code,
  nativeName: CURRENCY_NAMES_ZH[code] || code
}));

export default function CurrencyScreen() {
  const { t } = useTranslation();
  const { currency, setCurrency } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  // 使用 i18n 系统获取货币名称翻译
  const getCurrencyDisplayName = (currencyCode: string): string => {
    return t(`profile.currencies.${currencyCode}` as any) || currencyCode;
  };

  const handleCurrencySelect = async (currencyCode: string) => {
    if (currencyCode !== currency) {
      setLoading(true);
      setSelectedCurrency(currencyCode);
      
      try {
        // 使用新的setCurrency方法，它会自动处理数据更新
        await setCurrency(currencyCode as any);
        Logger.info(LogModule.ANALYTICS, `货币已更改为: ${currencyCode}`);
      } catch (error) {
        Logger.error(LogModule.ANALYTICS, '修改货币失败:', error);
      } finally {
        setLoading(false);
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
          <Text style={styles.loadingText}>{t('profile.currency.updating')}</Text>
        </View>
      )}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.currencyList}>
            {SUPPORTED_CURRENCIES.map((currencyItem) => (
              <TouchableOpacity
                key={currencyItem.code}
                style={[
                  styles.currencyItem,
                  (loading && selectedCurrency === currencyItem.code) ? styles.currencyItemLoading :
                  (currency === currencyItem.code && styles.currencyItemSelected)
                ]}
                onPress={() => handleCurrencySelect(currencyItem.code)}
                activeOpacity={0.6}
                disabled={loading}
              >
                <View style={styles.currencyInfo}>
                  <View style={styles.currencyFlag}>
                    <Text style={styles.flagEmoji}>
                      {CURRENCY_FLAGS[currencyItem.code] || '🌐'}
                    </Text>
                  </View>
                  <View style={styles.currencyText}>
                    <Text style={styles.currencyName}>{getCurrencyDisplayName(currencyItem.code)}</Text>
                    <Text style={styles.currencyNativeName}>{currencyItem.nativeName}</Text>
                  </View>
                </View>
                {currency === currencyItem.code && (
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
  currencyList: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    overflow: 'hidden',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  currencyItemSelected: {
    backgroundColor: MarketNewsBrand.colors.market.successBg,
  },
  currencyItemLoading: {
    backgroundColor: MarketNewsBrand.colors.market.successBg,
    opacity: 0.7,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    width: 40,
    height: 40,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  flagEmoji: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
  },
  currencyText: {
    flex: 1,
  },
  currencyName: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 2,
  },
  currencyNativeName: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
  },
  loadingOverlay: {
    position: 'absolute',
    zIndex: 1000,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.primary,
  },
}); 