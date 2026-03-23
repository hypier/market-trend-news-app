/**
 * 浮动操作按钮组件 - 乐观更新版本
 * 
 * 显示股票详情页面的浮动操作按钮，包括返回和收藏功能。
 * 按钮绝对定位在页面顶部，具有半透明背景和圆角设计。
 * 
 * ✅ 使用乐观更新：点击后立即反馈，无需 loading 状态
 * 
 * @author MarketNews Team
 * @version 2.0.0 (Optimistic Update)
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';

interface FloatingActionButtonsProps {
  /** 返回按钮点击回调 */
  onBack: () => void;
  /** 收藏按钮点击回调 */
  onFavorite: () => void;
  /** 是否已收藏 */
  isFavorite: boolean;
  /** 顶部安全区域偏移量 */
  topOffset?: number;
}

export const FloatingActionButtons = React.memo(function FloatingActionButtons({
  onBack,
  onFavorite,
  isFavorite,
  topOffset = 60
}: FloatingActionButtonsProps) {
  
  return (
    <View style={[styles.container, { paddingTop: topOffset }]}>
      <View style={styles.leftButtons}>
        <TouchableOpacity
          style={styles.button}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={MarketNewsBrand.colors.background.primary}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightButtons}>
        <TouchableOpacity
          style={styles.button}
          onPress={onFavorite}
          activeOpacity={0.7}
        >
          {/* ✅ 乐观更新：立即切换图标，无需 loading */}
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={MarketNewsBrand.colors.background.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在收藏状态变化时重渲染
  return prevProps.isFavorite === nextProps.isFavorite;
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 1000,
  },
  leftButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
