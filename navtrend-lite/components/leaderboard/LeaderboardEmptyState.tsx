/**
 * 排行榜空状态组件
 * 在没有数据或发生错误时显示
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';

interface LeaderboardEmptyStateProps {
  /** 错误信息 */
  error?: string | null;
  
  /** 排行榜标题 */
  title?: string;
  
  /** 重试回调 */
  onRetry?: () => void;
}

export function LeaderboardEmptyState({
  error,
  title,
  onRetry
}: LeaderboardEmptyStateProps) {
  const { t } = useTranslation();

  // 根据错误状态显示不同的内容
  const getContent = () => {
    if (error) {
      return {
        icon: '⚠️',
        title: t('leaderboard.error.title'),
        description: error.includes('not found') 
          ? t('leaderboard.error.notFound')
          : t('leaderboard.error.loadFailed'),
        showRetry: true
      };
    }
    
    return {
      icon: '📊',
      title: t('leaderboard.empty.title'),
      description: title 
        ? t('leaderboard.empty.noDataForCategory', { category: title })
        : t('leaderboard.empty.noData'),
      showRetry: false
    };
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{content.icon}</Text>
      </View>
      
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.description}>{content.description}</Text>
      
      {content.showRetry && onRetry && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>
            {t('leaderboard.retry')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: MarketNewsBrand.typography.fontSize['4xl'],
    textAlign: 'center',
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderRadius: MarketNewsBrand.borderRadius.full,
  },
  retryButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.inverse,
  },
});
