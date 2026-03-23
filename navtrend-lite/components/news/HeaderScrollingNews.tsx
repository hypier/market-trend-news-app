import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsItem as NewsItemType, NewsArticle } from '../../types/news';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';

// 兼容两种数据类型的联合类型
type NewsData = NewsItemType | NewsArticle;

interface HeaderScrollingNewsProps {
  news: NewsData[];
  onNewsPress: (url: string, title: string) => void;
  formatDate: (dateString: string) => string;
}

// 安全获取字段值的辅助函数
const getNewsField = (item: NewsData, field: string): any => {
  try {
    if (item && typeof item === 'object' && field in item) {
      return (item as any)[field];
    }
    return null;
  } catch (error) {
    Logger.warn(LogModule.NEWS, `HeaderScrollingNews: 获取字段 ${field} 时出错:`, error);
    return null;
  }
};

// 安全获取新闻图片
const getNewsImage = (item: NewsData): string | null => {
  return getNewsField(item, 'thumbnail') || getNewsField(item, 'imageUrl') || getNewsField(item, 'urlToImage') || null;
};

// 安全获取新闻URL
const getNewsUrl = (item: NewsData): string => {
  return getNewsField(item, 'url') || getNewsField(item, 'sourceUrl') || '';
};

// 安全获取新闻标题
const getNewsTitle = (item: NewsData): string => {
  return getNewsField(item, 'title') || '';
};

// 安全获取新闻来源
const getNewsSource = (item: NewsData): string => {
  const publisher = getNewsField(item, 'publisher');
  if (publisher && typeof publisher === 'object' && 'name' in publisher) {
    return publisher.name || '';
  }
  return getNewsField(item, 'source') || '';
};

// 安全获取新闻日期
const getNewsDate = (item: NewsData): string => {
  return getNewsField(item, 'date') || getNewsField(item, 'publishedAt') || '';
};

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.75; // 卡片宽度为屏幕宽度的75%
const CARD_SPACING = 12;

export const HeaderScrollingNews: React.FC<HeaderScrollingNewsProps> = ({
  news,
  onNewsPress,
  formatDate,
}) => {

  // 选择近 8 天内的新闻，按时间顺序（从早到晚）取最多 8 条
  const newsWithImages = useMemo(() => {
    if (!news || !Array.isArray(news)) {
      return [];
    }

    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 当天 00:00
    const eightDaysAgo = new Date(startTime);
    eightDaysAgo.setDate(startTime.getDate() - 8); // 前 8 天（不含今天之前第 8 天的 00:00 之前）

    const parseDate = (value: string | null): number | null => {
      if (!value) return null;
      const d = new Date(value);
      const t = d.getTime();
      return Number.isNaN(t) ? null : t;
    };

    const filtered = news.filter(item => {
      if (!item || typeof item !== 'object') return false;
      const image = getNewsImage(item);
      const title = getNewsTitle(item);
      const url = getNewsUrl(item);
      const dateStr = getNewsDate(item);
      const ts = parseDate(dateStr);
      if (!image || !title || !url || ts == null) return false;
      return ts >= eightDaysAgo.getTime() && ts <= now.getTime();
    });

    // 按时间顺序排序（从新到旧）
    filtered.sort((a, b) => {
      const ta = parseDate(getNewsDate(a)) ?? 0;
      const tb = parseDate(getNewsDate(b)) ?? 0;
      return tb - ta;
    });

    return filtered.slice(0, 8);
  }, [news]);

  // 如果没有有图片的新闻，不显示组件
  if (newsWithImages.length === 0) {
    return null;
  }

  const renderNewsCard = (item: NewsData, index: number) => {
    const newsUrl = getNewsUrl(item);
    const newsTitle = getNewsTitle(item);
    const newsImage = getNewsImage(item);
    const newsSource = getNewsSource(item);
    const newsDate = getNewsDate(item);
    
    // 默认占位图片 - 使用本地资源
    const defaultImage = require('../../assets/images/icon.png');

    const handlePress = () => {
      if (newsUrl && onNewsPress) {
        onNewsPress(newsUrl, newsTitle);
      }
    };

    return (
      <TouchableOpacity
        key={`header-news-${index}`}
        style={styles.newsCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* 新闻图片 */}
        <View style={styles.imageContainer}>
          <Image 
            source={newsImage ? { uri: newsImage } : defaultImage}
            defaultSource={defaultImage}
            style={styles.newsImage}
            resizeMode="cover"
            onError={() => {
              // 图片加载失败时的处理逻辑已通过defaultSource处理
            }}
          />
          {/* 底部渐变背景，确保文字可读性 */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />
        </View>
        
        {/* 新闻内容 */}
        <View style={styles.contentContainer}>
          {/* 新闻标题 */}
          <Text style={styles.newsTitle} numberOfLines={2}>
            {newsTitle}
          </Text>
          
          {/* 新闻来源和时间 */}
          <View style={styles.newsFooter}>
            <Text style={styles.newsSource} numberOfLines={1}>
              {newsSource}
            </Text>
            {newsDate && (
              <Text style={styles.newsDate}>
                {formatDate(newsDate)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* 滚动新闻列表 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        contentInset={{ left: CARD_SPACING / 2, right: CARD_SPACING / 2 }}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {newsWithImages.map((item, index) => renderNewsCard(item, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginLeft: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  newsCard: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginRight: CARD_SPACING,
    overflow: 'hidden',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100, // 覆盖底部100px区域，为文字提供渐变背景
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'transparent',
  },
  newsTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.background.primary,
    lineHeight: 18,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // 适中的文字阴影，配合渐变背景
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    marginRight: 8,
  },
  newsDate: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
