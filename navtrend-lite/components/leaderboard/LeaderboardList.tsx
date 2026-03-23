/**
 * 排行榜列表组件
 * 展示指定排行榜的数据列表
 */

import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { TrendingStocksSkeleton } from '@/components/skeletons';
import { LeaderboardItem } from './LeaderboardItem';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import type { LeaderboardRow } from '../../types/leaderboard';

interface LeaderboardListProps {
  /** 排行榜数据列表 */
  data: LeaderboardRow[];
  
  /** 加载状态 */
  loading?: boolean;
  
  /** 刷新状态 */
  refreshing?: boolean;
  
  /** 错误信息 */
  error?: string | null;
  
  /** 排行榜标题 */
  title?: string;
  
  /** 项目点击回调 */
  onItemPress: (symbol: string, exchange?: string) => void;
  
  /** 刷新回调 */
  onRefresh?: () => void;
  
  /** 列表头部组件 */
  ListHeaderComponent?: React.ReactNode;
  
  /** 列表底部组件 */
  ListFooterComponent?: React.ReactNode;
}

export function LeaderboardList({
  data,
  loading = false,
  refreshing = false,
  error = null,
  title,
  onItemPress,
  onRefresh,
  ListHeaderComponent,
  ListFooterComponent
}: LeaderboardListProps) {

  // 渲染单个排行榜项
  const renderLeaderboardItem = useCallback(({ item, index }: { item: LeaderboardRow; index: number }) => (
    <View style={styles.itemContainer}>
      <LeaderboardItem
        item={item}
        onPress={() => onItemPress(item.symbol, item.exchange)}
      />
    </View>
  ), [onItemPress]);

  // 渲染列表项Key
  const getItemKey = useCallback((item: LeaderboardRow, index: number) => {
    return `leaderboard_${item.symbol}_${item.exchange || 'unknown'}_${index}`;
  }, []);

  // 渲染空状态
  const renderEmptyComponent = useCallback(() => {
    if (loading) return null;
    
    return (
      <LeaderboardEmptyState 
        error={error}
        onRetry={onRefresh}
        title={title}
      />
    );
  }, [loading, error, onRefresh, title]);

  // 渲染加载状态
  if (loading && (!data || data.length === 0)) {
    return (
      <View style={styles.container}>
        {ListHeaderComponent}
        <TrendingStocksSkeleton />
        {ListFooterComponent}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderLeaderboardItem}
        keyExtractor={getItemKey}
        ListHeaderComponent={ListHeaderComponent as any}
        ListFooterComponent={ListFooterComponent as any}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[MarketNewsBrand.colors.primary[400]]}
              tintColor={MarketNewsBrand.colors.primary[400]}
            />
          ) : undefined
        }
        contentContainerStyle={[
          styles.contentContainer,
          data.length === 0 && styles.emptyContentContainer
        ]}
        // 性能优化
        getItemLayout={(data, index) => ({
          length: 70,  // 预估每个项目的高度
          offset: 70 * index,
          index,
        })}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        // 可访问性
        accessibilityRole="list"
        accessibilityLabel={title ? `${title}排行榜列表` : '排行榜列表'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContentContainer: {
    justifyContent: 'center',
  },
  itemContainer: {
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    // 添加轻微的阴影效果
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
