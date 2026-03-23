/**
 * 错误状态视图组件
 * 
 * 显示加载失败时的错误状态，包括错误图标、标题、描述和重试按钮。
 * 采用居中布局，提供友好的用户体验。
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';

interface ErrorStateViewProps {
  /** 错误标题 */
  title?: string;
  /** 错误描述信息 */
  message?: string;
  /** 重试按钮文本 */
  retryText?: string;
  /** 重试按钮点击回调 */
  onRetry?: () => void;
  /** 错误图标名称 */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** 错误图标颜色 */
  iconColor?: string;
  /** 是否显示重试按钮 */
  showRetryButton?: boolean;
  /** 自定义样式 */
  style?: any;
}

export function ErrorStateView({
  title = '加载失败',
  message = '请检查网络连接后重试',
  retryText = '重试',
  onRetry,
  iconName = 'alert-circle-outline',
  iconColor = MarketNewsBrand.colors.market.bearish,
  showRetryButton = true,
  style
}: ErrorStateViewProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons 
        name={iconName} 
        size={60} 
        color={iconColor} 
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {showRetryButton && onRetry && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
});
