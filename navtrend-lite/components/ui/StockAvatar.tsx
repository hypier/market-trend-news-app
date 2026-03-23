/**
 * 统一的股票Avatar组件（简化版）
 * 
 * 功能：
 * - 显示股票代码首字母作为占位符
 * - 支持不同尺寸需求
 * 
 * @author MarketNews Team
 * @version 4.0.0
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';

interface StockAvatarProps {
  /** 股票代码 */
  symbol?: string;
  /** 交易所代码（可选） */
  exchange?: string;
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large' | number;
  /** 自定义样式 */
  style?: ViewStyle;
  /** Logo加载完成回调（保留接口兼容性） */
  onLogoLoad?: (logoUrl: string | null) => void;
  /** Logo ID（保留接口兼容性，不再使用） */
  logoid?: string;
}

// 尺寸配置
const SIZE_CONFIG = {
  small: 32,
  medium: 40,
  large: 56,
};

/**
 * StockAvatar 组件（简化版）
 * 显示股票代码首字母作为占位符
 */
export const StockAvatar: React.FC<StockAvatarProps> = ({
  symbol = '',
  size = 'medium',
  style,
}) => {
  // 计算实际尺寸
  const actualSize = typeof size === 'number' ? size : SIZE_CONFIG[size];
  
  // 获取首字母
  const initial = useMemo(() => {
    if (!symbol) return '?';
    return symbol.charAt(0).toUpperCase();
  }, [symbol]);
  
  // 根据首字母生成背景色
  const backgroundColor = useMemo(() => {
    const charCode = symbol ? symbol.charCodeAt(0) : 0;
    const hue = (charCode * 137) % 360; // 使用黄金角分布
    return `hsl(${hue}, 60%, 75%)`;
  }, [symbol]);
  
  return (
    <View
      style={[
        styles.container,
        {
          width: actualSize,
          height: actualSize,
          borderRadius: actualSize / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initial,
          {
            fontSize: actualSize * 0.5,
            lineHeight: actualSize * 0.6,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: MarketNewsBrand.colors.text.inverse,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

// 导出静态方法（保留接口兼容性）
export const StockAvatarUtils = {
  // 预加载方法（空实现，保留兼容性）
  preload: async (_stocks: { symbol: string; exchange: string; size?: number }[]) => {
    // 不再执行任何操作
  },
  
  // 清除缓存方法（空实现，保留兼容性）
  clearCache: async () => {
    // 不再执行任何操作
  },
};
