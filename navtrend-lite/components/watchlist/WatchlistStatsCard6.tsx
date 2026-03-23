import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand, getNumericFontWeight, getCrossPlatformFontWeight } from '@/config/brand';
import { useTranslation } from '@/hooks/useTranslation';
import type { WatchlistItem } from '@/types/stock';

interface ExtendedStatsData {
  count: number;
  avgReturn: number;
  bullishCount: number;
  bearishCount: number;
  bullishRatio: number;
  maxGain: number;
  maxLoss: number;
}

interface WatchlistStatsCard6Props {
  watchlistData: WatchlistItem[];
  isLoading?: boolean;
}

// 计算统计数据的工具函数
const calculateExtendedStats = (watchlistData: WatchlistItem[]): ExtendedStatsData => {
  if (!watchlistData || watchlistData.length === 0) {
    return {
      count: 0,
      avgReturn: 0,
      bullishCount: 0,
      bearishCount: 0,
      bullishRatio: 0,
      maxGain: 0,
      maxLoss: 0,
    };
  }

  let totalReturn = 0;
  let bullishCount = 0;
  let bearishCount = 0;
  let validItemsCount = 0;
  let maxGain = -Infinity;
  let maxLoss = Infinity;

  watchlistData.forEach((item) => {
    const quote = item.quote;
    if (quote && typeof quote.changePercent === 'number') {
      totalReturn += quote.changePercent;
      
      // 统计涨跌数量
      if (quote.changePercent > 0) {
        bullishCount++;
        maxGain = Math.max(maxGain, quote.changePercent);
      } else if (quote.changePercent < 0) {
        bearishCount++;
        maxLoss = Math.min(maxLoss, quote.changePercent);
      }
      
      validItemsCount++;
    }
  });

  // 如果没有找到涨跌数据，重置极值
  if (maxGain === -Infinity) maxGain = 0;
  if (maxLoss === Infinity) maxLoss = 0;

  return {
    count: watchlistData.length,
    avgReturn: validItemsCount > 0 ? totalReturn / validItemsCount : 0,
    bullishCount: bullishCount,
    bearishCount: bearishCount,
    bullishRatio: validItemsCount > 0 ? (bullishCount / validItemsCount) * 100 : 0,
    maxGain: maxGain,
    maxLoss: maxLoss,
  };
};

// 格式化数值的辅助函数
const formatExtendedValue = (value: number, type: 'percentage' | 'currency' | 'number'): string => {
  switch (type) {
    case 'percentage':
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    case 'currency':
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      } else {
        return `$${value.toFixed(0)}`;
      }
    case 'number':
      return value.toString();
    default:
      return value.toString();
  }
};

// 主要统计卡片组件
const MainStatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  backgroundColor: string;
  isLast?: boolean;
}> = ({ icon, label, value, subValue, color, backgroundColor, isLast = false }) => (
  <View style={[styles.mainStatCard, { backgroundColor }, isLast && styles.mainStatCardLast]}>
    <View style={styles.mainStatHeader}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.mainStatLabel, { color }]}>{label}</Text>
    </View>
    <Text style={[styles.mainStatValue, { color }]}>{value}</Text>
    {subValue && <Text style={[styles.mainStatSubValue, { color: color, opacity: 0.8 }]}>{subValue}</Text>}
  </View>
);

// 次要统计项组件
const SecondaryStatItem: React.FC<{
  icon: string;
  value: string;
  color: string;
  bgColor: string;
  isLast?: boolean;
}> = ({ icon, value, color, bgColor, isLast = false }) => (
  <View style={[styles.secondaryStatItem, { backgroundColor: bgColor }, isLast && styles.secondaryStatItemLast]}>
    <Ionicons name={icon as any} size={14} color={color} />
    <Text style={[styles.secondaryStatValue, { color, marginLeft: 4 }]}>{value}</Text>
  </View>
);

