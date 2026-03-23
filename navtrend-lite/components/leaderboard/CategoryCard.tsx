/**
 * 分类卡片组件
 * 支持展开/折叠、拖拽排序、重命名、删除
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import Animated, { type AnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { DraggableLeaderboardItem } from './DraggableLeaderboardItem';
import { useTranslation } from '@/hooks/useTranslation';
import type { LocalLeaderboardCategory, LocalLeaderboardItem, DefaultLeaderboardConfig, DefaultLeaderboard } from '@/types/leaderboard';

interface CategoryCardProps {
  /** 分类数据 */
  category: LocalLeaderboardCategory;
  
  /** 排行榜项列表（已按sort_order排序） */
  leaderboards: LocalLeaderboardItem[];
  
  /** 默认配置（用于显示元数据） */
  defaultConfig: DefaultLeaderboardConfig;
  
  /** 系统配置（所有可用配置，用于查找defaultConfig中没有的项） */
  systemConfigs?: DefaultLeaderboard[];
  
  /** 是否展开 */
  isExpanded: boolean;
  
  /** 展开/折叠回调 */
  onExpand: () => void;
  
  /** 重命名分类回调 */
  onRenameCategory: (categoryId: string) => void;
  
  /** 删除分类回调 */
  onDeleteCategory: (categoryId: string) => void;
  
  /** 添加排行榜到此分类回调 */
  onAddLeaderboard: (categoryId: string) => void;
  
  /** 重命名排行榜回调 */
  onRenameLeaderboard: (code: string) => void;
  
  /** 删除排行榜回调 */
  onDeleteLeaderboard: (code: string) => void;
  
  /** 排行榜排序回调 */
  onReorderLeaderboards: (orderedCodes: string[]) => void;
  
  /** 滚动容器引用（用于 auto-scroll） */
  scrollableRef: AnimatedRef<Animated.ScrollView>;
}

// 🔧 性能优化：使用 React.memo 避免不必要的重渲染
export const CategoryCard = React.memo(function CategoryCard({
  category,
  leaderboards,
  defaultConfig,
  systemConfigs = [],
  isExpanded,
  onExpand,
  onRenameCategory,
  onDeleteCategory,
  onAddLeaderboard,
  onRenameLeaderboard,
  onDeleteLeaderboard,
  onReorderLeaderboards,
  scrollableRef,
}: CategoryCardProps) {
  const { t, currentLanguage } = useTranslation(); // 正确解构 t 函数和 currentLanguage
  
  // 🔧 性能优化：使用 useMemo 缓存显示名称
  const displayName = useMemo(() => {
    if (category.custom_name) return category.custom_name;
    // 根据当前语言动态获取翻译
    return category.name_translations[currentLanguage] || 
           category.name_translations.zh || 
           category.name_translations.en;
  }, [category.custom_name, category.name_translations, currentLanguage]);
  
  // 🔧 性能优化：使用 useMemo 缓存带 key 的排行榜数据
  const leaderboardsWithKey = useMemo(() => 
    leaderboards.map(item => ({ ...item, key: item.code }))
  , [leaderboards]);
  
  // 🔧 性能优化：使用 useCallback 缓存排序处理函数
  const handleReorder = useCallback(({ data }: { data: (LocalLeaderboardItem & { key: string })[] }) => {
    const orderedCodes = data.map(item => item.code);
    onReorderLeaderboards(orderedCodes);
  }, [onReorderLeaderboards]);
  
  return (
    <View style={styles.container}>
      {/* 分类头部 */}
      <View style={styles.header}>
        {/* 左侧：拖拽手柄 + 展开按钮 */}
        <View style={styles.leftSection}>
          {/* 拖拽手柄 - 使用 Sortable.Handle */}
          <Sortable.Handle>
            <View style={styles.dragHandle}>
              <Ionicons name="reorder-three" size={22} color="#6B7280" />
            </View>
          </Sortable.Handle>
          
          <TouchableOpacity
            style={styles.expandButton}
            onPress={onExpand}
          >
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={onExpand}
          >
            <View style={styles.nameRow}>
              <Text style={styles.categoryName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.count}>
                ({leaderboards.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* 右侧：操作按钮 */}
        <View style={styles.actions}>
          {/* 添加排行榜按钮 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => onAddLeaderboard(category.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle-outline" size={17} color="#0EA5E9" />
          </TouchableOpacity>
          
          {/* 重命名按钮 */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onRenameCategory(category.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={17} color="#9CA3AF" />
          </TouchableOpacity>
          
          {/* 删除按钮 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDeleteCategory(category.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
    </View>
      
      {/* 排行榜列表（可拖拽） - 🎯 使用 Sortable.Grid */}
      {isExpanded && leaderboards.length > 0 && (
        <View style={styles.leaderboardsContainer}>
          <Sortable.Grid
            data={leaderboardsWithKey}
            columns={1}
            rowGap={6}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              // 安全检查：确保 item 和 item.code 存在
              if (!item || !item.code) {
                console.warn('[CategoryCard] Invalid leaderboard item:', item);
                return null;
              }
              
              // 1. 先用完整 code 查找（带 :market_code 的情况，如 stocks_market_movers.large_cap:america）
              let config = defaultConfig.leaderboards[item.code];

              // 2. 如果找不到，再用去掉 market_code 的 id 查找
              if (!config) {
                const leaderboardId = item.code.split(':')[0];
                config = defaultConfig.leaderboards[leaderboardId];
              }

              // 3. 如果 defaultConfig 中没有，尝试从 systemConfigs 查找
              if (!config && systemConfigs.length > 0) {
                const leaderboardId = item.code.split(':')[0];
                const systemConfig = systemConfigs.find(c => c.id === leaderboardId);
                if (systemConfig) {
                  // 转换为 DefaultLeaderboard 格式
                  config = {
                    id: systemConfig.id,
                    market_type: systemConfig.market_type,
                    market_code: systemConfig.market_code,
                    name_translations: systemConfig.name_translations,
                    description_translations: systemConfig.description_translations,
                  };
                }
              }
              
              if (!config) {
                console.warn(`[CategoryCard] Config not found for code: ${item.code} in both defaultConfig and systemConfigs`);
                return null;
              }
              
              return (
                <DraggableLeaderboardItem
                  item={item}
                  config={config}
                  onRename={onRenameLeaderboard}
                  onDelete={onDeleteLeaderboard}
                />
              );
            }}
            onDragEnd={handleReorder}
            scrollableRef={scrollableRef}
            customHandle
          />
        </View>
      )}
      
      {/* 空状态 */}
      {isExpanded && leaderboards.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>{t('leaderboard.customizer.emptyCategory')}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    paddingRight: 8,
    paddingLeft: 4,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  titleContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  categoryName: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  count: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.tertiary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    // 添加按钮使用蓝色图标
  },
  deleteButton: {
    // 删除按钮无特殊样式
  },
  leaderboardsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.background.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    marginTop: 6,
  },
});

