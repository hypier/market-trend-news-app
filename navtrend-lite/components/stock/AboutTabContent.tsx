/**
 * 关于标签页内容组件
 * 
 * 显示股票的详细信息，包括公司简介和基本信息。
 * 提供结构化的信息展示，支持多种数据源的融合显示。
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';

// 定义股票相关类型接口
interface StockDetail {
  symbol?: string;
  name?: string;
  exchange?: string;
  description?: string;
  sector?: string;
  industry?: string;
  country?: string;
  website?: string;
  currency?: string;
  price?: number;
  marketCap?: number;
  employees?: number;
  founded?: string;
  headquarters?: string;
}

interface StockQuote {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  price?: number;
  marketCap?: number;
}

interface StockProfile {
  description?: string;
  sector?: string;
  industry?: string;
  country?: string;
  employees?: number;
  founded?: string;
}

interface AboutTabContentProps {
  /** 股票详情数据 */
  stockDetail?: StockDetail | null;
  /** 股票报价数据 */
  stockQuote?: StockQuote | null;
  /** 股票档案数据 */
  stockProfile?: StockProfile | null;
  /** 股票代码 */
  symbol: string;
  /** 格式化市值的函数 */
  formatMarketCap?: (value: number) => string;
  /** 翻译函数 */
  t?: (key: string) => string;
}

export function AboutTabContent({
  stockDetail,
  stockQuote,
  stockProfile,
  symbol,
  formatMarketCap = (value) => `$${(value / 1e9).toFixed(1)}B`,
  t = (key) => key
}: AboutTabContentProps) {
  // 获取综合数据
  const detailData = stockDetail;
  const priceData = stockQuote || stockDetail;
  const profileData = stockProfile;

  // 渲染信息行
  const renderInfoRow = (label: string, value: string | number | undefined) => {
    if (!value && value !== 0) return null;
    
    return (
      <View style={styles.infoRow} key={label}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.aboutText}>
        {profileData?.description || 
         detailData?.description || 
         t('stock.noCompanyDescription')}
      </Text>
      
      {(detailData || priceData) && (
        <View style={styles.basicInfo}>
          {renderInfoRow(
            t('stock.stockCode'), 
            detailData?.symbol || priceData?.symbol
          )}
          
          {renderInfoRow(
            t('stock.companyName'), 
            detailData?.name || priceData?.name
          )}
          
          {renderInfoRow(
            t('stock.exchange'), 
            detailData?.exchange || priceData?.exchange
          )}
          
          {renderInfoRow(
            t('stock.sector'), 
            profileData?.sector || detailData?.sector
          )}
          
          {renderInfoRow(
            t('stock.industry'), 
            profileData?.industry || detailData?.industry
          )}
          
          {renderInfoRow(
            t('stock.country'), 
            profileData?.country || detailData?.country
          )}
          
          {renderInfoRow(
            t('stock.website'), 
            detailData?.website
          )}
          
          {renderInfoRow(
            t('position.currentPrice'), 
            `${priceData?.currency || '$'}${priceData?.price?.toFixed(2)}`
          )}
          
          {(detailData?.marketCap || priceData?.marketCap) && renderInfoRow(
            t('stock.marketCap'), 
            formatMarketCap(detailData?.marketCap || priceData?.marketCap || 0)
          )}
          
          {(profileData?.employees ?? detailData?.employees) !== undefined && renderInfoRow(
            t('stock.employees'), 
            typeof (profileData?.employees ?? detailData?.employees) === 'number'
              ? (profileData?.employees ?? detailData?.employees)!.toLocaleString()
              : '--'
          )}
          
          {renderInfoRow(
            t('stock.founded'), 
            profileData?.founded || detailData?.founded
          )}
          
          {renderInfoRow(
            t('stock.headquarters'), 
            detailData?.headquarters
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  aboutTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  basicInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  infoLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
});