export const WatchlistStatsCard6: React.FC<WatchlistStatsCard6Props> = ({
  watchlistData,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  /**
   * 性能优化：使用 useMemo 缓存统计计算结果
   * 避免每次渲染时重复计算统计数据（涉及遍历整个 watchlist 数组）
   * 仅在 watchlistData 变化时重新计算
   */
  const stats = React.useMemo(() => calculateExtendedStats(watchlistData), [watchlistData]);

  // 骨架屏
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.mainStatsRow}>
          <View style={[styles.mainStatCard, styles.skeletonCard]}>
            <View style={styles.skeletonMainHeader} />
            <View style={styles.skeletonMainValue} />
          </View>
          <View style={[styles.mainStatCard, styles.skeletonCard]}>
            <View style={styles.skeletonMainHeader} />
            <View style={styles.skeletonMainValue} />
          </View>
        </View>
        <View style={styles.secondaryStatsRow}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={[styles.secondaryStatItem, styles.skeletonSecondary, index === 3 && styles.secondaryStatItemLast]}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonValue} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 主要统计 - 2个大卡片 */}
      <View style={styles.mainStatsRow}>
        <MainStatCard
          icon="bookmark"
          label={t('watchlist.stats.followedStocks')}
          value={stats.count.toString()}
          subValue={`${stats.bullishCount}${t('watchlist.stats.bullish')} ${stats.bearishCount}${t('watchlist.stats.bearish')}`}
          color={MarketNewsBrand.colors.background.surface}
          backgroundColor={MarketNewsBrand.colors.primary[400]}
        />
        
        <MainStatCard
          icon="trending-up"
          label={t('watchlist.stats.avgReturn')}
          value={formatExtendedValue(stats.avgReturn, 'percentage')}
          subValue={formatExtendedValue(stats.bullishRatio, 'percentage') + t('watchlist.stats.rising')}
          color={MarketNewsBrand.colors.background.surface}
          backgroundColor={
            stats.avgReturn >= 0 
              ? MarketNewsBrand.colors.market.bullish
              : MarketNewsBrand.colors.market.bearish
          }
          isLast={true}
        />
      </View>

      {/* 次要统计 - 4个小项 */}
      <View style={styles.secondaryStatsRow}>
        <SecondaryStatItem
          icon="arrow-up"
          value={stats.bullishCount.toString()}
          color={MarketNewsBrand.colors.background.surface}
          bgColor={MarketNewsBrand.colors.market.bullish}
        />
        
        <SecondaryStatItem
          icon="arrow-down"
          value={stats.bearishCount.toString()}
          color={MarketNewsBrand.colors.background.surface}
          bgColor={MarketNewsBrand.colors.market.bearish}
        />
        
        <SecondaryStatItem
          icon="trending-up"
          value={formatExtendedValue(stats.maxGain, 'percentage')}
          color={MarketNewsBrand.colors.background.surface}
          bgColor={MarketNewsBrand.colors.market.bullish}
        />
        
        <SecondaryStatItem
          icon="trending-down"
          value={formatExtendedValue(stats.maxLoss, 'percentage')}
          color={MarketNewsBrand.colors.background.surface}
          bgColor={MarketNewsBrand.colors.market.bearish}
          isLast={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: MarketNewsBrand.spacing.sm,
    marginBottom: MarketNewsBrand.spacing.sm,
  } as ViewStyle,
  
  // 主要统计行样式
  mainStatsRow: {
    flexDirection: 'row',
    marginBottom: MarketNewsBrand.spacing.sm,
  } as ViewStyle,
  
  mainStatCard: {
    flex: 1,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: MarketNewsBrand.spacing.md,
    marginRight: MarketNewsBrand.spacing.sm,
    shadowColor: MarketNewsBrand.shadow.sm.shadowColor,
    shadowOffset: MarketNewsBrand.shadow.sm.shadowOffset,
    shadowOpacity: MarketNewsBrand.shadow.sm.shadowOpacity,
    shadowRadius: MarketNewsBrand.shadow.sm.shadowRadius,
    elevation: MarketNewsBrand.shadow.sm.elevation,
  } as ViewStyle,
  
  mainStatCardLast: {
    marginRight: 0,
  } as ViewStyle,
  
  mainStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MarketNewsBrand.spacing.xs,
  } as ViewStyle,
  
  mainStatLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: getCrossPlatformFontWeight('normal') as TextStyle['fontWeight'], // 使用跨平台优化字重
    marginLeft: MarketNewsBrand.spacing.xs,
  } as TextStyle,
  
  mainStatValue: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: getNumericFontWeight('bold') as TextStyle['fontWeight'], // 使用数字专用字重工具函数
    marginBottom: 2,
  } as TextStyle,
  
  mainStatSubValue: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
  } as TextStyle,
  
  // 次要统计行样式
  secondaryStatsRow: {
    flexDirection: 'row',
  } as ViewStyle,
  
  secondaryStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MarketNewsBrand.borderRadius.md,
    paddingVertical: MarketNewsBrand.spacing.sm,
    paddingHorizontal: MarketNewsBrand.spacing.xs,
    marginRight: MarketNewsBrand.spacing.xs,
  } as ViewStyle,
  
  secondaryStatItemLast: {
    marginRight: 0,
  } as ViewStyle,
  
  secondaryStatValue: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: getNumericFontWeight('medium') as TextStyle['fontWeight'], // 使用数字专用中等字重工具函数
  } as TextStyle,

  // 骨架屏样式
  skeletonCard: {
    backgroundColor: MarketNewsBrand.colors.primary[200],
  } as ViewStyle,
  
  skeletonSecondary: {
    backgroundColor: MarketNewsBrand.colors.primary[200],
  } as ViewStyle,
  
  skeletonMainHeader: {
    height: 16,
    width: '60%',
    backgroundColor: MarketNewsBrand.colors.background.overlay,
    borderRadius: MarketNewsBrand.borderRadius.sm,
    marginBottom: MarketNewsBrand.spacing.xs,
  } as ViewStyle,
  
  skeletonMainValue: {
    height: 24,
    width: '80%',
    backgroundColor: MarketNewsBrand.colors.background.overlay,
    borderRadius: MarketNewsBrand.borderRadius.sm,
  } as ViewStyle,
  
  skeletonIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: MarketNewsBrand.colors.background.overlay,
  } as ViewStyle,
  
  skeletonValue: {
    height: 14,
    width: 30,
    backgroundColor: MarketNewsBrand.colors.background.overlay,
    borderRadius: MarketNewsBrand.borderRadius.sm,
  } as ViewStyle,
});

export default WatchlistStatsCard6;
