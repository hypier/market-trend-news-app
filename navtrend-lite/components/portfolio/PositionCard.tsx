import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrendChart, StockLogo } from '../ui';
import { EnhancedPosition } from '../../types/portfolio';
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

interface PositionCardProps {
  position: EnhancedPosition;
  onPress: (symbol: string, exchange: string) => void;
  trendData?: number[]; // 由父组件传递的趋势数据
}

const PositionCardComponent: React.FC<PositionCardProps> = ({ position, onPress, trendData = [] }) => {
  const { t } = useTranslation();
  
  // 使用useMemo优化计算
  const {
    companyName,
    currentPrice,
    averagePrice,
    quantity,
    marketValue,
    changePercent,
    isNeutral,
    isPositive,
    isPercentZero,
    currency
  } = useMemo(() => {
    // 获取公司名称，优先使用增强字段，然后使用position.name，最后fallback到symbol
    const companyName = position.companyName || position.name || position.symbol;

    // 计算收益相关数据
    const currentPrice = position.currentPrice || 0;
    const averagePrice = position.averagePrice || 0;
    const quantity = position.quantity || 0;
    const marketValue = currentPrice * quantity;
    const changePercent = averagePrice > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;
    
    // 判断涨跌状态
    const isNeutral = changePercent === 0;
    const isPositive = changePercent > 0;
    const isPercentZero = Math.abs(changePercent) < 0.01;

    // 获取货币代码
    const currency = position.currency || 'USD';
    
    return {
      companyName,
      currentPrice,
      averagePrice,
      quantity,
      marketValue,
      changePercent,
      isNeutral,
      isPositive,
      isPercentZero,
      currency
    };
  }, [position]);

  
  // 格式化函数 - 使用 pricescale 精确格式化价格
  const formatValue = (value: number) => {
    const pricescale = position.pricescale;
    if (pricescale) {
      const formattedPrice = formatPriceWithPricescale(value, pricescale, false);
      return `${formattedPrice} ${currency.toUpperCase()}`;
    }
    // fallback: 使用 pricescale=100000000 (8位小数) 也能去掉尾随零
    const formattedPrice = formatPriceWithPricescale(value, 100000000, false);
    return `${formattedPrice} ${currency.toUpperCase()}`;
  };
  
  const formatGainLoss = (value: number) => {
    const pricescale = position.pricescale;
    if (pricescale) {
      const absValue = Math.abs(value);
      const formattedPrice = formatPriceWithPricescale(absValue, pricescale, false);
      const sign = value >= 0 ? '+' : '-';
      return `${sign}${formattedPrice} ${currency.toUpperCase()}`;
    }
    // fallback: 使用 pricescale=100000000 (8位小数) 也能去掉尾随零
    const absValue = Math.abs(value);
    const formattedPrice = formatPriceWithPricescale(absValue, 100000000, false);
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${formattedPrice} ${currency.toUpperCase()}`;
  };

  // 处理点击事件
  const handlePress = () => onPress(position.symbol, position.exchange || '');

  return (
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
            logoid={position.logoid}
            baseCurrencyLogoid={position.baseCurrencyLogoid}
            currencyLogoid={position.currencyLogoid}
            symbol={position.symbol || 'Unknown'}
            size={100}
          />
        </View>
      </View>
      
      {/* 头部：股票信息和图表 */}
      <View style={styles.headerRow}>
        <View style={styles.stockInfo}>
          <StockLogo
            logoid={position.logoid}
            baseCurrencyLogoid={position.baseCurrencyLogoid}
            currencyLogoid={position.currencyLogoid}
            symbol={position.symbol || 'Unknown'}
            size="medium"
            style={styles.logo}
          />
          <View style={styles.stockDetails}>
            <View style={styles.symbolRow}>
              <Text style={styles.symbol}>{position.symbol || 'Unknown'}</Text>
              {position.exchange && (
                <View style={styles.exchangeBadge}>
                  <Text style={styles.exchangeText}>{position.exchange}</Text>
                </View>
              )}
            </View>
            <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
          </View>
        </View>
        
        {trendData.length > 0 && (
          <View style={styles.chartContainer}>
            <TrendChart 
              data={trendData} 
              isPositive={!isNeutral && isPositive} 
              width={70} 
              height={24} 
              showMidLine={true} 
              trendMethod="weighted" 
            />
          </View>
        )}
      </View>

      {/* 中部：收益信息（突出显示） */}
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
        <View style={styles.gainMainSection}>
          {position.gainLoss !== undefined && (
            <PriceWithSmallCurrency
              value={formatGainLoss(position.gainLoss)}
              valueStyle={[styles.gainLossMain, { 
                color: isNeutral ? MarketNewsBrand.colors.text.secondary : (isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish) 
              }]}
              currencyStyle={{ opacity: 0.7 }}
            />
          )}
          <Text style={[styles.gainPercentMain, { 
            color: isPercentZero ? MarketNewsBrand.colors.text.secondary : (changePercent > 0 ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish) 
          }]}>
            {formatChangePercent(changePercent)}
          </Text>
        </View>
        
        <View style={styles.valueMainSection}>
          <PriceWithSmallCurrency
            value={formatValue(marketValue)}
            valueStyle={[styles.marketValueMain, {
              color: isNeutral ? MarketNewsBrand.colors.text.primary : (isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish)
            }]}
            currencyStyle={{ opacity: 0.7 }}
          />
          <Text style={styles.marketValueLabel}>{t('components.portfolio.holdings.marketValue')}</Text>
        </View>
      </View>

      {/* 底部：详细信息 */}
      <View style={styles.bottomRow}>
        <View style={styles.detailItemLeft}>
          <View style={styles.detailLabelRow}>
            <Ionicons name="layers-outline" size={10} color={MarketNewsBrand.colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('components.portfolio.holdings.quantity')}</Text>
          </View>
          <Text style={styles.detailValueQuantity}>
            {quantity} {t('components.portfolio.holdings.shares')}
          </Text>
        </View>
        
        <View style={styles.detailItemCenter}>
          <View style={styles.detailLabelRow}>
            <Ionicons name="trending-up-outline" size={10} color={MarketNewsBrand.colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('components.portfolio.holdings.currentPrice')}</Text>
          </View>
          <PriceWithSmallCurrency
            value={formatValue(currentPrice)}
            valueStyle={styles.detailValue}
            currencyStyle={{ opacity: 0.6 }}
          />
        </View>
        
        <View style={styles.detailItemRight}>
          <View style={styles.detailLabelRow}>
            <Ionicons name="pricetag-outline" size={10} color={MarketNewsBrand.colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('components.portfolio.holdings.costPrice')}</Text>
          </View>
          <PriceWithSmallCurrency
            value={formatValue(averagePrice)}
            valueStyle={styles.detailValue}
            currencyStyle={{ opacity: 0.6 }}
          />
        </View>
      </View>
    </Pressable>
  );
};

export const PositionCard = React.memo(PositionCardComponent, (prevProps, nextProps) => {
  // 仅在有关键数据变更时重新渲染
  return (
    prevProps.position.id === nextProps.position.id &&
    prevProps.position.symbol === nextProps.position.symbol &&
    prevProps.position.gainLoss === nextProps.position.gainLoss &&
    prevProps.position.currentPrice === nextProps.position.currentPrice &&
    prevProps.position.averagePrice === nextProps.position.averagePrice &&
    prevProps.position.quantity === nextProps.position.quantity &&
    prevProps.trendData?.length === nextProps.trendData?.length
  );
});

PositionCard.displayName = 'PositionCard';

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    shadowColor: MarketNewsBrand.colors.background.tertiary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // 确保指示条不会超出圆角
  },
  indicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
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
  cardPressed: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    transform: [{ scale: 0.98 }],
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
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginRight: 6,
  },
  exchangeBadge: {
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: MarketNewsBrand.borderRadius.md,
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
  chartContainer: {
    marginLeft: 10,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    marginHorizontal: -2, // 稍微突出卡片边界
    zIndex: 1,
  },
  gainMainSection: {
    flex: 1,
  },
  gainLossMain: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    marginBottom: 3,
  },
  gainPercentMain: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
  },
  valueMainSection: {
    alignItems: 'flex-end',
  },
  marketValueMain: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 2,
  },
  marketValueLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.background.tertiary,
    zIndex: 1,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailItemLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  detailItemCenter: {
    flex: 1,
    alignItems: 'center',
  },
  detailItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailIcon: {
    marginRight: 3,
  },
  detailLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
  },
  detailValue: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.primary,
  },
  detailValueQuantity: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.primary,
  },
}); 