/**
 * 股票财务数据组件
 * 
 * 显示股票的财务统计数据，包括：
 * - 估值指标（市盈率、市净率、市销率等）
 * - 财务指标（ROE、ROA、毛利率等）
 * - 股息信息
 * - 市场统计
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice, formatMarketCap } from '../../utils/currencyFormatter';

interface StockFinancialsProps {
  /** 财务统计数据 */
  statistics: any;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 货币代码 */
  currency?: string;
}

// 工具函数：格式化数值（使用货币格式化工具）
const formatNumber = (value: number | undefined | null, currency: string = 'USD'): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return formatMarketCap(value, currency);
};

// 格式化百分比
const formatPercent = (value: number | undefined | null): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(2)}%`;
};

// 格式化比率
const formatRatio = (value: number | undefined | null): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value.toFixed(2);
};

export function StockFinancials({ statistics, isLoading, currency = 'USD' }: StockFinancialsProps) {
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
        <Text style={styles.loadingText}>{t('components.stock.financials.loading')}</Text>
      </View>
    );
  }

  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={48} color={MarketNewsBrand.colors.text.tertiary} />
        <Text style={styles.emptyText}>{t('components.stock.financials.noData')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 估值指标 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('components.stock.financials.sections.valuation')}</Text>
        <View style={styles.grid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.marketCap')}</Text>
            <Text style={styles.dataValue}>{formatNumber(statistics.marketCap, currency)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.peRatio')}</Text>
            <Text style={styles.dataValue}>{formatRatio(statistics.trailingPE || statistics.peRatio)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.pbRatio')}</Text>
            <Text style={styles.dataValue}>{formatRatio(statistics.priceToBook || statistics.pbRatio)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.psRatio')}</Text>
            <Text style={styles.dataValue}>{formatRatio(statistics.priceToSales)}</Text>
          </View>
        </View>
      </View>

      {/* 财务指标 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('components.stock.financials.sections.financial')}</Text>
        <View style={styles.grid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.roe')}</Text>
            <Text style={styles.dataValue}>{formatPercent(statistics.returnOnEquity * 100)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.roa')}</Text>
            <Text style={styles.dataValue}>{formatPercent(statistics.returnOnAssets * 100)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.eps')}</Text>
            <Text style={styles.dataValue}>{formatPrice(statistics.eps, currency)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.bookValue')}</Text>
            <Text style={styles.dataValue}>{formatPrice(statistics.bookValuePerShare, currency)}</Text>
          </View>
          {statistics.grossMargin && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.grossMargin')}</Text>
              <Text style={styles.dataValue}>{formatPercent(statistics.grossMargin * 100)}</Text>
            </View>
          )}
          {statistics.profitMargin && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.profitMargin')}</Text>
              <Text style={styles.dataValue}>{formatPercent(statistics.profitMargin * 100)}</Text>
            </View>
          )}
          {statistics.revenue && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.revenue')}</Text>
              <Text style={styles.dataValue}>{formatNumber(statistics.revenue, currency)}</Text>
            </View>
          )}
          {statistics.netIncome && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.netIncome')}</Text>
              <Text style={styles.dataValue}>{formatNumber(statistics.netIncome, currency)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 股息信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('components.stock.financials.sections.dividend')}</Text>
        <View style={styles.grid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.dividendYield')}</Text>
            <Text style={styles.dataValue}>{formatPercent((statistics.forwardDividendYield || statistics.trailingDividendYield || statistics.dividendYield || 0) * 100)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.beta')}</Text>
            <Text style={styles.dataValue}>{formatRatio(statistics.beta)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.sharesOut')}</Text>
            <Text style={styles.dataValue}>
              {statistics.sharesOutstanding ? 
                `${(statistics.sharesOutstanding / 1e9).toFixed(2)}B` : 
                'N/A'
              }
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.low52Week')}</Text>
            <Text style={styles.dataValue}>
              {statistics.fiftyTwoWeekLow ? 
                formatPrice(statistics.fiftyTwoWeekLow, currency) : 
                'N/A'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* 其他统计 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('components.stock.financials.sections.other')}</Text>
        <View style={styles.grid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.high52Week')}</Text>
            <Text style={styles.dataValue}>
              {statistics.fiftyTwoWeekHigh ? 
                formatPrice(statistics.fiftyTwoWeekHigh, currency) : 
                'N/A'
              }
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.avgVolume')}</Text>
            <Text style={styles.dataValue}>
              {(statistics.avgVolume10Day || statistics.avgVolume90Day) ? 
                `${((statistics.avgVolume10Day || statistics.avgVolume90Day) / 1e6).toFixed(2)}M` : 
                'N/A'
              }
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.enterpriseValue')}</Text>
            <Text style={styles.dataValue}>{formatNumber(statistics.enterpriseValue, currency)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.debtToEquity')}</Text>
            <Text style={styles.dataValue}>{formatRatio(statistics.debtToEquity)}</Text>
          </View>
          {statistics.forwardPE && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.forwardPE')}</Text>
              <Text style={styles.dataValue}>{formatRatio(statistics.forwardPE)}</Text>
            </View>
          )}
          {statistics.totalCash && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.totalCash')}</Text>
              <Text style={styles.dataValue}>{formatNumber(statistics.totalCash, currency)}</Text>
            </View>
          )}
          {statistics.totalDebt && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.totalDebt')}</Text>
              <Text style={styles.dataValue}>{formatNumber(statistics.totalDebt, currency)}</Text>
            </View>
          )}
          {statistics.currentRatio && (
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>{t('components.stock.financials.metrics.currentRatio')}</Text>
              <Text style={styles.dataValue}>{formatRatio(statistics.currentRatio)}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.tertiary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataItem: {
    width: '48%',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    padding: 12,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    marginBottom: 12,
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
});

// Export default to ensure proper module resolution
export default StockFinancials; 