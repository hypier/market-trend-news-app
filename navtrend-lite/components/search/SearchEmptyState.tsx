import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand, getBrandSpacing, getBrandFontSize, getBrandBorderRadius } from '@/config/brand';

type EmptyStateType = 'loading' | 'error' | 'no-query' | 'no-results' | 'no-category-results';

interface SearchEmptyStateProps {
  type: EmptyStateType;
  fadeAnim: Animated.Value;
  error?: string | null;
  onRetry?: () => void;
  totalResults?: number;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  type,
  fadeAnim,
  error,
  onRetry,
  totalResults = 0,
}) => {
  const { t } = useTranslation();

  // 加载状态
  if (type === 'loading') {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
        <Text style={styles.loadingText}>{t('search.searching')}</Text>
      </Animated.View>
    );
  }

  // 错误状态
  if (type === 'error') {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Ionicons name="alert-circle" size={48} color={MarketNewsBrand.colors.semantic.error} />
        <Text style={styles.errorText}>{error || t('common.error')}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  // 无查询状态
  if (type === 'no-query') {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Ionicons name="search" size={48} color={MarketNewsBrand.colors.text.tertiary} />
        <Text style={styles.emptyText}>{t('search.searchStocks')}</Text>
        <Text style={styles.hintText}>{t('search.searchDesc')}</Text>
      </Animated.View>
    );
  }

  // 无结果状态
  if (type === 'no-results') {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Ionicons name="search" size={48} color={MarketNewsBrand.colors.text.tertiary} />
        <Text style={styles.emptyText}>{t('search.noResults')}</Text>
        <Text style={styles.hintText}>{t('search.searchHint')}</Text>
      </Animated.View>
    );
  }

  // 当前分类无结果状态
  if (type === 'no-category-results') {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Ionicons name="filter" size={48} color={MarketNewsBrand.colors.text.tertiary} />
        <Text style={styles.emptyText}>当前分类无结果</Text>
        <Text style={styles.hintText}>
          找到 {totalResults} 个结果，但不在当前分类中。请尝试切换到&ldquo;全部&rdquo;分类查看所有结果。
        </Text>
      </Animated.View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    padding: getBrandSpacing('xl'),
  },
  loadingText: {
    fontSize: getBrandFontSize('md'),
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: getBrandSpacing('md'),
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  emptyText: {
    fontSize: getBrandFontSize('lg'),
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: getBrandSpacing('lg'),
    marginBottom: getBrandSpacing('sm'),
    textAlign: 'center',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  hintText: {
    fontSize: getBrandFontSize('sm'),
    color: MarketNewsBrand.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
  },
  errorText: {
    fontSize: getBrandFontSize('md'),
    color: MarketNewsBrand.colors.semantic.error,
    marginTop: getBrandSpacing('lg'),
    marginBottom: getBrandSpacing('lg'),
    textAlign: 'center',
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  retryButton: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    paddingHorizontal: getBrandSpacing('xl'),
    paddingVertical: getBrandSpacing('md'),
    borderRadius: getBrandBorderRadius('lg'),
  },
  retryText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: getBrandFontSize('md'),
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
});

