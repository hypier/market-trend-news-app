/**
 * 可拖拽的排行榜项组件
 * 用于自定义配置页面，支持拖拽排序、重命名、删除
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import Sortable from 'react-native-sortables';
import { useTranslation } from '@/hooks/useTranslation';
import type { LocalLeaderboardItem, DefaultLeaderboard } from '@/types/leaderboard';

interface DraggableLeaderboardItemProps {
  /** 排行榜项数据 */
  item: LocalLeaderboardItem;
  
  /** 配置元数据（用于显示默认名称） */
  config: DefaultLeaderboard;
  
  /** 重命名回调 */
  onRename: (code: string) => void;
  
  /** 删除回调 */
  onDelete: (code: string) => void;
}

// 🔧 性能优化：使用 React.memo 避免不必要的重渲染
export const DraggableLeaderboardItem = React.memo(function DraggableLeaderboardItem({
  item,
  config,
  onRename,
  onDelete,
}: DraggableLeaderboardItemProps) {
  const { t, currentLanguage } = useTranslation();
  
  // 安全检查：如果 config 不存在，返回 null
  if (!config) {
    console.warn(`[DraggableLeaderboardItem] Config not found for code: ${item?.code}`);
    return null;
  }
  
  // 显示名称：优先自定义名称，否则默认名称
  const displayName = item.custom_name || 
    config.name_translations?.[currentLanguage] || 
    config.name_translations?.zh || 
    config.name_translations?.en ||
    item.code;
  
  return (
    <View style={styles.container}>
      {/* 左侧拖拽手柄 - 使用 Sortable.Handle */}
      <Sortable.Handle>
        <View style={styles.dragHandle}>
          <Ionicons name="menu" size={18} color="#6B7280" />
        </View>
      </Sortable.Handle>
      
      {/* 中间内容区 */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {item.custom_name && (
          <Text style={styles.originalName} numberOfLines={1}>
            {t('leaderboard.customizer.originalName')}: {config.name_translations?.zh || config.name_translations?.en}
          </Text>
        )}
      </View>
      
      {/* 右侧操作按钮 */}
      <View style={styles.actions}>
        {/* 重命名按钮 */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onRename(item.code)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        {/* 删除按钮 */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(item.code)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.secondary,
  },
  containerActive: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderColor: MarketNewsBrand.colors.primary[400],
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dragHandle: {
    paddingRight: 8,
    paddingLeft: 4,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.secondary,
  },
  originalName: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    // 删除按钮无特殊样式
  },
});

