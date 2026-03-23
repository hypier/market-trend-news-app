/**
 * 股票详情页面 - 重构版本 v2：组件化拆分
 * 
 * 显示股票的详细信息，包括：
 * - 股票基本信息和实时价格
 * - TradingView 交互式图表
 * - 关键统计数据
 * - 公司简介、财务数据、相关新闻等标签页内容
 * 
 * 重构改进：
 * - 使用 useStockDetailData Hook 统一数据管理
 * - 拆分为多个功能组件，提高可维护性
 * 
 * @author MarketNews Team
 * @version 3.0.0
 */

import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import {
  FloatingActionButtons,
  StockStatsGrid,
  ErrorStateView,
  StockChartSection,
  StockAboutTab,
  StockTechnicalTab,
  StockNewsTab,
  AdvancedCandlestickChart,
} from '../../components/stock'; // 修正路径
import { PositionButton } from '../../components/stock/PositionButton';
import { parseSymbol } from '../../helpers/symbolUtils'; // 修正路径

import {
  useStockDetailData,
  useTranslation
} from '../../hooks'; // 修正路径
import { Logger, LogModule } from '../../utils/logger'; // 修正路径
import {
  StockTabsSkeleton
} from '../../components/skeletons'; // 修正路径
import { useSettingsStore, useExchangeRateStore, useTradingViewStore, useWealthStore } from '../../stores'; // 修正路径
import { MarketNewsBrand } from '../../config/brand'; // 添加品牌配置导入

