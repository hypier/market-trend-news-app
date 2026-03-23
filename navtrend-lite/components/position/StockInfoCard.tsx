/**
 * 股票信息卡片组件
 * 
 * 用于持仓管理页面显示股票基本信息和当前价格
 * 
 * @author NavTrend Team
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPriceWithCode, formatPriceWithPricescale } from '@/utils/currencyFormatter';
import { MarketNewsBrand } from '@/config/brand';

export interface StockInfoCardProps {
  symbol: string;
  exchange: string;
  name: string;
  currentPrice: number;
  displayPrice: number;        // 显示价格（可能已转换）
  displayCurrency: string;      // 显示货币
  originalCurrency?: string;    // 原始货币（如果不同）
  logoid?: string;
  baseCurrencyLogoid?: string;
  currencyLogoid?: string;
  isLoading?: boolean;
  operationType?: 'add' | 'reduce';  // 操作类型，影响价格颜色
  pricescale?: number;          // 价格精度（pricescale），如 10000 表示 4 位小数
}

/**
 * StockInfoCard 组件
 * 显示股票Logo、代码、名称、交易所和当前价格
 */
export const StockInfoCard: React.FC<StockInfoCardProps> = ({
  symbol,
  exchange,
  name,
  currentPrice,
  displayPrice,
  displayCurrency,
  originalCurrency,
  logoid,
  baseCurrencyLogoid,
  currencyLogoid,
  isLoading = false,
  operationType = 'add',
  pricescale,
}) => {
  // 根据 pricescale 格式化价格
  const formatPriceDisplay = (price: number, currency: string) => {
    if (pricescale) {
      const formattedPrice = formatPriceWithPricescale(price, pricescale, false, currency);
      return `${formattedPrice} ${currency}`;
    }
    return formatPriceWithCode(price, currency);
  };
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 左侧：Logo */}
        <View style={styles.logoContainer}>
          <StockLogo
            logoid={logoid}
            baseCurrencyLogoid={baseCurrencyLogoid}
            currencyLogoid={currencyLogoid}
            symbol={symbol}
            size="medium"
          />
        </View>

        {/* 中间：股票信息（3行布局） */}
        <View style={styles.infoContainer}>
          {/* 第一行：股票代码 */}
          <Text style={styles.symbol}>{symbol}</Text>
          {/* 第二行：交易所徽章 */}
          {exchange && (
            <View style={styles.exchangeBadge}>
              <Text style={styles.exchangeText}>{exchange}</Text>
            </View>
          )}
          {/* 第三行：股票名称 */}
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>

        {/* 右侧：价格 */}
        <View style={styles.priceContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={MarketNewsBrand.colors.primary[400]} />
          ) : (
            <>
              {/* USD原价作为主要显示 */}
              <Text style={[
                styles.displayPrice,
                operationType === 'add' ? styles.displayPriceAdd : styles.displayPriceReduce
              ]}>
                {formatPriceDisplay(currentPrice, originalCurrency || 'USD')}
              </Text>
              {/* 转换后的价格作为次要显示 */}
              {originalCurrency && originalCurrency !== displayCurrency && (
                <View style={[
                  styles.originalPriceContainer,
                  operationType === 'add' ? styles.originalPriceContainerAdd : styles.originalPriceContainerReduce
                ]}>
                  <Text style={[
                    styles.originalPriceLabel,
                    operationType === 'add' ? styles.originalPriceLabelAdd : styles.originalPriceLabelReduce
                  ]}>
                    ≈
                  </Text>
                  <Text style={[
                    styles.originalPrice,
                    operationType === 'add' ? styles.originalPriceAdd : styles.originalPriceReduce
                  ]}>
                    {formatPriceDisplay(displayPrice, displayCurrency)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.md,
    padding: 16,
    paddingVertical: 18,
    marginBottom: 12,
    ...MarketNewsBrand.shadow.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
    gap: 4,
  },
  symbol: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    lineHeight: MarketNewsBrand.typography.fontSize.lg * 1.2,
  },
  exchangeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: MarketNewsBrand.colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  exchangeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.primary[600],
    textTransform: 'uppercase',
  },
  name: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    lineHeight: MarketNewsBrand.typography.fontSize.sm * 1.3,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  displayPrice: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    textAlign: 'right',
  },
  displayPriceAdd: {
    color: MarketNewsBrand.colors.semantic.success,
  },
  displayPriceReduce: {
    color: MarketNewsBrand.colors.semantic.error,
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: MarketNewsBrand.borderRadius.sm,
    borderWidth: 1,
  },
  originalPriceContainerAdd: {
    backgroundColor: MarketNewsBrand.colors.market.successBg,
    borderColor: MarketNewsBrand.colors.semantic.success,
  },
  originalPriceContainerReduce: {
    backgroundColor: MarketNewsBrand.colors.market.dangerBg,
    borderColor: MarketNewsBrand.colors.semantic.error,
  },
  originalPriceLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    marginRight: 3,
  },
  originalPriceLabelAdd: {
    color: MarketNewsBrand.colors.semantic.success,
  },
  originalPriceLabelReduce: {
    color: MarketNewsBrand.colors.semantic.error,
  },
  originalPrice: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  originalPriceAdd: {
    color: MarketNewsBrand.colors.semantic.success,
  },
  originalPriceReduce: {
    color: MarketNewsBrand.colors.semantic.error,
  },
});

