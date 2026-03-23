import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';
import { Logo } from '@/components/ui';

export const TradingHeader: React.FC = () => {
  const { t } = useTranslation();
  
  const handleSearchPress = () => {
    // 导航到搜索页面
    router.push('/search' as any);
  };
  
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Logo 
            size="medium"
            variant="full" 
            showText={true}
          />
        </View>
        <Text style={styles.subtitle}>{t('trading.subtitle')}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.searchButton}
        onPress={handleSearchPress}
        activeOpacity={0.7}
      >
        <Ionicons name="search-outline" size={24} color={MarketNewsBrand.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: MarketNewsBrand.spacing.md,
    paddingBottom: MarketNewsBrand.spacing.sm,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderBottomWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  searchButton: {
    padding: MarketNewsBrand.spacing.xs,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginLeft: MarketNewsBrand.spacing.sm,
  },
});
