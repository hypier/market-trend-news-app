import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  TouchableOpacityProps 
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const handlePress = (event: any) => {
    if (!disabled && !loading && onPress) {
      onPress(event);
    }
  };

  const getButtonStyles = (): ViewStyle => {
    const baseStyles = styles.base;
    const variantStyles = styles[variant];
    const sizeStyles = styles[`${size}Size`];
    
    return {
      ...baseStyles,
      ...variantStyles,
      ...sizeStyles,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyles = styles.baseText;
    const variantTextStyles = styles[`${variant}Text`];
    const sizeTextStyles = styles[`${size}Text`];
    
    return {
      ...baseTextStyles,
      ...variantTextStyles,
      ...sizeTextStyles,
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? MarketNewsBrand.colors.text.inverse : MarketNewsBrand.colors.primary[400]}
          size="small" 
        />
      ) : (
        <Text style={[getTextStyles(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 基础样式
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MarketNewsBrand.borderRadius.lg,
    minHeight: 48,
  } as ViewStyle,

  // 变体样式
  primary: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderWidth: 0,
    ...MarketNewsBrand.shadow.lg,
  } as ViewStyle,

  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: MarketNewsBrand.colors.primary[400],
  } as ViewStyle,

  text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  } as ViewStyle,

  // 尺寸样式
  smallSize: {
    paddingHorizontal: MarketNewsBrand.spacing.md,
    paddingVertical: MarketNewsBrand.spacing.sm,
    minHeight: 36,
  } as ViewStyle,

  mediumSize: {
    paddingHorizontal: MarketNewsBrand.spacing.xl,
    paddingVertical: MarketNewsBrand.spacing.md,
    minHeight: 48,
  } as ViewStyle,

  largeSize: {
    paddingHorizontal: MarketNewsBrand.spacing.xxl,
    paddingVertical: MarketNewsBrand.spacing.lg,
    minHeight: 56,
  } as ViewStyle,

  // 文字基础样式
  baseText: {
    textAlign: 'center',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  } as TextStyle,

  // 变体文字样式
  primaryText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  } as TextStyle,

  secondaryText: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  } as TextStyle,

  textText: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  } as TextStyle,

  // 尺寸文字样式
  smallText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
  } as TextStyle,

  mediumText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
  } as TextStyle,

  largeText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
  } as TextStyle,
});
