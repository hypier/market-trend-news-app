import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NewsItem as NewsItemType, NewsArticle } from '../../types/news';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';

// 兼容两种数据类型的联合类型
type NewsData = NewsItemType | NewsArticle;

interface NewsItemProps {
  item: NewsData;
  onPress: (url: string, title: string) => void;
  formatDate: (dateString: string) => string;
}

// 安全获取字段值的辅助函数
const getNewsField = (item: NewsData, field: string): any => {
  try {
    // 检查字段是否存在
    if (item && typeof item === 'object' && field in item) {
      return (item as any)[field];
    }
    return null;
  } catch (error) {
    Logger.warn(LogModule.NEWS, `NewsItem: 获取字段 ${field} 时出错:`, error);
    return null;
  }
};

// 安全获取新闻URL
const getNewsUrl = (item: NewsData): string => {
  return getNewsField(item, 'url') || getNewsField(item, 'sourceUrl') || '';
};

// 安全获取新闻标题
const getNewsTitle = (item: NewsData, t: (key: string) => string): string => {
  return getNewsField(item, 'title') || t('components.news.item.noTitle');
};

// 安全获取新闻摘要
const getNewsExcerpt = (item: NewsData): string => {
  const excerpt = getNewsField(item, 'excerpt') || getNewsField(item, 'summary') || '';
  return excerpt.trim(); // 如果为空就返回空字符串，不显示"暂无摘要"
};

// 安全获取新闻图片
const getNewsImage = (item: NewsData): string | null => {
  return getNewsField(item, 'thumbnail') || getNewsField(item, 'imageUrl') || null;
};

// 安全获取新闻来源
const getNewsSource = (item: NewsData, t: (key: string) => string): string => {
  const publisher = getNewsField(item, 'publisher');
  if (publisher && typeof publisher === 'object' && 'name' in publisher) {
    return publisher.name || t('components.news.item.unknownSource');
  }
  return getNewsField(item, 'source') || t('components.news.item.unknownSource');
};

// 安全获取新闻日期
const getNewsDate = (item: NewsData): string => {
  return getNewsField(item, 'date') || getNewsField(item, 'publishedAt') || '';
};

export const NewsItem: React.FC<NewsItemProps> = ({ item, onPress, formatDate }) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 如果 item 为空，返回空组件
  if (!item || typeof item !== 'object') {
    return null;
  }

  const newsUrl = getNewsUrl(item);
  const newsTitle = getNewsTitle(item, t);
  const newsExcerpt = getNewsExcerpt(item);
  const newsImage = getNewsImage(item);
  const newsSource = getNewsSource(item, t);
  const newsDate = getNewsDate(item);

  const handlePress = () => {
    if (newsUrl && onPress) {
      onPress(newsUrl, newsTitle);
    }
  };

  return (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!newsUrl} // 如果没有URL则禁用点击
    >
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={newsExcerpt ? 2 : 3}>
          {newsTitle}
        </Text>
        {newsExcerpt ? (
          <Text style={styles.newsSummary} numberOfLines={1}>
            {newsExcerpt}
          </Text>
        ) : null}
        <View style={styles.newsFooter}>
          <Text style={styles.newsSource} numberOfLines={1}>{newsSource}</Text>
          <Text style={styles.newsDate}>
            {newsDate ? formatDate(newsDate) : ''}
          </Text>
        </View>
      </View>
      {newsImage && !imageError && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: newsImage }} 
            style={styles.newsImage}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <View style={[styles.newsImage, styles.placeholderImage, styles.loadingImage]}>
              <View style={styles.iconBackground}>
                <Ionicons name="newspaper-outline" size={20} color={MarketNewsBrand.colors.text.secondary} />
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  newsItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  placeholderImage: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBackground: {
    width: 36,
    height: 36,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newsContent: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    lineHeight: 20,
    marginBottom: 4,
  },
  newsSummary: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    flex: 1,
  },
  newsDate: {
    color: MarketNewsBrand.colors.text.tertiary,
    fontSize: MarketNewsBrand.typography.fontSize.xs,
  }
}); 