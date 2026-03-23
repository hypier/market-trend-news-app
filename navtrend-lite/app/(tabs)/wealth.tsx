import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWealthStore , useAuthStore } from '@/stores';
import { useShallow } from 'zustand/react/shallow';
import { ErrorHandler } from '@/utils/errorHandler';
import { useTranslation } from '@/hooks/useTranslation';
import {
  PortfolioChart,
  PositionCard,
  WealthOverviewCard,
} from '../../components/portfolio';
import { CommonHeader } from '../../components/ui';
import { navigateToStockDetail } from '@/helpers/navigation';
import { MarketNewsBrand } from '@/config/brand';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WealthScreen() {
  const { t } = useTranslation();
  
  // ===== 使用Store直接获取状态 - 优化：合并选择器减少重渲染 =====
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // 合并 Store 选择器，减少订阅数量（从 11 次独立调用合并为 1 次批量选择）
  const {
    portfolioStatsData,
    validPositions,
    hasPortfolioData,
    error,
    integratedPortfolio,
    isLoading,
    hasBasicData,
    refresh: storeRefresh,
    clearError
  } = useWealthStore(useShallow((state) => ({
    portfolioStatsData: state.portfolioStatsData,
    validPositions: state.validPositions,
    hasPortfolioData: state.hasPortfolioData,
    error: state.error,
    integratedPortfolio: state.integratedPortfolio,
    isLoading: state.isLoading,
    hasBasicData: state.hasBasicData,
    initializeData: state.initializeData,
    refresh: state.refresh,
    focusRefresh: state.focusRefresh,
    clearError: state.clearError,
  })));
  
  // 从合并的 isLoading 中提取需要的状态
  const isLoadingIntegrated = isLoading.integrated;
  const isRefreshing = isLoading.refreshing;

  // 增强的刷新方法：同时刷新数据和广告
  const refresh = useCallback(async () => {
    try {
      await storeRefresh();
      
    } catch  {
      // 错误已由 store 处理
    }
  }, [storeRefresh]);

  // 请求去重机制：防止快速切换标签页时触发多次请求
  const loadingRef = useRef(false);

  // ===== 页面聚焦时的统一数据加载逻辑 - 优化：使用 getState() 减少依赖项 =====
  useFocusEffect(
    useCallback(() => {
      
      // 防止重复请求
      if (loadingRef.current) {
        return;
      }
      
      // 使用 getState() 获取最新状态，避免依赖项变化
      const state = useWealthStore.getState();
      const authState = useAuthStore.getState();
      
      // 认证检查
      if (!authState.isAuthenticated) {
        return;
      }
      
      // 避免并发加载
      if (state.isLoading.integrated) {
        loadingRef.current = true;
        return;
      }
      
      // 场景1：首次加载（没有任何数据）
      if (!state.hasBasicData) {
        loadingRef.current = true;
        state.initializeData().catch((error) => {
          console.error('[Wealth] ❌ 初始化失败:', error);
          loadingRef.current = false;
        }).finally(() => {
          loadingRef.current = false;
        });
        return;
      }
      
      // 场景2：数据刷新（已有数据，需要更新）
      loadingRef.current = true;
      state.focusRefresh();
      // focusRefresh 是同步的，立即重置
      loadingRef.current = false;
      
    }, []) // 空依赖数组，因为使用 getState()
  );

  // ===== 事件处理器 =====
  const handleStockPress = (symbol: string, exchange?: string) => {
    navigateToStockDetail(symbol, exchange);
  };

  // 渲染加载状态
  const renderLoadingState = useCallback((emptyText: string) => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{emptyText}</Text>
    </View>
  ), []);

  // 渲染空状态
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('portfolio.noPositions')}</Text>
      <Text style={styles.emptySubtext}>
        {t('portfolio.startInvesting')}
      </Text>
    </View>
  ), [t]);

  // 渲染错误状态
  const renderErrorState = useCallback(() => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{t('portfolio.unableToLoad')}</Text>
      <Text style={styles.errorSubtext}>{error}</Text>
      <Text style={styles.retryText} onPress={() => { clearError(); refresh(); }}>
        {t('portfolio.clickRetry')}
      </Text>
    </View>
  ), [t, error, clearError, refresh]);

  // 处理登录按钮点击
  const handleLoginPress = useCallback(() => {
    router.push('/auth/login');
  }, []);

  // 定义加载状态（简化）- 优化：使用 useMemo 缓存计算结果
  const loadingStates = useMemo(() => ({
    // 初始加载：没有数据且正在加载
    initial: isLoadingIntegrated && !hasBasicData,
    // 刷新状态
    refreshing: isRefreshing,
    // 完全加载完成
    fullyLoaded: !isLoadingIntegrated
  }), [isLoadingIntegrated, hasBasicData, isRefreshing]);
  
  // 缓存计算值：是否有持仓
  const hasPositions = useMemo(
    () => validPositions.length > 0,
    [validPositions.length]
  );

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CommonHeader
          iconName="wallet"
          titleKey="portfolio.title"
          subtitleKey="portfolio.subtitle"
          showSearchButton={false}
        />
        <ScrollView style={styles.scrollView}>
          <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="pie-chart-outline" size={64} color={MarketNewsBrand.colors.primary[400]} />
            </View>
            <Text style={styles.emptyStateTitle}>{t('portfolio.title')}</Text>
            <Text style={styles.emptyStateText}>
              {t('portfolio.loginDesc')}
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color={MarketNewsBrand.colors.text.inverse} style={styles.loginButtonIcon} />
              <Text style={styles.loginButtonText}>{t('portfolio.loginNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 如果有错误且没有任何数据，显示错误状态
  if (error && !hasPortfolioData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CommonHeader
          iconName="wallet"
          titleKey="portfolio.title"
          subtitleKey="portfolio.subtitle"
          showSearchButton={false}
        />
        <ScrollView style={styles.scrollView}>
          <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <Text style={styles.emptyStateTitle}>{t('portfolio.title')}</Text>
            {renderErrorState()}
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
       <CommonHeader
          iconName="wallet"
          titleKey="portfolio.title"
          subtitleKey="portfolio.subtitle"
          showSearchButton={false}
        />
      <ScrollView 
      style={styles.scrollView}
      refreshControl={
        <RefreshControl 
          refreshing={loadingStates.refreshing} 
          onRefresh={refresh}
          tintColor={MarketNewsBrand.colors.primary[400]}
          colors={[MarketNewsBrand.colors.primary[400]]}
          enabled={isAuthenticated && !ErrorHandler.shouldStopRetry(error)} // 认证失败时禁用下拉刷新
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 重新设计的财富概览卡片 */}
      <View style={styles.topSection}>
        <WealthOverviewCard
          portfolioStatsData={portfolioStatsData}
          integratedPortfolio={integratedPortfolio}
          isLoading={loadingStates.initial}
          isAuthenticated={isAuthenticated}
          hasPositions={hasPositions}
          hasBasicData={hasBasicData}
        />
      </View>

      {/* Portfolio Chart - 暂时隐藏 */}
      {false && (
        <View style={styles.section}>
          <PortfolioChart
            isLoading={loadingStates.initial}
            symbol={t('portfolio.title')}
          />
        </View>
      )}

      {/* Holdings List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('portfolio.currentHoldings')}</Text>
        </View>
        
        {loadingStates.initial && !hasPositions ? (
          renderLoadingState(t('portfolio.loadingPositions'))
        ) : !hasPositions ? (
          renderEmptyState()
        ) : (
          <View style={styles.holdingsList}>
            {validPositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onPress={() => handleStockPress(position.symbol, position.exchange)}
                trendData={position.trend?.data?.map(item => item.value) || []}
              />
            ))}
          </View>
        )}
      </View>

      {/* 错误提示 */}
      {error && hasPortfolioData && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {error}
          </Text>
          <Text style={styles.errorBannerAction} onPress={clearError}>
            {t('portfolio.close')}
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  topSection: {
    paddingTop: MarketNewsBrand.spacing.xs,
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    ...(Platform.OS === 'web' && {
      marginBottom: 20,
    }),
  },
  section: {
    marginBottom: MarketNewsBrand.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    marginBottom: MarketNewsBrand.spacing.md,
  },
  sectionTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.primary,
  },
  holdingsList: {
    paddingHorizontal: MarketNewsBrand.spacing.sm,
  },
  bottomSpacing: {
    height: MarketNewsBrand.spacing.sm + MarketNewsBrand.spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MarketNewsBrand.spacing.xxxl,
  },
  loadingText: {
    marginLeft: MarketNewsBrand.spacing.xs,
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: MarketNewsBrand.spacing.xl,
  },
  emptyText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold as any,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: MarketNewsBrand.spacing.xs,
  },
  emptySubtext: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: MarketNewsBrand.spacing.xxl,
  },
  errorText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.semantic.error,
    marginBottom: MarketNewsBrand.spacing.xs,
  },
  errorSubtext: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: MarketNewsBrand.spacing.sm,
  },
  retryText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    paddingVertical: MarketNewsBrand.spacing.xxxl * 1.5,
  },
  emptyStateContent: {
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: MarketNewsBrand.spacing.xxxl,
    width: '100%',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 20,
    padding: MarketNewsBrand.spacing.md,
    backgroundColor: MarketNewsBrand.colors.market.successBg,
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
    marginBottom: MarketNewsBrand.spacing.xxl,
  },
  loginButton: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    paddingHorizontal: MarketNewsBrand.spacing.xxxl,
    paddingVertical: MarketNewsBrand.spacing.md,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    minHeight: MarketNewsBrand.spacing.xxxl + MarketNewsBrand.spacing.sm,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  errorBanner: {
    backgroundColor: MarketNewsBrand.colors.market.dangerBg,
    marginHorizontal: MarketNewsBrand.spacing.sm,
    marginBottom: MarketNewsBrand.spacing.md,
    padding: MarketNewsBrand.spacing.sm,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.semantic.error,
    flex: 1,
  },
  errorBannerAction: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.semantic.error,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
});
