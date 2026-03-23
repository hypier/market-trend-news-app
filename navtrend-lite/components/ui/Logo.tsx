import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { MarketNewsBrand } from '@/config/brand';

interface LogoProps extends Omit<SvgProps, 'height' | 'width'> {
  size?: 'small' | 'medium' | 'large' | number;
  variant?: 'full' | 'icon' | 'text';
  color?: string;
  textColor?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  variant = 'full',
  color = MarketNewsBrand.colors.primary[400],
  textColor = MarketNewsBrand.colors.text.primary,
  showText = true,
  ...props
}) => {
  // 根据尺寸计算具体像素值
  const getSize = () => {
    if (typeof size === 'number') return size;
    
    switch (size) {
      case 'small': return 24;
      case 'medium': return 32;
      case 'large': return 48;
      default: return 32;
    }
  };

  const logoSize = getSize();
  const textSize = logoSize * 0.8;

  // 简化的SVG图标版本
  const renderIcon = () => (
    <Image
      source={require('@/assets/images/icon-logo.png')}
      style={{ width: logoSize, height: logoSize }}
    />

  );

  // 简化的文本版本
  const renderText = () => (
    <Text style={[styles.logoText, { fontSize: textSize, color: textColor }]}>
      MarketNews
    </Text>
  );

  // 根据变体返回不同的组合
  switch (variant) {
    case 'icon':
      return renderIcon();
    case 'text':
      return renderText();
    case 'full':
    default:
      return (
        <View style={styles.container}>
          {renderIcon()}
          {showText && (
            <Text style={[styles.logoText, { fontSize: textSize, color: textColor, marginLeft: 8 }]}>
              MarketNews
            </Text>
          )}
        </View>
      );
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  }
});

export default Logo; 