export default function StockDetailScreen() {
  const { t } = useTranslation();
  const { symbol: routeParam } = useLocalSearchParams<{ symbol: string }>();

  // 解码并解析symbol，处理复合格式（如 NASDAQ:AAPL）或纯股票代码（如 NVDA）
  const decodedParam = routeParam ? decodeURIComponent(routeParam) : '';

  // 如果已经是复合格式，直接解析；否则使用默认交易所构建复合格式
  let symbolInfo: { symbol: string; exchange: string; composite: string };
  if (decodedParam.includes(':')) {
    // 已经是复合格式，直接解析
    symbolInfo = parseSymbol(decodedParam);
  } else {
    // 纯股票代码，使用默认交易所（NASDAQ）构建复合格式
    const defaultExchange = 'NASDAQ';
    symbolInfo = {
      symbol: decodedParam,
      exchange: defaultExchange,
      composite: `${defaultExchange}:${decodedParam}`
    };
  }

  const { symbol, exchange } = symbolInfo;

  // 图表全屏状态
  const [isChartFullscreen, setIsChartFullscreen] = React.useState(false);
  // 当前选中的周期
  const [selectedPeriod, setSelectedPeriod] = React.useState('1day');
  // 当前持仓信息
  const [currentPosition, setCurrentPosition] = useState<any>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const isPositionLoadingRef = useRef(false);

  // ===== 货币转换相关 =====
  const targetCurrency = useSettingsStore(state => state.currency) || 'USD';
  const { convertCurrency } = useExchangeRateStore();
  const [convertedPrice, setConvertedPrice] = React.useState<number | null>(null);

  // ===== 使用统一的数据管理 Hook =====
  const {
    // 市场数据
    tvQuote,
    tvStockInfo,
    tvHistory,
    tvLoading,
    tvError,
    chartData,

    // 业务数据
    isAuthenticated,
    businessError,

    // 新闻数据
    newsItems,
    newsLoading,
    newsError,
    compositeSymbol,

    // UI 状态
    selectedTab,
    isRefreshing,
    isInWatchlist,

    // 操作方法
    setSelectedTab,
    handleFavoritePress,
    handleRetryNews,
    refreshAllData,
  } = useStockDetailData({
    symbol,
    exchange,
    currentPeriod: selectedPeriod // 🔥 传入当前图表周期，用于 WebSocket 订阅
  });

  // 处理关注按钮点击
  const handleWatchlistPress = useCallback(() => {
    // handleFavoritePress 需要3个参数：symbol, favorite, exchange
    handleFavoritePress(symbol, !isInWatchlist, exchange);
  }, [handleFavoritePress, symbol, isInWatchlist, exchange]);

  const hasPosition = useMemo(() => {
    return !!currentPosition && Number(currentPosition.quantity || 0) > 0;
  }, [currentPosition]);

  const positionQuantity = useMemo(() => {
    return Number(currentPosition?.quantity || 0);
  }, [currentPosition]);

  const handlePositionPress = useCallback(() => {
    const composite = `${exchange}:${symbol}`;
    router.push({
      pathname: '/stock/position/add/[symbol]',
      params: {
        symbol: composite,
        mode: hasPosition ? 'reduce' : 'add',
      },
    } as any);
  }, [exchange, symbol, hasPosition]);

  const loadPosition = useCallback(async () => {
    isPositionLoadingRef.current = true;

    try {
      setPositionLoading(true);
      const position = await useWealthStore.getState().getStockPosition(symbol, exchange);
      if (isPositionLoadingRef.current) {
        setCurrentPosition(position);
      }
    } catch (error) {
      Logger.warn(LogModule.STOCK, '[StockDetail] 获取持仓信息失败', error);
      if (isPositionLoadingRef.current) {
        setCurrentPosition(null);
      }
    } finally {
      if (isPositionLoadingRef.current) {
        setPositionLoading(false);
      }
    }
  }, [symbol, exchange]);

  useEffect(() => {
    loadPosition();

    return () => {
      isPositionLoadingRef.current = false;
    };
  }, [loadPosition]);

  useFocusEffect(
    useCallback(() => {
      loadPosition();
    }, [loadPosition])
  );

  // 定义标签页
  const TABS = [
    { key: 'about', label: t('stock.about') },
    { key: 'technical', label: t('stock.technical') },
    { key: 'news', label: t('stock.news') },
  ];

  // ===== 性能优化：useMemo 缓存计算 =====

  // 缓存价格统计数据
  const priceStats = useMemo(() => {
    const currentPrice = tvQuote?.lp || 0;
    const priceChange = tvQuote?.ch || 0;
    const changePercent = tvQuote?.chp || tvQuote?.rchp || 0;
    const isPositive = priceChange >= 0;

    return { currentPrice, priceChange, changePercent, isPositive };
  }, [tvQuote?.lp, tvQuote?.ch, tvQuote?.chp, tvQuote?.rchp]);

  // 缓存图表极值计算（避免每次遍历数组）
  const chartStats = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 0 };

    let min = chartData[0];
    let max = chartData[0];
    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i] < min) min = chartData[i];
      if (chartData[i] > max) max = chartData[i];
    }

    return { minPrice: min, maxPrice: max };
  }, [chartData]);

  // 缓存显示数据（减少对象创建）
  const displayData = useMemo(() => ({
    symbol,
    name: tvStockInfo?.description || tvQuote?.description || tvQuote?.short_name || '',
    exchange: tvStockInfo?.listed_exchange || tvStockInfo?.exchange || exchange,
    currency: tvQuote?.currency_code || 'USD',
  }), [symbol, exchange, tvStockInfo?.description, tvStockInfo?.listed_exchange, tvStockInfo?.exchange, tvQuote?.description, tvQuote?.short_name, tvQuote?.currency_code]);

  // ===== 性能优化：useCallback 包裹回调函数 =====

  const handleFullscreenPress = useCallback(() => {
    Logger.info(LogModule.STOCK, '[StockDetail] 打开全屏图表', { symbol });
    setIsChartFullscreen(true);
  }, [symbol]);

  const handleFullscreenClose = useCallback(() => {
    Logger.info(LogModule.STOCK, '[StockDetail] 关闭全屏图表', { symbol });
    setIsChartFullscreen(false);
  }, [symbol]);

  const handlePeriodChange = useCallback(async (period: string) => {
    Logger.info(LogModule.STOCK, '[StockDetail] 切换图表周期', { symbol, period });
    setSelectedPeriod(period);
    // 🔥 使用 silentRefreshHistory 避免触发全局 loading，不刷新整个页面
    await useTradingViewStore.getState().silentRefreshHistory(symbol, exchange, period);
  }, [symbol, exchange]);


  const handleTabChange = useCallback((tabKey: string) => {
    setSelectedTab(tabKey);
  }, [setSelectedTab]);

  // ===== 货币转换逻辑 =====
  React.useEffect(() => {
    const performConversion = async () => {
      if (targetCurrency !== 'USD' && priceStats.currentPrice > 0) {
        try {
          const converted = await convertCurrency(
            priceStats.currentPrice,
            displayData.currency || 'USD',
            targetCurrency
          );
          setConvertedPrice(converted);
        } catch (error) {
          Logger.warn(LogModule.STOCK, '货币转换失败:', error);
          setConvertedPrice(null);
        }
      } else {
        setConvertedPrice(null);
      }
    };

    performConversion();
  }, [priceStats.currentPrice, targetCurrency, displayData.currency, convertCurrency]);

  // ===== 性能优化：useMemo 缓存标签页内容 =====

  const tabContent = useMemo(() => {
    switch (selectedTab) {
      case 'about':
        return <StockAboutTab quote={tvQuote} stockInfo={tvStockInfo} />;

      case 'technical':
        return (
          <StockTechnicalTab
            symbol={symbol}
            exchange={exchange}
            currency={displayData.currency}
          />
        );

      case 'news':
        return (
          <StockNewsTab
            newsItems={newsItems}
            isLoading={newsLoading}
            error={newsError}
            compositeSymbol={compositeSymbol}
            onRetry={handleRetryNews}
          />
        );

      default:
        return null;
    }
  }, [selectedTab, symbol, exchange, displayData.currency, tvQuote, tvStockInfo, newsItems, newsLoading, newsError, compositeSymbol, handleRetryNews]);

  // 渲染错误状态
  const hasError = (tvError || businessError) && !tvQuote;
  if (hasError) {
    return (
      <ErrorStateView
        title={t('common.loadFailed')}
        message={tvError || businessError || 'Unknown error'}
        retryText={t('common.retry')}
        onRetry={refreshAllData}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: symbol, headerShown: false }} />
      <View style={styles.container}>
        {/* 浮动操作按钮 - 使用乐观更新，无需显示loading */}
        <FloatingActionButtons
          onBack={() => router.back()}
          onFavorite={handleWatchlistPress}
          isFavorite={isInWatchlist}
        />


        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || tvLoading.quote}
              onRefresh={refreshAllData}
              colors={[MarketNewsBrand.colors.market.bullish]}
              tintColor={MarketNewsBrand.colors.market.bullish}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* 图表区域 - 使用拆分后的组件 */}
          <StockChartSection
            symbol={displayData.symbol}
            name={displayData.name}
            exchange={displayData.exchange}
            logoid={tvQuote?.logoid}
            baseCurrencyLogoid={tvQuote?.['base-currency-logoid']}
            currencyLogoid={tvQuote?.['currency-logoid']}
            currentPrice={priceStats.currentPrice}
            priceChange={priceStats.priceChange}
            changePercent={priceStats.changePercent}
            currency={displayData.currency}
            isPositive={priceStats.isPositive}
            isLoading={tvLoading.quote || tvLoading.history}
            onFullscreenPress={handleFullscreenPress}
            onPeriodChange={handlePeriodChange}
            selectedPeriod={selectedPeriod}
            convertedPrice={convertedPrice}
            targetCurrency={targetCurrency}
            pricescale={tvQuote?.pricescale}
          />

          {/* 关键数据网格 */}
          <StockStatsGrid
            openPrice={tvQuote?.open_price || 0}
            highPrice={chartStats.maxPrice || 0}
            lowPrice={chartStats.minPrice || 0}
            volume={tvQuote?.volume || 0}
            currency={displayData.currency}
            isLoading={tvLoading.quote || tvLoading.history}
            pricescale={tvQuote?.pricescale}
          />

          {/* 持仓操作入口 */}
          <View style={styles.positionActionSection}>
            <PositionButton
              hasPosition={hasPosition}
              positionQuantity={positionQuantity}
              isAuthenticated={isAuthenticated}
              isLoading={positionLoading}
              onPress={handlePositionPress}
              symbol={symbol}
            />
          </View>

          {/* 标签页区域 */}
          {tvQuote ? (
            tvLoading.quote ? (
              <StockTabsSkeleton />
            ) : (
              <View style={styles.tabsContainer}>
                <View style={styles.tabsHeader}>
                  {TABS.map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.tabButton,
                        selectedTab === tab.key && styles.tabButtonActive
                      ]}
                      onPress={() => handleTabChange(tab.key)}
                    >
                      <Text style={[
                        styles.tabButtonText,
                        selectedTab === tab.key && styles.tabButtonTextActive
                      ]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {tabContent}
              </View>
            )
          ) : null}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* 全屏蜡烛图模态框 */}
        {isChartFullscreen && tvHistory && tvHistory.length > 0 && (
          <AdvancedCandlestickChart
            candles={tvHistory}
            isLoading={tvLoading.history}
            symbol={displayData.symbol}
            name={displayData.name}
            exchange={displayData.exchange}
            currency={displayData.currency}
            onClose={handleFullscreenClose}
            onPeriodChange={handlePeriodChange}
            selectedPeriod={selectedPeriod}
            showVolume={true}
            pricescale={tvQuote?.pricescale}
          />
        )}

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  scrollContainer: {
    flex: 1,
  },

  // 标签页样式
  tabsContainer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: MarketNewsBrand.colors.text.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.border.default,
  },
  positionActionSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: MarketNewsBrand.colors.market.bullish,
  },
  tabButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  tabButtonTextActive: {
    color: MarketNewsBrand.colors.market.bullish,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },

  bottomSpacing: {
    height: MarketNewsBrand.spacing.sm + MarketNewsBrand.spacing.xs,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    padding: MarketNewsBrand.spacing.xxl,
  },
  errorText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.market.bearish,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: MarketNewsBrand.colors.market.bullish,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: MarketNewsBrand.borderRadius.lg,
  },
  retryButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MarketNewsBrand.spacing.xxl,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  emptyText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: 'bold',
    color: MarketNewsBrand.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stockSymbol: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: MarketNewsBrand.colors.text.primary,
  },
  stockName: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
    flexShrink: 1,
    marginLeft: 10,
  },
  priceSection: {
    marginBottom: 20,
  },
  currentPrice: {
    fontSize: MarketNewsBrand.typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: MarketNewsBrand.colors.text.primary,
  },
  changeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginTop: 5,
  },
  positiveChange: {
    color: MarketNewsBrand.colors.market.bullish,
  },
  negativeChange: {
    color: MarketNewsBrand.colors.market.bearish,
  },
  detailTitle: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 30,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.border.default,
  },
  detailLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.tertiary,
  },
  detailValue: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
}); 