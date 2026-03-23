import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';
import { Button, CommonHeader } from '@/components/ui';
import { WatchlistStatsCard6, WatchlistItemCard } from '@/components/watchlist';
import { useWatchlistStore, useAuthStore } from '@/stores';
import { navigateToStockDetail } from '@/helpers/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WatchlistItem } from '@/types/stock';


export default function WatchlistScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  
  // 认证状态
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // 从 watchlistStore 获取 watchlist 数据
  const {
    watchlist,
    watchlistLoading: isLoading,
    fetchWatchlistWithAlerts,
  } = useWatchlistStore();



  useEffect(() => {
    if (isAuthenticated) {
      // 使用纯关注列表 API 获取 watchlist
      fetchWatchlistWithAlerts();
    }
  }, [fetchWatchlistWithAlerts, isAuthenticated]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 强制刷新纯关注列表
      await fetchWatchlistWithAlerts(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchWatchlistWithAlerts]);

  const handleStockPress = (symbol: string, exchange?: string) => {
    navigateToStockDetail(symbol, exchange);
  };

  // 处理登录按钮点击
  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => {
    return (
      <WatchlistItemCard
        item={item}
        onPress={handleStockPress}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="bookmark-outline" 
        size={64} 
        color={MarketNewsBrand.colors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>{t('watchlist.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>{t('watchlist.emptySubtitle')}</Text>
      <Button
        title={t('watchlist.browseStocks')}
        variant="primary"
        onPress={() => router.push('/(tabs)/trading')}
        style={styles.browseButton}
      />
    </View>
  );

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CommonHeader
          iconName="bookmark"
          titleKey="watchlist.title"
          subtitleKey="watchlist.subtitle"
          showSearchButton={false}
        />
        <ScrollView style={styles.scrollView}>
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="bookmark-outline" size={64} color={MarketNewsBrand.colors.primary[400]} />
              </View>
              <Text style={styles.emptyStateTitle}>{t('watchlist.title')}</Text>
              <Text style={styles.emptyStateText}>
                {t('portfolio.loginDesc')}
              </Text>
              <TouchableOpacity 
                onPress={handleLoginPress}
                activeOpacity={0.8}
                style={styles.loginButtonContainer}
              >
                <LinearGradient
                  colors={MarketNewsBrand.colors.gradients.primary as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButton}
                >
                  <Ionicons name="log-in-outline" size={20} color={MarketNewsBrand.colors.text.inverse} style={styles.loginButtonIcon} />
                  <Text style={styles.loginButtonText}>{t('portfolio.loginNow')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 显示加载状态（骨架屏）
  if (isLoading && watchlist.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CommonHeader
          iconName="bookmark"
          titleKey="watchlist.title"
          subtitleKey="watchlist.subtitle"
          showSearchButton={false}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        {/* 固定的页面头部 */}
        <CommonHeader
          iconName="bookmark"
          titleKey="watchlist.title"
          subtitleKey="watchlist.subtitle"
          showSearchButton={false}
        />
        
        <FlatList
          data={watchlist}
          renderItem={renderWatchlistItem}
          keyExtractor={(item) => `${item.exchange || 'unknown'}:${item.symbol}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <WatchlistStatsCard6 
              watchlistData={watchlist} 
              isLoading={isLoading && watchlist.length === 0}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={MarketNewsBrand.colors.primary[400]}
              enabled={isAuthenticated} // 只有登录后才启用下拉刷新
            />
          }
          ListEmptyComponent={!isLoading && watchlist.length === 0 ? renderEmptyState : null}
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary, // 与trading.tsx保持一致
  },
  listContent: {
    paddingTop: MarketNewsBrand.spacing.xs, // 减少顶部padding，因为有统计卡片
    paddingBottom: MarketNewsBrand.spacing.lg,
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: MarketNewsBrand.spacing.xl,
  },
  emptyTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: MarketNewsBrand.spacing.lg,
    marginBottom: MarketNewsBrand.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    lineHeight: MarketNewsBrand.typography.lineHeight.relaxed * MarketNewsBrand.typography.fontSize.base,
    marginBottom: MarketNewsBrand.spacing.xl,
  },
  browseButton: {
    minWidth: 200,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: MarketNewsBrand.spacing.xl,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
  },

  // 登录相关样式
  scrollView: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: MarketNewsBrand.spacing.lg,
    paddingVertical: MarketNewsBrand.spacing.xxxl * 1.5,
  },
  emptyStateContent: {
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: MarketNewsBrand.spacing.xxxl,
    width: '100%',
    maxWidth: 300,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: MarketNewsBrand.spacing.lg,
    padding: MarketNewsBrand.spacing.md,
    backgroundColor: MarketNewsBrand.colors.primary[50],
    borderRadius: MarketNewsBrand.borderRadius.full,
  },
  emptyStateTitle: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: MarketNewsBrand.spacing.md,
  },
  emptyStateText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    lineHeight: MarketNewsBrand.typography.lineHeight.relaxed * MarketNewsBrand.typography.fontSize.md,
    marginBottom: MarketNewsBrand.spacing.xl,
  },
  loginButtonContainer: {
    width: '100%',
    borderRadius: MarketNewsBrand.borderRadius.lg,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButton: {
    paddingHorizontal: MarketNewsBrand.spacing.xxxl,
    paddingVertical: MarketNewsBrand.spacing.md,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: MarketNewsBrand.spacing.xxxl + MarketNewsBrand.spacing.sm,
  },
  loginButtonIcon: {
    marginRight: MarketNewsBrand.spacing.xs,
  },
  loginButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.inverse,
    letterSpacing: MarketNewsBrand.typography.letterSpacing.wide,
  },
});
