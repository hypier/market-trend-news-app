import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StockLogo } from '@/components/ui/StockLogo';
import type { TVSearchResultItem } from '@/types/tradingview';
import { MarketNewsBrand, getBrandSpacing } from '@/config/brand';

// 导出类型别名以保持兼容性
export type SearchResultItemData = TVSearchResultItem;

interface SearchResultItemProps {
  item: TVSearchResultItem;
  onPress: (id: string) => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, onPress }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.container, isPressed && styles.containerPressed]}
      onPress={() => onPress(item.id)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.95}
    >
      {/* 左侧Logo */}
      <StockLogo
        logoid={item.logoid}
        baseCurrencyLogoid={item['base-currency-logoid']}
        currencyLogoid={item['currency-logoid']}
        symbol={item.symbol}
        size={40}
      />

      {/* 中间信息区域 */}
      <View style={styles.infoContainer}>
        <Text style={styles.symbol} numberOfLines={1}>
          {item.symbol}
        </Text>
        
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
        
        <Text style={styles.typeLabel}>
          {item.type}
        </Text>
      </View>

      {/* 右侧交易所信息 */}
      <View style={styles.exchangeContainer}>
        <Text style={styles.exchangeText} numberOfLines={1}>
          {item.exchange}
        </Text>
        <StockLogo
          logoid={item.source_logoid}
          baseCurrencyLogoid={item['base-currency-logoid']}
          currencyLogoid={item['currency-logoid']}
          symbol={item.symbol}
          size={20}
        />
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingVertical: getBrandSpacing('sm'),
    paddingHorizontal: getBrandSpacing('lg'),
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  containerPressed: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  infoContainer: {
    flex: 1,
    marginLeft: getBrandSpacing('sm'),
    marginRight: getBrandSpacing('sm'),
  },
  symbol: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 2,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
  },
  typeLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    textTransform: 'capitalize' as const,
  },
  exchangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exchangeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    textTransform: 'uppercase' as const,
  },
  arrow: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.light,
  },
});

