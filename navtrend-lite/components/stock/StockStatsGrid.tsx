/**
 * 股票统计数据网格组件
 * 
 * 显示股票的关键统计数据，包括开盘价、最高价、最低价和成交量。
 * 采用2x2网格布局，简洁的图标+文字设计，无卡片背景。
 * 支持骨架屏加载状态，使用 MarketNews 设计系统。
 * 
 * @author MarketNews Team
 * @version 2.0.0
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import { t } from '@/config/i18n';
import { formatPriceWithPricescale } from '@/utils/currencyFormatter';

interface StockStatsGridProps {
  /** 开盘价 */
  openPrice: number;
  /** 最高价 */
  highPrice: number;
  /** 最低价 */
  lowPrice: number;
  /** 成交量 */
  volume: number;
  /** 货币符号 */
  currency: string;
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 自定义样式 */
  style?: any;
  /** 价格精度（pricescale），如 10000 表示 4 位小数 */
  pricescale?: number;
}

/**
 * 统计数据项组件
 * 简洁的图标+标题+数值布局
 */
interface StatItemProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
}

function StatItem({ title, value, icon, iconColor, iconBgColor }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

export const StockStatsGrid = React.memo(function StockStatsGrid({
  openPrice,
  highPrice,
  lowPrice,
  volume,
  currency,
  isLoading = false,
  style,
  pricescale
}: StockStatsGridProps) {
  // 格式化价格显示（统一使用 formatPriceWithPricescale）
  // 自动处理：最多8位小数、超过8位使用科学计数法、去掉末尾零
  const formatPrice = React.useCallback((price: number) => {
    if (pricescale) {
      const formatted = formatPriceWithPricescale(price, pricescale, false);
      return `${formatted} ${currency}`;
    }
    // 如果没有 pricescale，使用默认格式（2位小数）
    const formatted = formatPriceWithPricescale(price, 100, false); // 100 = 2位小数
    return `${formatted} ${currency}`;
  }, [pricescale, currency]);

  // 格式化成交量显示
  const formatVolume = (vol: number) => {
    if (vol >= 1000000000) {
      return `${(vol / 1000000000).toFixed(1)}B`;
    } else if (vol >= 1000000) {
      return `${(vol / 1000000).toFixed(1)}M`;
    } else if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1)}K`;
    }
    return vol.toString();
  };

  // 骨架屏加载组件
  const SkeletonLoader = () => (
    <View style={[styles.container, style]}>
      {[1, 2, 3, 4].map((index) => (
        <View key={index} style={styles.statItem}>
          {/* 骨架屏图标 */}
          <View style={[styles.iconContainer, styles.skeletonIcon, styles.skeletonAnimation]} />
          
          {/* 骨架屏文字区域 */}
          <View style={styles.textContainer}>
            <View style={[styles.skeletonTitle, styles.skeletonAnimation]} />
            <View style={[styles.skeletonValue, styles.skeletonAnimation]} />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <View style={[styles.container, style]}>
      <StatItem
        title={t('components.stock.header.stats.high')}
        value={formatPrice(highPrice)}
        icon="trending-up"
        iconColor={MarketNewsBrand.colors.market.bullish}
        iconBgColor="#F0FDF4"
      />
      <StatItem
        title={t('components.stock.header.stats.low')}
        value={formatPrice(lowPrice)}
        icon="trending-down"
        iconColor={MarketNewsBrand.colors.market.bearish}
        iconBgColor={MarketNewsBrand.colors.market.dangerBg}
      />
      <StatItem
        title={t('components.stock.header.stats.open')}
        value={formatPrice(openPrice)}
        icon="sunny"
        iconColor="#FFA500"
        iconBgColor="#FFF7ED"
      />
      <StatItem
        title={t('components.stock.header.stats.volume')}
        value={formatVolume(volume)}
        icon="bar-chart-outline"
        iconColor={MarketNewsBrand.colors.primary[400]}
        iconBgColor="#EEF2FF"
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在数据变化时重渲染
  return (
    prevProps.openPrice === nextProps.openPrice &&
    prevProps.highPrice === nextProps.highPrice &&
    prevProps.lowPrice === nextProps.lowPrice &&
    prevProps.volume === nextProps.volume &&
    prevProps.currency === nextProps.currency &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.pricescale === nextProps.pricescale
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 24,
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%', // 2列布局，稍微增加间距
    flexDirection: 'row', // 水平排列
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: MarketNewsBrand.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // 图标与文字间距
  },
  textContainer: {
    flex: 1, // 占据剩余空间
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary, // 浅灰色标题
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    marginBottom: 2,
    textAlign: 'left', // 左对齐
  },
  statValue: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary, // 深色数值
    textAlign: 'left', // 左对齐
  },
  // 骨架屏样式
  skeletonIcon: {
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.full,
  },
  skeletonTitle: {
    height: 12,
    width: '60%',
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.sm,
    marginBottom: 6,
  },
  skeletonValue: {
    height: 16,
    width: '80%',
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  skeletonAnimation: {
    opacity: 0.6,
  },
});
