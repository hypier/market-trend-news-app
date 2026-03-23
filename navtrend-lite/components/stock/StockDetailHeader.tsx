/**
 * 股票详情头部组件
 * 
 * 显示股票的基本信息，包括股票logo、代码和公司名称。
 * 采用水平布局，左侧显示logo，右侧显示文字信息。
 * 
 * @author MarketNews Team
 * @version 2.0.0 - 使用 TradingView Logo 和交易所徽章
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StockLogo } from '@/components/ui/StockLogo';
import { MarketNewsBrand } from '@/config/brand';

interface StockDetailHeaderProps {
  /** 股票代码 */
  symbol: string;
  /** 公司名称 */
  name: string;
  /** 交易所代码 */
  exchange?: string;
  /** TradingView logoid（优先级最高） */
  logoid?: string;
  /** 基础货币 logoid（用于加密货币，如 crypto/XTVCBTC） */
  baseCurrencyLogoid?: string;
  /** 货币 logoid（备用，如 country/US） */
  currencyLogoid?: string;
  /** Logo尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 自定义样式 */
  style?: any;
  /** 是否显示全屏按钮 */
  showFullscreenButton?: boolean;
  /** 全屏按钮点击回调 */
  onFullscreenPress?: () => void;
}

export function StockDetailHeader({
  symbol,
  name,
  exchange = 'undefined',
  logoid,
  baseCurrencyLogoid,
  currencyLogoid,
  size = 'large',
  isLoading = false,
  style,
  showFullscreenButton = false,
  onFullscreenPress
}: StockDetailHeaderProps) {
  // 从完整的 symbol 中提取纯股票代码（去除交易所前缀）
  const pureSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  
  // ✨ 生成唯一的 key，确保 symbol 变化时 Logo 组件完全重新渲染
  const logoKey = `${symbol}-${logoid || baseCurrencyLogoid || currencyLogoid || 'default'}`;
  
  return (
    <View style={[styles.container, style]}>
      {/* 股票 Logo */}
      <StockLogo
        key={logoKey}
        logoid={logoid}
        baseCurrencyLogoid={baseCurrencyLogoid}
        currencyLogoid={currencyLogoid}
        symbol={pureSymbol}
        size={size}
        style={styles.stockLogo}
      />
      
      {/* 股票信息 */}
      <View style={styles.stockTextInfo}>
        {/* 公司名称 */}
        <Text style={styles.companyName} >
          {isLoading ? 'Loading...' : (name || 'Unknown Company')}
        </Text>

        {/* 股票代码和交易所徽章 */}
        <View style={styles.symbolRow}>
          <Text style={styles.stockSymbol}>
            {isLoading ? 'Loading...' : pureSymbol}
          </Text>
          {!isLoading && exchange && exchange !== 'undefined' && (
            <Text style={styles.middleDot}>·</Text>
          )}
          {!isLoading && exchange && exchange !== 'undefined' && (
            <View style={styles.exchangeBadge}>
              <Text style={styles.exchangeText}>
                {exchange.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* 全屏按钮 */}
      {showFullscreenButton && onFullscreenPress && (
        <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={onFullscreenPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="expand"
            size={20}
            color="rgba(255, 255, 255, 0.9)"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 10,
    marginBottom: 5,
  },
  stockLogo: {
    marginRight: 12,
  },
  stockTextInfo: {
    alignItems: 'flex-start',
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.background.primary,
    marginBottom: 6,
    // maxWidth: 260,
  },
  stockSymbol: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.background.primary,
    marginRight: 6,
  },
  middleDot: {
    color: 'rgba(255, 255, 255, 0.7)',
    // marginHorizontal: 6,
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  exchangeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: MarketNewsBrand.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 6,
  },
  exchangeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.background.primary,
    letterSpacing: 0.5,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

