/**
 * 股票详情 - News 标签页
 * 
 * 展示股票相关新闻，支持搜索过滤和分页加载
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NewsListItem } from './NewsListItem';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';
import type { TradingViewNewsItem } from '@/types/stock';

// 分页配置
const PAGE_SIZE = 10; // 每页显示10条新闻


interface StockNewsTabProps {
  newsItems: TradingViewNewsItem[];
  isLoading: boolean;
  error: string | null;
  compositeSymbol: string;
  onRetry: () => void;
}

export const StockNewsTab = React.memo(function StockNewsTab({ 
  newsItems, 
  isLoading, 
  error,
  onRetry 
}: StockNewsTabProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [displayCount, setDisplayCount] = React.useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // 根据搜索关键词过滤新闻
  const filteredNews = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return newsItems;
    }
    const query = searchQuery.toLowerCase().trim();
    return newsItems.filter(item => 
      item.title.toLowerCase().includes(query) ||
      (item.provider?.name && item.provider.name.toLowerCase().includes(query))
    );
  }, [newsItems, searchQuery]);

  // 当前显示的新闻（分页）
  const displayedNews = React.useMemo(() => {
    return filteredNews.slice(0, displayCount);
  }, [filteredNews, displayCount]);

  // 是否还有更多数据
  const hasMore = displayedNews.length < filteredNews.length;

  // 清除搜索
  const handleClearSearch = React.useCallback(() => {
    setSearchQuery('');
    setDisplayCount(PAGE_SIZE); // 重置分页
  }, []);

  // 自动加载更多（滚动到底部时触发）
  const handleLoadMore = React.useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    // 模拟加载延迟，让用户看到加载状态
    setTimeout(() => {
      setDisplayCount(prev => prev + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore]);

  // 搜索时重置分页
  React.useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery]);

  // 加载中状态
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>
            {t('common.loading')}...
          </Text>
        </View>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={onRetry}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 无新闻且无搜索
  if (newsItems.length === 0 && !searchQuery.trim()) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {t('stock.noNewsAvailable', { defaultValue: 'No news available' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜索框 - 只在有新闻时显示 */}
      {newsItems.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={18} 
            color={MarketNewsBrand.colors.text.tertiary}
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
      )}
      
      {/* 新闻列表或无结果提示 */}
      {filteredNews.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() 
              ? t('stock.noNewsFound', { defaultValue: 'No news found' })
              : t('stock.noNewsAvailable', { defaultValue: 'No news available' })
            }
          </Text>
          {searchQuery.trim() && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                {t('common.clear', { defaultValue: 'Clear' })}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedNews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NewsListItem item={item} />}
          scrollEnabled={false}
          ListHeaderComponent={
            searchQuery.trim() ? (
              <Text style={styles.searchResultText}>
                {t('stock.newsSearchResults', { 
                  defaultValue: `Found ${filteredNews.length} related news`,
                  count: filteredNews.length 
                })}
              </Text>
            ) : null
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={MarketNewsBrand.colors.primary[400]} />
                <Text style={styles.loadingMoreText}>
                  {t('common.loading', { defaultValue: 'Loading' })}...
                </Text>
              </View>
            ) : !hasMore && displayedNews.length > PAGE_SIZE ? (
              <View style={styles.endOfListContainer}>
                <Text style={styles.endOfListText}>
                  {t('common.noMoreData', { defaultValue: 'No more news' })}
                </Text>
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.newsListContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
          initialNumToRender={PAGE_SIZE}
        />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在新闻数据或状态变化时重渲染
  return (
    prevProps.newsItems.length === nextProps.newsItems.length &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.compositeSymbol === nextProps.compositeSymbol
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    minHeight: 400,
  },
  centerContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: MarketNewsBrand.colors.text.tertiary,
  },
  errorText: {
    textAlign: 'center',
    color: MarketNewsBrand.colors.semantic.error,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: MarketNewsBrand.colors.text.tertiary,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  retryText: {
    color: MarketNewsBrand.colors.primary[400],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchResultText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  newsListContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
  },
});

