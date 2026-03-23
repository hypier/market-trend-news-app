/**
 * 股票详情 - 图表区域组件
 * 
 * 包含股票头部、价格图表和价格卡片
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartContainer } from './ChartContainer';
import { StockDetailHeader } from './StockDetailHeader';
import { StockPriceCard } from './StockPriceCard';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';

interface StockChartSectionProps {
  symbol: string;
  name: string;
  exchange: string;
  logoid?: string;
  baseCurrencyLogoid?: string;
  currencyLogoid?: string;
  currentPrice: number;
  priceChange: number;
  changePercent: number;
  currency: string;
  isPositive: boolean;
  isLoading: boolean;
  onFullscreenPress: () => void;
  onPeriodChange: (period: string) => Promise<void>;
  selectedPeriod?: string;
  // 货币转换相关
  convertedPrice?: number | null;
  targetCurrency?: string;
  // 价格精度
  pricescale?: number;
}

export const StockChartSection = React.memo(function StockChartSection({
  symbol,
  name,
  exchange,
  logoid,
  baseCurrencyLogoid,
  currencyLogoid,
  currentPrice,
  priceChange,
  changePercent,
  currency,
  isPositive,
  isLoading,
  onFullscreenPress,
  onPeriodChange,
  selectedPeriod = '1day',
  convertedPrice,
  targetCurrency,
  pricescale,
}: StockChartSectionProps) {
  
  const handlePeriodChange = React.useCallback(async (period: string) => {
    Logger.info(LogModule.STOCK, '🔄 [Chart Section] 切换周期', { symbol, period });
    await onPeriodChange(period);
  }, [symbol, onPeriodChange]);

  return (
    <>
      {/* 顶部渐变背景区域 */}
      <View style={styles.headerSection}>
        <LinearGradient
          colors={isPositive 
            ? MarketNewsBrand.colors.gradients.success as any 
            : MarketNewsBrand.colors.gradients.error as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        
        {/* 股票信息头部 */}
        <StockDetailHeader
          symbol={symbol}
          name={name}
          exchange={exchange}
          logoid={logoid}
          baseCurrencyLogoid={baseCurrencyLogoid}
          currencyLogoid={currencyLogoid}
          size="large"
          isLoading={isLoading}
          showFullscreenButton={true}
          onFullscreenPress={onFullscreenPress}
        />
        
        {/* 内嵌图表 */}
        <View style={styles.chartContainer}>
          <ChartContainer
            symbol={symbol}
            exchange={exchange}
            currency={currency}
            onPeriodChange={handlePeriodChange}
            selectedPeriod={selectedPeriod}
            showTimeSelector={true}
            height={220}
            onFullscreenRequest={onFullscreenPress}
            externalFullscreenControl={true}
            pricescale={pricescale}
          />
        </View>
      </View>
      
      {/* 价格展示卡片 */}
      <StockPriceCard
        currentPrice={currentPrice}
        priceChange={priceChange}
        changePercent={changePercent}
        currency={currency}
        isPositive={isPositive}
        isLoading={isLoading}
        convertedPrice={convertedPrice}
        targetCurrency={targetCurrency}
        pricescale={pricescale}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在关键 props 变化时重渲染
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.currentPrice === nextProps.currentPrice &&
    prevProps.priceChange === nextProps.priceChange &&
    prevProps.changePercent === nextProps.changePercent &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isPositive === nextProps.isPositive &&
    prevProps.selectedPeriod === nextProps.selectedPeriod
  );
});

const styles = StyleSheet.create({
  headerSection: {
    paddingBottom: 20,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartContainer: {
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

