import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TradingViewNewsItem } from '@/types/stock';
import { formatRelativeTime } from '@/utils/timeFormat';
import { MarketNewsBrand } from '@/config/brand';
import { StockLogo } from '@/components/ui/StockLogo';
import { isCompositeSymbol } from '@/helpers/symbolUtils';

interface NewsListItemProps {
  item: TradingViewNewsItem;
}

export const NewsListItem: React.FC<NewsListItemProps> = ({ item }) => {
  const handlePress = () => {
    if (item.id) {
      // 导航到新闻快讯详情页
      router.push(`/news-flash/${encodeURIComponent(item.id)}`);
    }
  };

  // 获取前5个有效的关联股票（必须是 EXCHANGE:SYMBOL 格式）
  // StockLogo 会按优先级自动选择：logoid > base-currency-logoid > currency-logoid
  const relatedSymbols = useMemo(() => {
    if (!item.relatedSymbols) return [];
    
    return item.relatedSymbols
      .filter(symbol => symbol.symbol && isCompositeSymbol(symbol.symbol))
      .slice(0, 5);
  }, [item.relatedSymbols]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Logo 和时间合并在同一行 */}
          <View style={styles.footer}>
            {/* 关联股票 Logo */}
            {relatedSymbols.length > 0 && (
              <View style={styles.relatedSymbolsContainer}>
                {relatedSymbols.map((relatedSymbol, index) => (
                  <View key={`${relatedSymbol.symbol}-${index}`} style={styles.logoWrapper}>
                    <StockLogo 
                      logoid={relatedSymbol.logoid}
                      baseCurrencyLogoid={relatedSymbol['base-currency-logoid']}
                      currencyLogoid={relatedSymbol['currency-logoid']}
                      symbol={relatedSymbol.symbol}
                      size={20}
                    />
                  </View>
                ))}
              </View>
            )}
            
            {/* 右侧：来源和时间 */}
            <View style={styles.metaContainer}>
              {item.provider && (
                <>
                  <Text style={styles.provider}>
                    {item.provider.name}
                  </Text>
                  <Text style={styles.separator}>·</Text>
                </>
              )}
              <Text style={styles.time}>
                {formatRelativeTime(item.published)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* 右箭头 */}
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={MarketNewsBrand.colors.text.tertiary} 
          style={styles.arrow}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: MarketNewsBrand.colors.primary[400],
  },
  content: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    lineHeight: 22,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  relatedSymbolsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    marginRight: 6,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  provider: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  separator: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    marginHorizontal: 5,
  },
  time: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
  },
  arrow: {
    marginLeft: 2,
  },
});

