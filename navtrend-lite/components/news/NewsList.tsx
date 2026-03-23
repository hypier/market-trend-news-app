import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NewsItem as NewsItemType, NewsArticle } from '../../types/news';
import { NewsItem } from './NewsItem';
import { useTranslation } from '@/hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { Logger, LogModule } from '@/utils/logger';
import { MarketNewsBrand } from '@/config/brand';

// 兼容两种数据类型的联合类型
type NewsData = NewsItemType | NewsArticle;

interface NewsListProps {
  news: NewsData[];
  isLoading: boolean;
  error: string | null;
  onNewsPress: (url: string, title: string) => void;
  formatDate: (dateString: string) => string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyText?: string;
  listHeaderComponent?: React.ReactElement | null;
}

// 安全获取字段值
const getField = (item: NewsData, field: string): any => {
  try {
    if (item && typeof item === 'object' && field in item) {
      return (item as any)[field];
    }
    return null;
  } catch {
    return null;
  }
};

// 获取图片、标题、来源、日期、URL
const getItemImage = (item: NewsData): string | null => {
  return (
    getField(item, 'thumbnail') ||
    getField(item, 'imageUrl') ||
    getField(item, 'urlToImage') ||
    null
  );
};
const getItemUrl = (item: NewsData): string => getField(item, 'url') || getField(item, 'sourceUrl') || '';
const getItemTitle = (item: NewsData): string => getField(item, 'title') || '';
const getItemSource = (item: NewsData): string => {
  const publisher = getField(item, 'publisher');
  if (publisher && typeof publisher === 'object' && 'name' in publisher) {
    return (publisher as any).name || '';
  }
  const sourceObj = getField(item, 'source');
  if (sourceObj && typeof sourceObj === 'object' && 'name' in sourceObj) {
    return (sourceObj as any).name || '';
  }
  return sourceObj || '';
};
const getItemDate = (item: NewsData): string => getField(item, 'date') || getField(item, 'publishedAt') || '';

// 预留：如需基于屏宽的自适应，可在此使用
// const { width: screenWidth } = Dimensions.get('window');

// 安全获取新闻项的唯一标识符
const getNewsKey = (item: NewsData, index: number): string => {
  if (!item || typeof item !== 'object') {
    return `news-fallback-${index}`;
  }
  
  // 尝试获取各种可能的唯一标识符
  const id = (item as any).id;
  const url = (item as any).url || (item as any).sourceUrl;
  const title = (item as any).title;
  
  if (id) return `news-id-${id}`;
  if (url) {
    // 使用完整的URL hash + index 确保唯一性
    try {
      const urlHash = btoa(encodeURIComponent(url)).replace(/[^a-zA-Z0-9]/g, '');
      return `news-url-${urlHash}-${index}`;
    } catch {
      // 如果base64编码失败，使用简单的hash
      let hash = 0;
      for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `news-url-${Math.abs(hash)}-${index}`;
    }
  }
  if (title) {
    try {
      const titleHash = btoa(encodeURIComponent(title)).replace(/[^a-zA-Z0-9]/g, '');
      return `news-title-${titleHash.substring(0, 20)}-${index}`;
    } catch {
      return `news-title-fallback-${index}`;
    }
  }
  
  return `news-index-${index}`;
};

