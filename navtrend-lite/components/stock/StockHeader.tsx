/**
 * 股票详情页面头部组件
 * 
 * 显示股票的基本信息，包括：
 * - 股票代码和公司名称
 * - 当前价格和涨跌幅
 * - 基本统计数据（开盘价、最高价、最低价、成交量）
 * - 收藏按钮
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import { StockAvatar } from '@/components/ui/StockAvatar';
import type { StockDetail, StockLogo } from '@/types/stock';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice, formatChange, formatVolume } from '../../utils/currencyFormatter';

interface StockHeaderProps {
  /** 股票详情数据 */
  stockDetail: StockDetail | null;
  /** 股票实时报价数据 */
  stockQuote: StockDetail | null;
  /** 股票Logo数据 */
  stockLogo: StockLogo | null;
  /** 加载状态 */
  isLoading: boolean;
  /** 收藏按钮点击回调 */
  onFavoritePress: () => void;
  /** 是否已收藏 */
  isFavorite: boolean;
  /** 关注操作加载状态 */
  isUpdatingWatchlist: boolean;
}

export function StockHeader({
  stockDetail,
  stockQuote,
  stockLogo,
  isLoading,
  onFavoritePress,
  isFavorite,
  isUpdatingWatchlist,
}: StockHeaderProps) {
  const { t } = useTranslation();
  
  // 使用外部传入的 isFavorite 状态，不再维护本地状态
  
  // 使用实时报价数据，如果没有则使用详情数据
  const displayData = stockQuote || stockDetail;
  
  const handleFavoritePress = useCallback(() => {
    if (!displayData?.symbol || isUpdatingWatchlist) return;
    
    onFavoritePress();
  }, [displayData?.symbol, onFavoritePress, isUpdatingWatchlist]);
  
  // 获取货币代码，优先使用quote数据中的currency，否则使用详情数据中的currency，默认为USD
  const currency = stockQuote?.currency || stockDetail?.currency || 'USD';
  
  // if (isLoading || !displayData) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
  //         <Text style={styles.loadingText}>{t('components.stock.header.loadingInfo')}</Text>
  //       </View>
  //     </View>
  //   );
  // }
  
  const isPositive = (displayData?.change || 0) >= 0;
  
  return (
    <View style={styles.container}>
      {/* 股票标题和收藏按钮 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <StockAvatar
            symbol={displayData?.symbol || 'N/A'}
            exchange={displayData?.exchange || 'N/A'}
            size="large"
          />
          <View style={styles.titleInfo}>
            <Text style={styles.symbol}>{displayData?.symbol}</Text>
            <Text style={styles.companyName} numberOfLines={2} ellipsizeMode="tail">
              {displayData?.name || 'Loading...'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            isUpdatingWatchlist && styles.favoriteButtonDisabled
          ]}
          onPress={handleFavoritePress}
          disabled={isUpdatingWatchlist}
        >
          {isUpdatingWatchlist ? (
            <ActivityIndicator size="small" color={MarketNewsBrand.colors.text.secondary} />
          ) : (
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? MarketNewsBrand.colors.semantic.warning : MarketNewsBrand.colors.text.secondary}
            />
          )}
        </TouchableOpacity>
      </View>
      
      {/* 价格信息 */}
      <View style={styles.priceSection}>
        <Text style={styles.currentPrice}>
          {formatPrice(displayData?.price || 0, currency)}
        </Text>
        <View style={[
          styles.changeBadge, 
          { backgroundColor: isPositive ? MarketNewsBrand.colors.market.successLight : MarketNewsBrand.colors.market.dangerLight }
        ]}>
          <Ionicons 
            name={isPositive ? 'arrow-up' : 'arrow-down'} 
            size={16} 
            color={isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish} 
          />
          <Text style={[
            styles.changeText, 
            { color: isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish }
          ]}>
            {formatChange(displayData?.change || 0, currency)} ({(displayData?.changePercent || 0).toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* 统计数据 */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('components.stock.header.stats.open')}</Text>
          <Text style={styles.statValue}>
            {formatPrice(displayData?.open || 0, currency)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('components.stock.header.stats.high')}</Text>
          <Text style={styles.statValue}>
            {formatPrice(displayData?.high || 0, currency)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('components.stock.header.stats.low')}</Text>
          <Text style={styles.statValue}>
            {formatPrice(displayData?.low || 0, currency)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('components.stock.header.stats.volume')}</Text>
          <Text style={styles.statValue}>
            {formatVolume(displayData?.volume || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    padding: 20,
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  titleInfo: {
    marginLeft: 12,
    flex: 1,
    maxWidth: '75%',
  },
  symbol: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
  },
  companyName: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: 4,
    flexWrap: 'wrap',
    maxWidth: '95%',
  },
  favoriteButton: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonDisabled: {
    opacity: 0.5,
  },
  priceSection: {
    marginBottom: 20,
  },
  currentPrice: {
    fontSize: MarketNewsBrand.typography.fontSize['3xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: MarketNewsBrand.borderRadius.md,
    alignSelf: 'flex-start',
  },
  changeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
}); 