/**
 * 排行榜单项组件
 * 显示排行榜中的单个股票/资产信息
 * 参考 MarketItem 的设计风格
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ListItem, StockLogo, TrendChart } from '../ui';
import { MarketNewsBrand } from '@/config/brand';
import { formatChangePercent, formatPriceWithPricescale } from '../../utils/currencyFormatter';
import { safeParseSymbol } from '@/helpers/symbolUtils';
import type { LeaderboardRow } from '../../types/leaderboard';

interface LeaderboardItemProps {
  /** 排行榜数据项 */
  item: LeaderboardRow;
  
  /** 点击回调 */
  onPress: () => void;
  
  /** 趋势数据（可选），用于显示趋势图 */
  trendData?: number[];
}

/**
 * LeaderboardItem 组件
 * 
 * 布局：[Logo] | [股票代码 · 交易所 / 描述] | [趋势图(可选)] | [价格 / 涨跌额 / 涨跌幅]
 */
export const LeaderboardItem = React.memo(({
  item,
  onPress,
  trendData
}: LeaderboardItemProps) => {
  
  // 解析symbol，从复合格式（NASDAQ:AAPL）中提取纯股票代码
  const parsed = safeParseSymbol(item.symbol);
  const stockSymbol = parsed?.symbol || item.symbol;
  const displayExchange = parsed?.exchange || item.exchange;

  // 计算涨跌数据
  // API 返回的字段：changecrypto 是百分比变化
  const changePercent = item.change ?? item.changecrypto ?? 0; // 百分比变化
  const changeAbs = item.changeAbs ?? (item.price && changePercent ? item.price * changePercent / 100 : 0); // 绝对变化值

  const isPositive = changePercent >= 0;
  const changeColor = isPositive
    ? MarketNewsBrand.colors.market.bullish
    : MarketNewsBrand.colors.market.bearish;

  // 智能格式化价格：根据价格大小自动调整小数位数
  const formatSmartPrice = (price: number): string => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    return price.toFixed(8);
  };

  // 格式化涨跌额：小值使用科学计数法
  const formatChangeAbs = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 0.01) return absValue.toFixed(2);
    if (absValue >= 0.0001) return absValue.toFixed(4);
    if (absValue === 0) return '0.00';
    return absValue.toExponential(2); // 科学计数法，如 7.72e-6
  };

  return (
    <ListItem 
      onPress={onPress}
      style={styles.container}
      padding={16}
    >
      {/* Logo */}
      <StockLogo
        logoid={item['base-currency-logoid'] ? undefined : item.logo?.logoid || item.logoid}
        baseCurrencyLogoid={item['base-currency-logoid']}
        currencyLogoid={item['base-currency-logoid'] ? item.logo?.logoid || item.logoid : undefined}
        symbol={stockSymbol}
        size="medium"
        style={styles.logo}
      />
      
      {/* 股票信息区 */}
      <View style={styles.stockInfo}>
        {/* 股票代码和交易所 */}
        <View style={styles.symbolRow}>
          <Text style={styles.symbol} numberOfLines={1}>
            {stockSymbol}
          </Text>
          {displayExchange && (
            <View style={styles.exchangeBadge}>
              <Text style={styles.exchange} numberOfLines={1}>
                {displayExchange}
              </Text>
            </View>
          )}
        </View>
        
        {/* 股票名称/描述 */}
        <Text style={styles.description} numberOfLines={1}>
          {item.description || item.name}
        </Text>
      </View>
      
      {/* 趋势图（可选） */}
      {trendData && trendData.length > 0 && (
        <View style={styles.chartContainer}>
          <TrendChart 
            data={trendData} 
            isPositive={isPositive}
            width={60} 
            height={30} 
            showMidLine={true}
            trendMethod="weighted" 
          />
        </View>
      )}
      
      {/* 价格信息区 */}
      <View style={styles.priceContainer}>
        {/* 当前价格 */}
        <View style={styles.priceRow}>
          <Text style={styles.currency} numberOfLines={1}>
            {(item.currency || 'USD').toUpperCase()}
          </Text>
          <Text style={styles.price} numberOfLines={1}>
            {item.pricescale
              ? formatPriceWithPricescale(item.price, item.pricescale, false)
              : formatSmartPrice(item.price)
            }
          </Text>
        </View>
        
        {/* 涨跌信息行 */}
        <View style={styles.changeRow}>
          {/* 涨跌额（灰色） */}
          <Text
            style={styles.changeValue}
            numberOfLines={1}
          >
            {isPositive ? '+' : '-'}
            {item.pricescale
              ? formatPriceWithPricescale(changeAbs, item.pricescale, false)
              : formatChangeAbs(changeAbs)
            }
          </Text>
          
          {/* 涨跌幅（涨跌色） */}
          <Text 
            style={[styles.changePercent, { color: changeColor }]} 
            numberOfLines={1}
          >
            {formatChangePercent(changePercent)}
          </Text>
        </View>
      </View>
    </ListItem>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只有关键数据变化时才重新渲染
  return (
    prevProps.item.symbol === nextProps.item.symbol &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.change === nextProps.item.change &&
    prevProps.item.changeAbs === nextProps.item.changeAbs &&
    prevProps.item.exchange === nextProps.item.exchange &&
    prevProps.item.pricescale === nextProps.item.pricescale &&
    JSON.stringify(prevProps.trendData) === JSON.stringify(nextProps.trendData)
  );
});

// 添加 displayName 便于调试
LeaderboardItem.displayName = 'LeaderboardItem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.none,
  },
  
  // Logo 样式
  logo: {
    marginRight: 16,
  },
  
  // 股票信息区样式
  stockInfo: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MarketNewsBrand.spacing.xs,
    marginBottom: 4,
  },
  symbol: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
  },
  exchangeBadge: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  exchange: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  description: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
  },
  
  // 趋势图容器
  chartContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  
  // 价格信息区样式
  priceContainer: {
    alignItems: 'flex-end',
    gap: 2, // 价格和涨跌行之间的间距
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4, // 货币代码和价格之间的间距
  },
  currency: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.tertiary, // 弱化的灰色
  },
  price: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  
  // 涨跌信息行（横向排列）
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MarketNewsBrand.spacing.xs, // 涨跌额和涨跌幅之间的间距
  },
  changeValue: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    color: MarketNewsBrand.colors.text.tertiary, // 灰色
  },
  changePercent: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
});
