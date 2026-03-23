/**
 * 股票关键数据组件
 * 
 * 显示股票的关键统计数据，包括：
 * - 市值、PE比率、EPS等财务指标
 * - 52周高低点
 * - 平均成交量、流通股本等
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import type { StockDetail } from '@/types/stock';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice, formatMarketCap, formatVolume } from '../../utils/currencyFormatter';

interface StockKeyDataProps {
  /** 股票详情数据 */
  stockDetail: StockDetail | null;
  /** 股票报价数据 */
  stockQuote: StockDetail | null;
  /** 加载状态 */
  isLoading: boolean;
}

export function StockKeyData({
  stockDetail,
  stockQuote,
  isLoading,
}: StockKeyDataProps) {
  const { t } = useTranslation();
  
  // 优先使用stockQuote中的实时数据，回退到stockDetail
  const exchangeData = stockQuote?.exchange || stockDetail?.exchange;
  const currencyData = stockQuote?.currency || stockDetail?.currency || 'USD';
  const previousCloseData = stockQuote?.previousClose || stockDetail?.previousClose;
  const isMarketOpenData = stockQuote?.isMarketOpen ?? stockDetail?.isMarketOpen;
  const fiftyTwoWeekData = stockQuote?.fiftyTwoWeek || stockDetail?.fiftyTwoWeek || stockDetail?.range52Week;
  
  // 获取货币代码
  const currency = currencyData;

  // 格式化股本
  const formatShares = (shares: number) => {
    if (shares >= 1000000000) {
      return `${(shares / 1000000000).toFixed(2)}B`;
    } else if (shares >= 1000000) {
      return `${(shares / 1000000).toFixed(2)}M`;
    }
    return shares.toString();
  };

  // 格式化百分比
  const formatPercent = (percent: number) => `${(percent || 0).toFixed(2)}%`;

  if (isLoading || (!stockDetail && !stockQuote)) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('components.stock.keyData.title')}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={MarketNewsBrand.colors.primary[400]} />
          <Text style={styles.loadingText}>{t('components.stock.keyData.loading')}</Text>
        </View>
      </View>
    );
  }

  const keyDataItems = [
    {
      label: t('components.stock.keyData.exchange'),
      value: exchangeData || 'N/A',
    },
    {
      label: t('components.stock.keyData.currency'),
      value: currencyData,
    },
    {
      label: t('components.stock.keyData.previousClose'),
      value: formatPrice(previousCloseData || 0, currency),
    },
    {
      label: t('components.stock.keyData.marketStatus'),
      value: isMarketOpenData ? t('components.stock.keyData.open') : t('components.stock.keyData.closed'),
    },
    {
      label: t('components.stock.keyData.high52Week'),
      value: formatPrice(fiftyTwoWeekData?.high || 0, currency),
    },
    {
      label: t('components.stock.keyData.low52Week'),
      value: formatPrice(fiftyTwoWeekData?.low || 0, currency),
    },
    // 可选的扩展数据 - 优先从stockQuote获取，回退到stockDetail
    ...((stockQuote?.marketCap || stockDetail?.marketCap) ? [{
      label: t('components.stock.keyData.marketCap'),
      value: formatMarketCap(stockQuote?.marketCap || stockDetail?.marketCap || 0, currency),
    }] : []),
    ...((stockQuote?.pe || stockDetail?.pe) ? [{
      label: t('components.stock.keyData.peRatio'),
      value: (stockQuote?.pe || stockDetail?.pe || 0).toFixed(2),
    }] : []),
    ...((stockQuote?.eps || stockDetail?.eps) ? [{
      label: t('components.stock.keyData.eps'),
      value: formatPrice(stockQuote?.eps || stockDetail?.eps || 0, currency),
    }] : []),
    ...((stockQuote?.dividend || stockDetail?.dividend) ? [{
      label: t('components.stock.keyData.dividend'),
      value: formatPrice(stockQuote?.dividend || stockDetail?.dividend || 0, currency),
    }] : []),
    ...((stockQuote?.dividendYield || stockDetail?.dividendYield) ? [{
      label: t('components.stock.keyData.dividendYield'),
      value: formatPercent(stockQuote?.dividendYield || stockDetail?.dividendYield || 0),
    }] : []),
    ...((stockQuote?.beta || stockDetail?.beta) ? [{
      label: t('components.stock.keyData.beta'),
      value: (stockQuote?.beta || stockDetail?.beta || 0).toFixed(2),
    }] : []),
    ...((stockQuote?.avgVolume || stockDetail?.avgVolume) ? [{
      label: t('components.stock.keyData.avgVolume'),
      value: formatVolume(stockQuote?.avgVolume || stockDetail?.avgVolume || 0),
    }] : []),
    ...((stockQuote?.sharesOutstanding || stockDetail?.sharesOutstanding) ? [{
      label: t('components.stock.keyData.sharesOutstanding'),
      value: formatShares(stockQuote?.sharesOutstanding || stockDetail?.sharesOutstanding || 0),
    }] : []),
  ];

      return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('components.stock.keyData.title')}</Text>
        <View style={styles.dataGrid}>
        {keyDataItems.map((item, index) => (
          <View key={index} style={styles.dataItem}>
            <Text style={styles.dataLabel}>{item.label}</Text>
            <Text style={styles.dataValue}>{item.value}</Text>
          </View>
        ))}
      </View>
      
      {((stockQuote?.lastUpdated || stockDetail?.lastUpdated) || (stockQuote?.lastUpdate || stockDetail?.lastUpdate)) && (
        <Text style={styles.updateTime}>
          {t('components.stock.keyData.updateTime')}: {new Date(
            stockQuote?.lastUpdated || stockDetail?.lastUpdated || 
            stockQuote?.lastUpdate || stockDetail?.lastUpdate!
          ).toLocaleString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataItem: {
    width: '50%',
    paddingVertical: 12,
    paddingRight: 16,
  },
  dataLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  updateTime: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.background.tertiary,
  },
}); 