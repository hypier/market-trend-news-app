/**
 * 排行榜选择器组件
 * 用于在 trading.tsx 页面顶部展示排行榜分类选择
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MarketNewsBrand } from '@/config/brand';
import { AddLeaderboardButton } from './AddLeaderboardButton';
import type { LeaderboardDisplayCategory } from '../../types/leaderboard';

interface LeaderboardSelectorProps {
  /** 分类列表 */
  categories: LeaderboardDisplayCategory[];
  
  /** 当前选中的分类ID */
  selectedCategoryId: string;
  
  /** 当前选中的排行榜代码 */
  selectedLeaderboardCode: string;
  
  /** 分类选择回调 */
  onCategorySelect: (categoryId: string) => void;
  
  /** 排行榜选择回调 */
  onLeaderboardSelect: (code: string) => void;
  
  /** 添加自定义排行榜回调 */
  onAddCustomLeaderboard?: () => void;
  
  /** 加载状态 */
  loading?: boolean;
}

export function LeaderboardSelector({
  categories,
  selectedCategoryId,
  selectedLeaderboardCode,
  onCategorySelect,
  onLeaderboardSelect,
  onAddCustomLeaderboard,
  loading = false
}: LeaderboardSelectorProps) {

  // 滚动状态
  const [showCategoryGradient, setShowCategoryGradient] = useState(true);
  const [showLeaderboardGradient, setShowLeaderboardGradient] = useState(true);

  // 获取当前选中的分类
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  // 处理分类滚动
  const handleCategoryScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 10;
    setShowCategoryGradient(!isEnd);
  }, []);

  // 处理排行榜滚动
  const handleLeaderboardScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 10;
    setShowLeaderboardGradient(!isEnd);
  }, []);

  // 处理分类选择
  const handleCategorySelect = useCallback((categoryId: string) => {
    if (categoryId !== selectedCategoryId) {
      onCategorySelect(categoryId);
      
      // 自动选择该分类下的第一个排行榜
      const category = categories.find(cat => cat.id === categoryId);
      if (category && category.leaderboards.length > 0) {
        const firstLeaderboard = category.leaderboards[0];
        onLeaderboardSelect(firstLeaderboard.code);
      }
    }
  }, [selectedCategoryId, onCategorySelect, onLeaderboardSelect, categories]);

  // 处理排行榜选择
  const handleLeaderboardSelect = useCallback((code: string) => {
    if (code !== selectedLeaderboardCode) {
      onLeaderboardSelect(code);
    }
  }, [selectedLeaderboardCode, onLeaderboardSelect]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingItem} />
          <View style={styles.loadingItem} />
          <View style={styles.loadingItem} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 分类选择器 */}
      <View style={styles.categoryRow}>
        <View style={styles.scrollWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
            onScroll={handleCategoryScroll}
            scrollEventThrottle={16}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategoryId === category.id && styles.categoryButtonSelected
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategoryId === category.id && styles.categoryTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* 右侧渐变遮罩 */}
          {showCategoryGradient && (
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                MarketNewsBrand.colors.background.primary
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
              pointerEvents="none"
            />
          )}
        </View>
        
        {/* 添加自定义排行榜按钮 */}
        {onAddCustomLeaderboard && (
          <AddLeaderboardButton onPress={onAddCustomLeaderboard} />
        )}
      </View>

      {/* 排行榜选择器 */}
      {selectedCategory && selectedCategory.leaderboards.length > 0 && (
        <View style={styles.leaderboardWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.leaderboardScroll}
            contentContainerStyle={styles.leaderboardContainer}
            onScroll={handleLeaderboardScroll}
            scrollEventThrottle={16}
          >
            {selectedCategory.leaderboards.map((leaderboard: any) => (
              <TouchableOpacity
                key={leaderboard.code}
                style={[
                  styles.leaderboardButton,
                  selectedLeaderboardCode === leaderboard.code && styles.leaderboardButtonSelected
                ]}
                onPress={() => handleLeaderboardSelect(leaderboard.code)}
              >
                <Text style={[
                  styles.leaderboardText,
                  selectedLeaderboardCode === leaderboard.code && styles.leaderboardTextSelected
                ]}>
                  {leaderboard.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* 右侧渐变遮罩 */}
          {showLeaderboardGradient && (
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                MarketNewsBrand.colors.background.primary
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.leaderboardGradient}
              pointerEvents="none"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingTop: 6,
    paddingBottom: 8,
    marginBottom: 8
  },
  
  // 分类样式
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 12,
  },
  scrollWrapper: {
    flex: 1,
    position: 'relative',
    minHeight: 40,
  },
  categoryScroll: {
    flex: 1,
  },
  categoryContainer: {
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryButtonSelected: {
    borderBottomColor: MarketNewsBrand.colors.primary[400],
  },
  categoryText: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
  },
  categoryTextSelected: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
  
  // 排行榜样式
  leaderboardWrapper: {
    position: 'relative',
  },
  leaderboardScroll: {
    marginBottom: 2,
  },
  leaderboardContainer: {
    paddingHorizontal: 12,
    gap: 6,
  },
  leaderboardButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: 'transparent',
  },
  leaderboardButtonSelected: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  leaderboardText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    color: MarketNewsBrand.colors.text.tertiary,
  },
  leaderboardTextSelected: {
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },

  // 自定义标识
  customBadge: {
    backgroundColor: MarketNewsBrand.colors.market.success,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  customBadgeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.inverse,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  
  // 加载状态
  loadingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
  },
  loadingItem: {
    height: 28,
    width: 70,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderRadius: 14,
  },
  
  // 渐变遮罩（分类）
  gradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 1,
  },
  
  // 渐变遮罩（排行榜）
  leaderboardGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 1,
  },
});
