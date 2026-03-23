import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ImageStyle, Image } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';

interface ListItemProps {
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  
  // 股票展示相关属性
  avatar?: {
    text?: string;
    imageUrl?: string;
    fallbackText?: string;
    backgroundColor: string;
    textColor?: string;
  };
  title?: string;
  subtitle?: string;
  chart?: React.ReactNode;
  rightContent?: React.ReactNode;
  price?: string;
  priceChange?: string;
  isPositive?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  onPress,
  style,
  backgroundColor = MarketNewsBrand.colors.background.surface,
  padding = MarketNewsBrand.spacing.lg,
  borderRadius = MarketNewsBrand.borderRadius.md,
  avatar,
  title,
  subtitle,
  chart,
  rightContent,
  price,
  priceChange,
  isPositive = true,
}) => {
  const Component = onPress ? TouchableOpacity : View;
  
  // 如果有children，使用原来的简单布局
  if (children) {
    return (
      <Component
        style={[
          styles.listItem,
          {
            backgroundColor,
            padding,
            borderRadius,
          },
          style,
        ]}
        onPress={onPress}
      >
        {children}
      </Component>
    );
  }
  
  // 股票项布局
  return (
    <Component
      style={[
        styles.listItem,
        {
          backgroundColor,
          padding,
          borderRadius,
        },
        style,
      ]}
      onPress={onPress}
    >
      {/* 头像 */}
      {avatar && (
        <View style={[styles.avatar, { backgroundColor: avatar.backgroundColor }]}>
          {avatar.imageUrl ? (
            <Image
              source={{ uri: avatar.imageUrl }}
              style={styles.avatarImage}
              onError={() => {
                // 图片加载失败时可以在这里处理，但由于是函数组件，需要用state
                Logger.warn(LogModule.STOCK, 'Avatar image failed to load:', avatar.imageUrl);
              }}
            />
          ) : (
            <Text style={[styles.avatarText, { color: avatar.textColor || MarketNewsBrand.colors.text.inverse }]}>
              {avatar.text || avatar.fallbackText || '?'}
            </Text>
          )}
        </View>
      )}
      
      {/* 标题和副标题 */}
      {(title || subtitle) && (
        <View style={styles.titleContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      
      {/* 图表 */}
      {chart && (
        <View style={styles.chartContainer}>
          {chart}
        </View>
      )}
      
      {/* 右侧内容或价格信息 */}
      {rightContent ? (
        <View style={styles.rightContent}>
          {rightContent}
        </View>
      ) : (price || priceChange) ? (
        <View style={styles.priceContainer}>
          {price && <Text style={styles.price}>{price}</Text>}
          {priceChange && (
            <Text style={[styles.priceChange, { color: isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish }]}>
              {priceChange}
            </Text>
          )}
        </View>
      ) : null}
    </Component>
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: MarketNewsBrand.tokens.card.borderLeftWidth,
    borderLeftColor: MarketNewsBrand.tokens.card.borderLeftColor,
  } as ViewStyle,
  
  avatar: {
    width: 44,
    height: 44,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: MarketNewsBrand.spacing.md,
  } as ViewStyle,
  
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: MarketNewsBrand.borderRadius.lg,
  } as ImageStyle,
  
  avatarText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.inverse,
  } as TextStyle,
  
  titleContainer: {
    flex: 1,
  } as ViewStyle,
  
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 3,
  } as TextStyle,
  
  subtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  } as TextStyle,
  
  chartContainer: {
    marginRight: MarketNewsBrand.spacing.md,
  } as ViewStyle,
  
  rightContent: {
    alignItems: 'flex-end',
  } as ViewStyle,
  
  priceContainer: {
    alignItems: 'flex-end',
  } as ViewStyle,
  
  price: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 3,
  } as TextStyle,
  
  priceChange: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  } as TextStyle,
}); 