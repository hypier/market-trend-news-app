import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { MarketNewsBrand } from '@/config/brand';

// 创建带有自定义颜色的闪烁占位符组件
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

/**
 * 关注列表骨架屏组件
 */
export const WatchlistSkeleton = () => {
  const renderItem = () => (
    <View style={styles.watchlistSkeletonItem}>
      {/* 顶部：股票头像和代码 */}
      <View style={styles.watchlistSkeletonHeader}>
        <ShimmerPlaceholder
          style={styles.watchlistSkeletonLogo}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
        <ShimmerPlaceholder
          style={styles.watchlistSkeletonSymbol}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View>
      
      {/* 中间：趋势图表 */}
      <View style={styles.watchlistSkeletonChart}>
        <ShimmerPlaceholder
          style={styles.watchlistSkeletonChartPlaceholder}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View>
      
      {/* 底部：价格信息 */}
      <View style={styles.watchlistSkeletonPrice}>
        <ShimmerPlaceholder
          style={styles.watchlistSkeletonPriceValue}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
        <ShimmerPlaceholder
          style={styles.watchlistSkeletonPriceChange}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.section}>
      {/* <View style={styles.sectionHeader}>
        <ShimmerPlaceholder
          style={styles.sectionTitleSkeleton}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
          duration={1500}
        />
      </View> */}
      <FlatList
        data={[1, 2, 3]}
        renderItem={renderItem}
        keyExtractor={(item) => item.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.watchlistContainer}
      />
    </View>
  );
};

/**
 * 热门股票列表骨架屏组件
 */
export const TrendingStocksSkeleton = () => (
  <View style={styles.section}>
    <View style={styles.stocksList}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.trendingSkeletonItem}>
          <View style={styles.trendingSkeletonContent}>
            {/* 左侧：Logo和信息区域 */}
            <View style={styles.trendingSkeletonLeft}>
              <ShimmerPlaceholder
                style={styles.trendingSkeletonLogo}
                shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
                duration={1500}
              />
              <View style={styles.trendingSkeletonInfo}>
                <ShimmerPlaceholder
                  style={styles.trendingSkeletonSymbol}
                  shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
                  duration={1500}
                />
                <ShimmerPlaceholder
                  style={styles.trendingSkeletonName}
                  shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
                  duration={1500}
                />
              </View>
            </View>
            {/* 右侧：价格和涨跌幅区域 */}
            <View style={styles.trendingSkeletonRight}>
              <ShimmerPlaceholder
                style={styles.trendingSkeletonPrice}
                shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
                duration={1500}
              />
              <ShimmerPlaceholder
                style={styles.trendingSkeletonChange}
                shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
                duration={1500}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
);

/**
 * 资产分类Tabs骨架屏组件（含tab和下拉）
 */
export const AssetCategoryTabsSkeleton = () => (
  <View style={{ marginTop: 8, marginBottom: 16 }}>
    {/* Tab骨架：模拟4个tab按钮 */}
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 }}>
      {[1, 2, 3, 4].map(i => (
        <ShimmerPlaceholder
          key={i}
          style={{
            width: 80,
            height: 36,
            borderRadius: MarketNewsBrand.borderRadius.xl,
            marginRight: i < 4 ? 12 : 0,
          }}
          shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
        />
      ))}
    </View>
    {/* 下拉骨架 */}
    <View style={{ paddingHorizontal: 20 }}>
      <ShimmerPlaceholder
        style={{
          width: 138,
          height: 48,
          borderRadius: MarketNewsBrand.borderRadius.lg,
        }}
        shimmerColors={[MarketNewsBrand.colors.background.tertiary, '#e0e0e0', MarketNewsBrand.colors.background.tertiary]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  section: {
    marginTop: 6,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleSkeleton: {
    width: 120,
    height: 24,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  bannerSkeleton: {
    width: '100%',
    height: 60,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginBottom: 24,
  },
  watchlistFlatList: {
    flexGrow: 0,
  },
  watchlistContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  watchlistSkeletonItem: {
    width: 130,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    padding: 14,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  watchlistSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  watchlistSkeletonLogo: {
    width: 24,
    height: 24,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginRight: 8,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  watchlistSkeletonSymbol: {
    width: 60,
    height: 14,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  watchlistSkeletonChart: {
    alignItems: 'center',
    marginBottom: 12,
  },
  watchlistSkeletonChartPlaceholder: {
    width: 90,
    height: 40,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  watchlistSkeletonPrice: {
    alignItems: 'center',
  },
  watchlistSkeletonPriceValue: {
    width: 80,
    height: 14,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 4,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  watchlistSkeletonPriceChange: {
    width: 60,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  stocksList: {
    paddingHorizontal: 20,
    gap: 1,
  },
  trendingSkeletonItem: {
    marginBottom: 8,
  },
  trendingSkeletonContent: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: 12,
    height: 76,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingSkeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trendingSkeletonLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  trendingSkeletonInfo: {
    marginLeft: 12,
    flex: 1,
  },
  trendingSkeletonSymbol: {
    width: '40%',
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 4,
  },
  trendingSkeletonName: {
    width: '60%',
    height: 14,
    borderRadius: MarketNewsBrand.borderRadius.md,
  },
  trendingSkeletonRight: {
    alignItems: 'flex-end',
  },
  trendingSkeletonPrice: {
    width: '70%',
    height: 16,
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: 4,
  },
  trendingSkeletonChange: {
    width: '50%',
    height: 14,
    borderRadius: MarketNewsBrand.borderRadius.md,
  },
  countryTabsSkeleton: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  countryTabsSkeletonItem: {
    width: '100%',
    height: 44,
    borderRadius: 22,
  },
}); 