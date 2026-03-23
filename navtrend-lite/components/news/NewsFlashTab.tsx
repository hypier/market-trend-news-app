/**
 * 新闻快讯标签页组件
 * 
 * 功能：
 * - 支持8种市场类型切换（bond/crypto/economic/etf/forex/futures/index/stock）
 * - 本地搜索功能（标题和提供者）
 * - 下拉刷新
 * - 时间轴风格展示（左侧时间线 + 时间点标记 + 内容卡片）
 * - 日期分组显示（今天/昨天/具体日期）
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNewsStore } from '@/stores';
import { TimelineNewsItem } from './TimelineNewsItem';
import { TimelineDateHeader } from './TimelineDateHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';
import { groupNewsByDate, GroupedNewsItem } from '@/utils/newsGrouping';

// 市场类型定义
const MARKET_TYPES = [
  { key: 'all', labelKey: 'news.flash.markets.all' },
  { key: 'stock', labelKey: 'news.flash.markets.stock' },
  { key: 'crypto', labelKey: 'news.flash.markets.crypto' },
  { key: 'forex', labelKey: 'news.flash.markets.forex' },
  { key: 'index', labelKey: 'news.flash.markets.index' },
  { key: 'futures', labelKey: 'news.flash.markets.futures' },
  { key: 'etf', labelKey: 'news.flash.markets.etf' },
  { key: 'bond', labelKey: 'news.flash.markets.bond' },
  { key: 'economic', labelKey: 'news.flash.markets.economic' },
] as const;

export function NewsFlashTab() {
  const { t } = useTranslation();
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 从Store获取数据
  const newsFlash = useNewsStore(state => state.newsFlash);
  const isLoading = useNewsStore(state => state.isLoading.newsFlash);
  const error = useNewsStore(state => state.error);
  const fetchNewsFlash = useNewsStore(state => state.fetchNewsFlash);

  // 获取当前市场的新闻
  const currentNews = React.useMemo(() => {
    return newsFlash[selectedMarket] || [];
  }, [newsFlash, selectedMarket]);

  // 根据搜索关键词过滤新闻
  const filteredNews = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return currentNews;
    }
    const query = searchQuery.toLowerCase().trim();
    return currentNews.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.provider?.name && item.provider.name.toLowerCase().includes(query))
    );
  }, [currentNews, searchQuery]);

  // 按日期分组新闻（用于时间轴显示）
  const groupedNews = React.useMemo(() => {
    return groupNewsByDate(filteredNews);
  }, [filteredNews]);

  // 清除搜索
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // 切换市场类型
  const handleMarketChange = useCallback((market: string) => {
    setSelectedMarket(market);
    setSearchQuery(''); // 切换市场时清空搜索
  }, []);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNewsFlash(selectedMarket);
    } finally {
      setRefreshing(false);
    }
  }, [selectedMarket, fetchNewsFlash]);

  // 重试加载
  const handleRetry = useCallback(() => {
    fetchNewsFlash(selectedMarket);
  }, [selectedMarket, fetchNewsFlash]);

  // 初始加载和市场切换时获取数据
  useEffect(() => {
    // 如果该市场还没有数据，则获取
    if (!newsFlash[selectedMarket] && !isLoading) {
      fetchNewsFlash(selectedMarket);
    }
  }, [selectedMarket, newsFlash, isLoading, fetchNewsFlash]);

  // 渲染市场类型选择器
  const renderMarketSelector = () => (
    <View style={styles.marketSelectorContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.marketSelectorContent}
      >
        {MARKET_TYPES.map((market) => (
          <TouchableOpacity
            key={market.key}
            style={[
              styles.marketButton,
              selectedMarket === market.key && styles.marketButtonSelected,
            ]}
            onPress={() => handleMarketChange(market.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.marketButtonText,
                selectedMarket === market.key && styles.marketButtonTextActive,
              ]}
            >
              {t(market.labelKey, { defaultValue: market.key })}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // 渲染搜索框
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons
        name="search"
        size={18}
        color="#9ca3af"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={t('stock.searchNews', { defaultValue: 'Search news...' })}
        placeholderTextColor={MarketNewsBrand.colors.text.tertiary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          onPress={handleClearSearch}
          style={styles.clearButton}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={MarketNewsBrand.colors.text.tertiary}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // 渲染内容区域
  const renderContent = () => {
    // 加载中状态
    if (isLoading && !newsFlash[selectedMarket]) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
          <Text style={styles.loadingText}>
            {t('common.loading')}...
          </Text>
        </View>
      );
    }

    // 错误状态
    if (error && !newsFlash[selectedMarket]) {
      return (
        <View style={styles.centerContent}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={MarketNewsBrand.colors.semantic.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // 无新闻
    if (currentNews.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Ionicons
            name="newspaper-outline"
            size={64}
            color={MarketNewsBrand.colors.primary[300]}
          />
          <Text style={styles.emptyText}>
            {t('stock.noNewsAvailable', { defaultValue: 'No news available' })}
          </Text>
        </View>
      );
    }

    // 搜索无结果
    if (filteredNews.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Ionicons
            name="search-outline"
            size={64}
            color={MarketNewsBrand.colors.primary[300]}
          />
          <Text style={styles.emptyText}>
            {t('stock.noNewsFound', { defaultValue: 'No news found' })}
          </Text>
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>
              {t('common.clear', { defaultValue: 'Clear' })}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // 新闻列表（时间轴样式 + 日期分组）
    return (
      <FlatList
        data={groupedNews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: GroupedNewsItem }) => {
          if (item.type === 'header') {
            // 渲染日期分组头部
            return <TimelineDateHeader date={item.date || ''} />;
          } else {
            // 渲染新闻项
            return (
              <TimelineNewsItem 
                item={item.newsItem!}
                isFirst={item.isFirstInGroup || false}
                isLast={item.isLastInGroup || false}
                showTimeLabel={item.showTimeLabel !== false}
              />
            );
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={MarketNewsBrand.colors.primary[400]}
          />
        }
        ListHeaderComponent={
          <>
            {renderSearchBar()}
            {searchQuery.trim() ? (
              <Text style={styles.searchResultText}>
                {t('stock.newsSearchResults', {
                  defaultValue: `Found ${filteredNews.length} related news`,
                  count: filteredNews.length
                })}
              </Text>
            ) : null}
          </>
        }
        contentContainerStyle={styles.newsListContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 市场类型选择器 - 固定在顶部 */}
      {renderMarketSelector()}
      
      {/* 内容区域 - 可滚动（包含搜索框） */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  contentContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.semantic.error,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderRadius: MarketNewsBrand.borderRadius.xl,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.inverse,
  },
  
  // 市场类型选择器 - 参考 trading.tsx 样式
  marketSelectorContainer: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingTop: 6,
  },
  marketSelectorContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  marketButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  marketButtonSelected: {
    borderBottomColor: MarketNewsBrand.colors.primary[400],
  },
  marketButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
  },
  marketButtonTextActive: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
  
  // 搜索框 - 美化样式
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    marginHorizontal: 14,
    marginTop: 8,
    paddingHorizontal: 14,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    height: 40,
    shadowColor: '#9ca3af',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: MarketNewsBrand.colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchResultText: {
    fontSize: 15,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    paddingHorizontal: 14,
  },
  newsListContainer: {
    paddingTop: 4,
    paddingBottom: 24,
  },
});

