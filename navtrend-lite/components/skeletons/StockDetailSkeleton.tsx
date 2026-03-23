import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { MarketNewsBrand } from '@/config/brand';

// 创建带有自定义颜色的闪烁占位符组件
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

/**
 * 股票详情头部骨架屏组件
 */
export const StockHeaderSkeleton = () => (
  <View style={styles.header}>
    <View style={styles.headerTop}>
      <View style={styles.titleContainer}>
        <ShimmerPlaceholder
          style={styles.logo}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
        <View style={styles.titleInfo}>
          <ShimmerPlaceholder
            style={styles.symbol}
            shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
            duration={1500}
          />
          <ShimmerPlaceholder
            style={styles.name}
            shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
            duration={1500}
          />
        </View>
      </View>
      <View style={styles.favoriteButton}>
        <ShimmerPlaceholder
          style={styles.favoriteIcon}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View>
    </View>
    
    <View style={styles.priceSection}>
      <ShimmerPlaceholder
        style={styles.currentPrice}
        shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
        duration={1500}
      />
      <ShimmerPlaceholder
        style={styles.changeBadge}
        shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
        duration={1500}
      />
    </View>

    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.statItem}>
          <ShimmerPlaceholder
            style={styles.statLabel}
            shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
            duration={1500}
          />
          <ShimmerPlaceholder
            style={styles.statValue}
            shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
            duration={1500}
          />
        </View>
      ))}
    </View>
  </View>
);

/**
 * 股票图表骨架屏组件
 */
export const StockChartSkeleton = () => (
  <View style={styles.chartSkeletonContainer}>
    <View style={styles.chartSkeletonContent}>
      <View style={styles.chartSkeletonHeader}>
        <View style={styles.chartSkeletonPriceInfo}>
          <View style={styles.chartSkeletonPriceRow}>
            <ShimmerPlaceholder
              style={styles.chartSkeletonPrice}
              shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
              duration={1500}
            />
            <ShimmerPlaceholder
              style={styles.chartSkeletonChange}
              shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
              duration={1500}
            />
          </View>
        </View>
      </View>

      <View style={styles.chartSkeletonChartArea}>
        <ShimmerPlaceholder
          style={styles.chartSkeletonChart}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View>

      <View style={styles.chartSkeletonFooter}>
        <ShimmerPlaceholder
          style={styles.chartSkeletonInfo}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
        <ShimmerPlaceholder
          style={styles.chartSkeletonRange}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View>
    </View>
  </View>
);

/**
 * 持仓按钮骨架屏组件
 */
export const PositionButtonSkeleton = () => (
  <View style={styles.positionButtonContainer}>
    <ShimmerPlaceholder
      style={styles.positionButton}
      shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
      duration={1500}
    />
  </View>
);

/**
 * 关键数据骨架屏组件
 */
export const KeyDataSkeleton = () => (
  <View style={styles.keyDataContainer}>
    {[1, 2, 3, 4].map((item) => (
      <View key={item} style={styles.keyDataItem}>
        <ShimmerPlaceholder
          style={styles.keyDataLabel}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
        <ShimmerPlaceholder
          style={styles.keyDataValue}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View>
    ))}
  </View>
);

/**
 * 标签页骨架屏组件
 */
export const StockTabsSkeleton = () => (
  <View style={styles.tabsContainer}>
    <View style={styles.tabsHeader}>
      {[1, 2].map((item) => (
        <ShimmerPlaceholder
          key={item}
          style={styles.tabButton}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      ))}
    </View>
    <View style={styles.tabContent}>
      <ShimmerPlaceholder
        style={styles.aboutTitle}
        shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
        duration={1500}
      />
      <ShimmerPlaceholder
        style={styles.aboutText}
        shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
        duration={1500}
      />
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.infoRow}>
          <ShimmerPlaceholder
            style={styles.infoLabel}
            shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
            duration={1500}
          />
          <ShimmerPlaceholder
            style={styles.infoValue}
            shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
            duration={1500}
          />
        </View>
      ))}
    </View>
  </View>
);

/**
 * 股票详情页完整骨架屏组件
 */
export const StockDetailSkeleton = () => (
  <View style={styles.container}>
    <StockHeaderSkeleton />
    <StockChartSkeleton />
    <PositionButtonSkeleton />
    <KeyDataSkeleton />
    <StockTabsSkeleton />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    marginBottom: 8,
  },
  header: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    padding: 20,
    marginBottom: 8,
  },
  headerTop: {
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
  logo: {
    width: 40,
    height: 40,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  symbol: {
    width: 120,
    height: 24,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 4,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  name: {
    width: 180,
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  favoriteButton: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    width: 24,
    height: 24,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  priceSection: {
    marginBottom: 20,
  },
  currentPrice: {
    width: 160,
    height: 36,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 4,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  changeBadge: {
    width: 120,
    height: 24,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
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
    width: 60,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 4,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  statValue: {
    width: 80,
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  periodButton: {
    flex: 1,
    height: 32,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    marginHorizontal: 2,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartContainer: {
    position: 'relative',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    borderRadius: 8,
  },
  priceInfo: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priceChange: {
    width: 120,
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: 65,
    marginTop: 8,
  },
  chart: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  dataInfo: {
    width: 120,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  rangeInfo: {
    width: 160,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  positionButtonContainer: {
    padding: 16,
  },
  positionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  keyDataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    marginTop: 12,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  keyDataItem: {
    width: '50%',
    padding: 8,
  },
  keyDataLabel: {
    width: '80%',
    height: 14,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 4,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  keyDataValue: {
    width: '60%',
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  tabsContainer: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    marginTop: 12,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
    padding: 16,
  },
  tabButton: {
    width: 100,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  tabContent: {
    padding: 20,
  },
  aboutTitle: {
    width: '60%',
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 12,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  aboutText: {
    width: '100%',
    height: 80,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 20,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  infoLabel: {
    width: '40%',
    height: 14,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  infoValue: {
    width: '40%',
    height: 14,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartSkeletonContainer: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    marginBottom: 8,
  },
  chartSkeletonPeriodSelector: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartSkeletonPeriodButton: {
    flex: 1,
    height: 32,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    marginHorizontal: 2,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartSkeletonContent: {
    position: 'relative',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  chartSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 12,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    borderRadius: 8,
  },
  chartSkeletonPriceInfo: {
    flex: 1,
  },
  chartSkeletonPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chartSkeletonPrice: {
    width: 160,
    height: 28,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginRight: 12,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartSkeletonChange: {
    width: 120,
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartSkeletonChartArea: {
    position: 'relative',
    height: 200,
  },
  chartSkeletonChart: {
    width: '100%',
    height: 220,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  chartSkeletonInfo: {
    width: 120,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  chartSkeletonRange: {
    width: 160,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
}); 