export const NewsList: React.FC<NewsListProps> = ({ 
  news, 
  isLoading, 
  error: _unusedError, 
  onNewsPress,
  formatDate,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  refreshing = false,
  onRefresh,
  emptyText,
  listHeaderComponent,
}) => {
  const { t } = useTranslation();
  
  // 新闻数据处理

  const renderFullImageCard = (item: NewsData, index: number) => {
    const image = getItemImage(item);
    if (!image) return null;
    const title = getItemTitle(item);
    const url = getItemUrl(item);
    const source = getItemSource(item);
    const date = getItemDate(item);

    const handlePress = () => {
      if (url) onNewsPress(url, title);
    };

    return (
      <TouchableOpacity
        key={getNewsKey(item, index)}
        style={styles.fullCard}
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={!url}
      >
        <Image source={{ uri: image }} style={styles.fullImage} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.75)"]}
          locations={[0, 0.55, 1]}
          style={styles.fullGradient}
        />
        <View style={styles.fullContent}>
          <Text style={styles.fullTitle} numberOfLines={2}>{title}</Text>
          <View style={styles.fullFooter}>
            {!!source && <Text style={styles.fullSource} numberOfLines={1}>{source}</Text>}
            {!!date && <Text style={styles.fullDate}>{formatDate(date)}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{emptyText || t('components.news.list.empty')}</Text>
      <Text style={styles.emptyStateText}>{t('components.news.list.emptyDescription')}</Text>
    </View>
  );

  const renderLoadMoreFooter = () => {
    if (!hasMore || !isLoadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={MarketNewsBrand.colors.primary[400]} />
        <Text style={styles.loadMoreText}>{t('components.news.list.loadingMore')}</Text>
      </View>
    );
  };

  if (isLoading && (!news || news.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
        <Text style={styles.loadingText}>{t('components.news.list.loading')}</Text>
      </View>
    );
  }

  if (!news || news.length === 0) {
    return renderEmptyState();
  }

  // 过滤掉空值或无效的新闻项
  const validNews = news.filter((item, index) => {
    if (!item || typeof item !== 'object') {
      Logger.warn(LogModule.NEWS, `NewsList: 发现无效的新闻项 at index ${index}:`, item);
      return false;
    }
    return true;
  });

  if (validNews.length === 0) {
    Logger.warn(LogModule.NEWS, 'NewsList: 过滤后没有有效的新闻项');
    return renderEmptyState();
  }

  // 计算全图卡片应出现的位置：每 7 条普通新闻后，选取后续最近一条有图新闻作为全图卡片
  const itemHasImage = (it: NewsData) => !!getItemImage(it);
  const fullImageIndices = new Set<number>();
  {
    let index = 0;
    let normalCountSinceLastFull = 0;
    const total = validNews.length;
    while (index < total) {
      // 跳过已标记为全图的索引（初始无）或按普通条计数
      normalCountSinceLastFull += 1;
      if (normalCountSinceLastFull === 7) {
        // 在后续中寻找第一条有图的新闻
        let k = index + 1;
        let found = -1;
        while (k < total) {
          if (itemHasImage(validNews[k])) {
            found = k;
            break;
          }
          k += 1;
        }
        if (found >= 0) {
          fullImageIndices.add(found);
          // 重置计数，从全图卡片之后继续计数
          index = found + 1;
          normalCountSinceLastFull = 0;
          continue;
        } else {
          // 未找到后续有图新闻，结束
          break;
        }
      }
      index += 1;
    }
  }

  const renderNewsItem = ({ item, index }: { item: NewsData; index: number }) => {
    try {
      if (fullImageIndices.has(index) && getItemImage(item)) {
        return renderFullImageCard(item, index);
      }
      return (
        <NewsItem 
          key={getNewsKey(item, index)}
          item={item} 
          onPress={onNewsPress} 
          formatDate={formatDate}
        />
      );
    } catch (error) {
      Logger.error(LogModule.NEWS, `NewsList: 渲染新闻项 ${index} 时出错:`, error);
      return null;
    }
  };

  try {
    return (
      <FlatList
        data={validNews}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => getNewsKey(item, index)}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={listHeaderComponent || null}
        ListFooterComponent={renderLoadMoreFooter}
        style={styles.newsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MarketNewsBrand.colors.primary[400]}
              colors={[MarketNewsBrand.colors.primary[400]]}
            />
          ) : undefined
        }
      />
    );
  } catch (error) {
    Logger.error(LogModule.NEWS, 'NewsList: 渲染列表时出错:', error);
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>{t('components.news.list.renderError')}</Text>
        <Text style={styles.emptyStateText}>{t('components.news.list.retryMessage')}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  newsList: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  loadingText: {
    color: MarketNewsBrand.colors.primary[400],
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    marginTop: 12,
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    color: MarketNewsBrand.colors.primary[400],
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    marginTop: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    color: MarketNewsBrand.colors.text.secondary,
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    textAlign: 'center',
  },
  // 全图卡片样式
  fullCard: {
    height: 220,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  fullGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  fullContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
  },
  fullTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.background.primary,
    lineHeight: 20,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fullFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullSource: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    flex: 1,
    marginRight: 8,
  },
  fullDate: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
}); 