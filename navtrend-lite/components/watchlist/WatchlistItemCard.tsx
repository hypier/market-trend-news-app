import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  cancelAnimation,
  Easing
} from 'react-native-reanimated';
import { StockLogo } from '../ui';
import { WatchlistItem } from '../../types/stock';
import { useTranslation } from '../../hooks/useTranslation';
import { formatChangePercent, formatPriceWithPricescale } from '../../utils/currencyFormatter';
import { MarketNewsBrand } from '@/config/brand';

/**
 * 分离数值和货币代码的辅助组件
 * 让货币代码显示更小的字体
 */
const PriceWithSmallCurrency: React.FC<{ 
  value: string; 
  valueStyle: any; 
  currencyStyle?: any;
}> = ({ value, valueStyle, currencyStyle }) => {
  // 使用正则表达式分离数值和货币代码
  // 例如 "123.45 USD" -> ["123.45", "USD"]
  const match = value.match(/^([+-]?[\d,.]+)\s+([A-Z]{3,4})$/);
  
  if (match) {
    const [, number, currency] = match;
    return (
      <Text style={valueStyle}>
        {number}
        <Text style={[valueStyle, currencyStyle, { fontSize: (valueStyle?.fontSize || MarketNewsBrand.typography.fontSize.sm) * 0.75 }]}>
          {' '}{currency}
        </Text>
      </Text>
    );
  }
  
  // 如果格式不匹配，直接显示原值
  return <Text style={valueStyle}>{value}</Text>;
};

interface WatchlistItemCardProps {
  item: WatchlistItem;
  onPress: (symbol: string, exchange?: string) => void;
}

