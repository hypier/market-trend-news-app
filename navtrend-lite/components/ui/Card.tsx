import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  backgroundColor = '#FFFFFF',
  padding = 16,
  borderRadius = MarketNewsBrand.borderRadius.xl,
  shadow = false,
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor,
    padding,
    borderRadius,
    ...(shadow && styles.shadow),
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

