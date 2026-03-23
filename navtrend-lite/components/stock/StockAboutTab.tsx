/**
 * 股票详情 - About 标签页
 * 
 * 展示股票的财务信息和市场信息
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { useTranslation } from '@/hooks/useTranslation';
import type { TradingViewQuote, TradingViewStockInfo } from '@/types/tradingview';

interface StockAboutTabProps {
  quote: TradingViewQuote | null;
  stockInfo: TradingViewStockInfo | null;
}

export const StockAboutTab = React.memo(function StockAboutTab({ quote, stockInfo }: StockAboutTabProps) {
  const { t } = useTranslation();

  // 格式化市值显示
  const formatMarketCap = (marketCap: number, currencyCode: string = 'USD'): string => {
    if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(2)}T ${currencyCode}`;
    if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(2)}B ${currencyCode}`;
    if (marketCap >= 1e6) return `${(marketCap / 1e6).toFixed(2)}M ${currencyCode}`;
    return `${marketCap.toLocaleString()} ${currencyCode}`;
  };

  const hasFinancialData = quote && (
    quote.market_cap_basic || 
    quote.sector || 
    quote.industry || 
    quote.earnings_per_share_basic_ttm || 
    quote.beta_1_year
  );

  return (
    <View style={styles.container}>
      
      {/* 📊 财务数据 */}
      {hasFinancialData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('stock.financialInfo', { defaultValue: 'Financial Information' })}
          </Text>
          
          {quote!.market_cap_basic && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.marketCap', { defaultValue: 'Market Cap' })}
              </Text>
              <Text style={styles.infoValue}>
                {formatMarketCap(quote!.market_cap_basic, quote!.currency_code)}
              </Text>
            </View>
          )}
          
          {quote!.sector && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.sector', { defaultValue: 'Sector' })}
              </Text>
              <Text style={styles.infoValue}>{quote!.sector}</Text>
            </View>
          )}
          
          {quote!.industry && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.industry', { defaultValue: 'Industry' })}
              </Text>
              <Text style={styles.infoValue}>{quote!.industry}</Text>
            </View>
          )}
          
          {quote!.earnings_per_share_basic_ttm !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.eps', { defaultValue: 'EPS (TTM)' })}
              </Text>
              <Text style={[
                styles.infoValue,
                { color: quote!.earnings_per_share_basic_ttm >= 0 ? '#00C087' : '#EF5350' }
              ]}>
                {quote!.earnings_per_share_basic_ttm.toFixed(2)} {quote!.currency_code || 'USD'}
              </Text>
            </View>
          )}
          
          {quote!.beta_1_year !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.beta', { defaultValue: 'Beta (1Y)' })}
              </Text>
              <Text style={styles.infoValue}>
                {quote!.beta_1_year.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* 📊 市场信息 */}
      {stockInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('stock.marketInfo', { defaultValue: 'Market Information' })}
          </Text>
          
          {stockInfo.country && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.country', { defaultValue: 'Country' })}
              </Text>
              <Text style={styles.infoValue}>{stockInfo.country}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t('stock.exchange', { defaultValue: 'Exchange' })}
            </Text>
            <Text style={styles.infoValue}>
              {quote?.exchange || stockInfo.listed_exchange || stockInfo.exchange || '-'}
              {stockInfo.exchange_listed_name && 
                stockInfo.exchange_listed_name !== stockInfo.exchange && 
                ` (${stockInfo.exchange_listed_name})`}
            </Text>
          </View>
          
          {(stockInfo.currency_code || stockInfo.currency_id) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.currency', { defaultValue: 'Currency' })}
              </Text>
              <Text style={styles.infoValue}>
                {stockInfo.currency_code || stockInfo.currency_id}
              </Text>
            </View>
          )}
          
          {stockInfo.timezone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.timezone', { defaultValue: 'Timezone' })}
              </Text>
              <Text style={styles.infoValue}>{stockInfo.timezone}</Text>
            </View>
          )}
          
          {(stockInfo.session || quote?.current_session) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('stock.tradingHours', { defaultValue: 'Trading Hours' })}
              </Text>
              <Text style={styles.infoValue}>
                {stockInfo.session_display || stockInfo.session || '-'}
                {quote?.current_session && (
                  <Text style={{ color: '#666' }}>
                    {' '}({
                      quote.current_session === 'market' 
                        ? t('stock.market', { defaultValue: 'Market' }) :
                      quote.current_session === 'out_of_session' 
                        ? t('stock.outOfSession', { defaultValue: 'Out of Session' }) :
                      quote.current_session === 'regular' 
                        ? t('stock.regular', { defaultValue: 'Regular' }) :
                      quote.current_session
                    })
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在数据变化时重渲染
  if (!prevProps.quote && !nextProps.quote && !prevProps.stockInfo && !nextProps.stockInfo) return true;
  if (prevProps.quote !== nextProps.quote || prevProps.stockInfo !== nextProps.stockInfo) return false;
  
  // 深度比较关键字段
  return (
    prevProps.quote?.market_cap_basic === nextProps.quote?.market_cap_basic &&
    prevProps.quote?.sector === nextProps.quote?.sector &&
    prevProps.quote?.industry === nextProps.quote?.industry &&
    prevProps.stockInfo?.country === nextProps.stockInfo?.country &&
    prevProps.stockInfo?.exchange === nextProps.stockInfo?.exchange
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
});