const WatchlistItemCardComponent: React.FC<WatchlistItemCardProps> = ({
  item,
  onPress
}) => {
  const { t } = useTranslation();
  
  // 使用useMemo优化计算
  const {
    companyName,
    currentPrice,
    changePercent,
    changeAbs,
    isNeutral,
    isPositive,
    isPercentZero,
    currency,
    pricescale
  } = useMemo(() => {
    // 获取公司名称
    const companyName = item.quote?.name || item.symbol;
    
    // 计算价格相关数据
    const currentPrice = item.quote?.price || 0;
    const changePercent = item.quote?.changePercent || 0;
    const changeAbs = item.quote?.change || 0;
    
    // 判断涨跌状态：优先根据绝对值变化判断，如果为0则根据百分比判断
    // 如果 changeAbs 不为 0，根据 changeAbs 的正负判断
    // 如果 changeAbs 为 0，再根据 changePercent 判断
    const isNeutral = changeAbs === 0 && changePercent === 0;
    const isPositive = changeAbs !== 0 ? changeAbs > 0 : changePercent > 0;
    const isPercentZero = Math.abs(changePercent) < 0.01 && changeAbs === 0;

    // 获取货币代码和价格精度
    const currency = item.quote?.currency || 'USD';
    const pricescale = item.quote?.pricescale || 100;
    
    return {
      companyName,
      currentPrice,
      changePercent,
      changeAbs,
      isNeutral,
      isPositive,
      isPercentZero,
      currency,
      pricescale
    };
  }, [item]);

  
  // 格式化函数 - 使用 pricescale 精确格式化价格
  const formatValue = (value: number) => {
    if (pricescale) {
      const formattedPrice = formatPriceWithPricescale(value, pricescale, false);
      return `${formattedPrice} ${currency.toUpperCase()}`;
    }
    // fallback
    const formattedPrice = formatPriceWithPricescale(value, 100000000, false);
    return `${formattedPrice} ${currency.toUpperCase()}`;
  };
  
  const formatGainLoss = (value: number) => {
    if (pricescale) {
      const absValue = Math.abs(value);
      const formattedPrice = formatPriceWithPricescale(absValue, pricescale, false);
      const sign = value >= 0 ? '+' : '-';
      return `${sign}${formattedPrice} ${currency.toUpperCase()}`;
    }
    // fallback
    const absValue = Math.abs(value);
    const formattedPrice = formatPriceWithPricescale(absValue, 100000000, false);
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${formattedPrice} ${currency.toUpperCase()}`;
  };

  // 处理点击事件
  const handlePress = () => onPress(item.symbol, item.exchange);

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardShadow}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.cardContainer,
            pressed && styles.cardPressed
          ]}
        >
        {/* 左侧涨跌指示条 */}
        <View style={[
          styles.indicatorBar,
          {
            backgroundColor: isNeutral
              ? MarketNewsBrand.colors.text.secondary
              : (isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish)
          }
        ]} />
        
        {/* 背景装饰 Logo - 灰度效果 */}
        <View style={styles.backgroundLogo}>
          <View style={styles.grayscaleOverlay}>
            <StockLogo
              logoid={item.logoid}
              baseCurrencyLogoid={item.baseCurrencyLogoid}
              currencyLogoid={item.currencyLogoid}
              symbol={item.symbol || 'Unknown'}
              size={100}
            />
          </View>
        </View>
        
        {/* 头部：股票信息 */}
        <View style={styles.headerRow}>
          <View style={styles.stockInfo}>
            <StockLogo
              logoid={item.logoid}
              baseCurrencyLogoid={item.baseCurrencyLogoid}
              currencyLogoid={item.currencyLogoid}
              symbol={item.symbol || 'Unknown'}
              size="medium"
              style={styles.logo}
            />
            <View style={styles.stockDetails}>
              <View style={styles.symbolRow}>
                <Text style={styles.symbol}>{item.symbol || 'Unknown'}</Text>
                {item.exchange && (
                  <View style={styles.exchangeBadge}>
                    <Text style={styles.exchangeText}>{item.exchange}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
            </View>
          </View>
        </View>

      {/* 中部：价格和涨跌信息（参考 PositionCard 风格） */}
      <View style={[
        styles.middleRow,
        {
          backgroundColor: isNeutral 
            ? 'rgba(156, 163, 175, 0.05)' 
            : (isPositive 
              ? 'rgba(16, 185, 129, 0.05)' 
              : 'rgba(239, 68, 68, 0.05)')
        }
      ]}>
        {/* 左侧：涨跌信息 */}
        <View style={styles.changeSection}>
          <PriceWithSmallCurrency
            value={formatGainLoss(changeAbs)}
            valueStyle={[styles.changeValue, { 
              color: isPercentZero ? MarketNewsBrand.colors.text.secondary : (isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish) 
            }]}
            currencyStyle={{ opacity: 0.7 }}
          />
          <Text style={[styles.changePercent, { 
            color: isPercentZero ? MarketNewsBrand.colors.text.secondary : (isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish) 
          }]}>
            {formatChangePercent(changePercent)}
          </Text>
        </View>
        
        {/* 右侧：当前价格 */}
        <View style={styles.priceSection}>
          <PriceWithSmallCurrency
            value={formatValue(currentPrice)}
            valueStyle={[styles.priceMain, {
              color: isPercentZero ? MarketNewsBrand.colors.text.secondary : (isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish)
            }]}
            currencyStyle={{ opacity: 0.7 }}
          />
          <Text style={styles.priceLabel}>{t('components.portfolio.holdings.currentPrice')}</Text>
        </View>
      </View>
        </Pressable>
      </View>
    </View>
  );
};

export const WatchlistItemCard = React.memo(WatchlistItemCardComponent, (prevProps, nextProps) => {
  // 仅在有关键数据变更时重新渲染
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.symbol === nextProps.item.symbol &&
    prevProps.item.quote?.price === nextProps.item.quote?.price &&
    prevProps.item.quote?.changePercent === nextProps.item.quote?.changePercent &&
    prevProps.item.quote?.change === nextProps.item.quote?.change
  );
});

WatchlistItemCard.displayName = 'WatchlistItemCard';

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginBottom: 10,
    marginHorizontal: MarketNewsBrand.spacing.sm,
  },
  cardContainer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    shadowColor: MarketNewsBrand.colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // 确保指示条不会超出圆角
  },
  cardTriggered: {
    borderColor: 'rgba(16, 185, 129, 0.3)', // 默认绿色边框（实际颜色会根据涨跌动态设置）
    borderWidth: 1.5,
  },
  cardPressed: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    transform: [{ scale: 0.98 }],
  },
  indicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: MarketNewsBrand.borderRadius.lg,
    borderBottomLeftRadius: MarketNewsBrand.borderRadius.lg,
  },
  backgroundLogo: {
    position: 'absolute',
    right: -30,
    top: -30,
    zIndex: 0,
  },
  grayscaleOverlay: {
    opacity: 0.08,
    transform: [{ rotate: '-10deg' }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 1,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    marginRight: 10,
  },
  stockDetails: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  symbol: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginRight: 6,
  },
  exchangeBadge: {
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: MarketNewsBrand.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exchangeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
    letterSpacing: 0.3,
  },
  companyName: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  alertIconWrapper: {
    marginLeft: 8,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginHorizontal: -2, // 稍微突出卡片边界
    zIndex: 1,
  },
  changeSection: {
    flex: 1,
  },
  changeValue: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginBottom: 3,
  },
  changePercent: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceMain: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
  },
  bottomRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.background.tertiary,
    zIndex: 1,
  },
});

