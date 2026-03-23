import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { 
  TradingHeader
} from '@/components/markets';
import { 
  LeaderboardSelector,
  LeaderboardList,
  LeaderboardCustomizer
} from '@/components/leaderboard';
import { useLeaderboardStore } from '@/stores';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';
import { getCurrentLanguage } from '@/config/i18n';

// 排行榜数据获取参数常量
const LEADERBOARD_FETCH_PARAMS = {
  start: 0,
  count: 50,
} as const;

export default function TradingScreen() {
  // 自定义排行榜管理弹窗状态
  const [showCustomizer, setShowCustomizer] = useState(false);

  // 排行榜 Store
  const {
    displayCategories,
    selectedCategoryId,
    selectedLeaderboardCode,
    isLoading: leaderboardLoading,
    isInitialized: leaderboardInitialized,
    error: leaderboardError,
    leaderboardData, // 直接从 store 获取数据，确保响应式更新
    initialize: initializeLeaderboard,
    fetchLeaderboardData,
    refreshLeaderboardData,
    getLeaderboardDisplayData,
    setSelectedCategory,
    setSelectedLeaderboard,
  } = useLeaderboardStore();

  // 优化：缓存当前语言，避免重复调用
  const currentLang = useMemo(() => getCurrentLanguage() as string, []);

  // 优化：提取通用的获取排行榜数据参数
  const getLeaderboardParams = useCallback(() => ({
    ...LEADERBOARD_FETCH_PARAMS,
    lang: currentLang,
  }), [currentLang]);

  // 排行榜相关处理函数
  const handleLeaderboardCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, [setSelectedCategory]);

  const handleLeaderboardSelect = useCallback(async (code: string) => {
    if (code !== selectedLeaderboardCode) {
      // 优化：先更新选中状态，这样如果有缓存数据会立即显示
      // fetchLeaderboardData 内部会处理缓存检查：有缓存立即显示，然后后台刷新；无缓存则加载
      setSelectedLeaderboard(code);
      
      // 获取排行榜数据（内部会处理缓存逻辑）
      try {
        await fetchLeaderboardData(code, getLeaderboardParams());
      } catch (error) {
        Logger.error(LogModule.STOCK, '[TradingScreen] Failed to fetch leaderboard data:', error);
      }
    }
  }, [selectedLeaderboardCode, setSelectedLeaderboard, fetchLeaderboardData, getLeaderboardParams]);

  const handleAddCustomLeaderboard = useCallback(() => {
    setShowCustomizer(true);
  }, []);

  const handleLeaderboardRefresh = useCallback(async () => {
    if (selectedLeaderboardCode) {
      try {
        await refreshLeaderboardData(selectedLeaderboardCode, getLeaderboardParams());
      } catch (error) {
        Logger.error(LogModule.STOCK, '[TradingScreen] Failed to refresh leaderboard:', error);
      }
    }
  }, [selectedLeaderboardCode, refreshLeaderboardData, getLeaderboardParams]);

  const handleLeaderboardItemPress = useCallback((symbol: string, exchange?: string) => {
    // 检查 symbol 是否已经包含 exchange（格式: EXCHANGE:SYMBOL）
    const hasExchange = symbol.includes(':');
    
    // 如果 symbol 已经包含 exchange，直接使用；否则拼接
    const symbolWithExchange = hasExchange ? symbol : (exchange ? `${exchange}:${symbol}` : symbol);
    
    router.push(`/stock/${symbolWithExchange}`);
  }, []);



  // 页面初始化
  useEffect(() => {
    const initializePageData = async () => {
      // 初始化排行榜数据
      if (!leaderboardInitialized) {
        try {
          Logger.info(LogModule.STOCK, '[TradingScreen] Initializing leaderboard...');
          await initializeLeaderboard();
          Logger.info(LogModule.STOCK, '[TradingScreen] Leaderboard initialized successfully');
        } catch (error) {
          Logger.error(LogModule.STOCK, '[TradingScreen] Leaderboard initialization failed:', error);
        }
      }
    };
    
    initializePageData();
  }, [leaderboardInitialized, initializeLeaderboard]);

  // 排行榜初始化完成后自动加载默认选中的数据（异步加载，不阻塞首屏）
  useEffect(() => {
    if (leaderboardInitialized && selectedLeaderboardCode) {
      // 先检查缓存，如果有缓存则立即显示
      const cachedData = getLeaderboardDisplayData(selectedLeaderboardCode);
      if (cachedData) {
        // 有缓存，立即显示，然后后台刷新
        Logger.info(LogModule.STOCK, `[TradingScreen] Using cached leaderboard data: ${selectedLeaderboardCode}`);
        // 后台异步刷新数据（不阻塞 UI）
        fetchLeaderboardData(selectedLeaderboardCode, getLeaderboardParams())
          .catch(error => {
            Logger.warn(LogModule.STOCK, '[TradingScreen] Failed to refresh leaderboard data (non-blocking):', error);
          });
        return;
      }
      
      // 没有缓存，先显示 UI（骨架屏），然后异步加载数据
      Logger.info(LogModule.STOCK, `[TradingScreen] Auto-loading default leaderboard data: ${selectedLeaderboardCode} (async)`);
      // 异步加载，不阻塞 UI 渲染
      fetchLeaderboardData(selectedLeaderboardCode, getLeaderboardParams())
        .catch(error => {
          Logger.error(LogModule.STOCK, '[TradingScreen] Failed to load default leaderboard data:', error);
        });
    }
  }, [leaderboardInitialized, selectedLeaderboardCode, fetchLeaderboardData, getLeaderboardDisplayData, getLeaderboardParams]);

  // 优化：使用 useMemo 缓存当前排行榜数据
  // 直接从 store 的 leaderboardData 获取，确保响应式更新
  const currentLeaderboardData = useMemo(() => {
    if (!selectedLeaderboardCode) return null;
    return leaderboardData[selectedLeaderboardCode] || null;
  }, [selectedLeaderboardCode, leaderboardData]);

  // 优化：使用 useMemo 缓存加载状态
  const isLoadingLeaderboard = useMemo(() => {
    if (!selectedLeaderboardCode) return false;
    return leaderboardLoading.leaderboardData[selectedLeaderboardCode] || false;
  }, [selectedLeaderboardCode, leaderboardLoading.leaderboardData]);

  // 优化：计算显示的数据和加载状态，避免在切换时短暂显示空数据
  // 策略：如果有数据就显示数据；如果正在加载或刚切换排行但没有数据，显示加载状态
  const displayData = useMemo(() => {
    // 如果有当前数据，直接使用（即使正在加载新数据，也先显示旧数据）
    if (currentLeaderboardData?.data && currentLeaderboardData.data.length > 0) {
      return currentLeaderboardData.data;
    }
    // 如果没有数据，返回空数组（会根据 loading 状态显示骨架屏或空状态）
    return [];
  }, [currentLeaderboardData]);

  // 优化：计算实际的加载状态
  // 如果正在加载，或者有选中的排行但没有数据（可能是刚切换，loading 状态还没更新），都认为在加载
  const actualLoadingState = useMemo(() => {
    // 如果明确在加载，返回 true
    if (isLoadingLeaderboard) {
      return true;
    }
    // 如果有选中的排行但没有数据，认为正在加载（避免显示"没有数据"）
    if (selectedLeaderboardCode && !currentLeaderboardData) {
      return true;
    }
    return false;
  }, [isLoadingLeaderboard, selectedLeaderboardCode, currentLeaderboardData]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 固定的页面头部 */}
      <TradingHeader />
      
      {/* 排行榜视图 */}
      <View style={styles.leaderboardContainer}>
        <LeaderboardSelector
          categories={displayCategories}
          selectedCategoryId={selectedCategoryId || ''}
          selectedLeaderboardCode={selectedLeaderboardCode || ''}
          onCategorySelect={handleLeaderboardCategorySelect}
          onLeaderboardSelect={handleLeaderboardSelect}
          onAddCustomLeaderboard={handleAddCustomLeaderboard}
          loading={leaderboardLoading.initialization}
        />
        <LeaderboardList
          data={displayData}
          loading={actualLoadingState}
          refreshing={false}
          error={leaderboardError}
          title={selectedLeaderboardCode || undefined}
          onItemPress={handleLeaderboardItemPress}
          onRefresh={handleLeaderboardRefresh}
          ListFooterComponent={<View style={styles.bottomSpacing} />}
        />
      </View>
      
      {/* 排行榜自定义管理组件 */}
      <LeaderboardCustomizer
        visible={showCustomizer}
        onClose={() => setShowCustomizer(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  bottomSpacing: {
    minHeight: MarketNewsBrand.spacing.xxxl + MarketNewsBrand.spacing.sm,
  },
  // 排行榜容器样式
  leaderboardContainer: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
}); 