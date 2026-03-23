/**
 * 统计数据卡片组件
 * 
 * 用于显示股票关键数据的卡片式组件
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';

interface StatsCardProps {
  /** 卡片标题 */
  title: string;
  /** 显示值 */
  value: string;
  /** 图标名称 */
  icon: keyof typeof Ionicons.glyphMap;
  /** 图标颜色 */
  iconColor?: string;
  /** 是否显示变化趋势 */
  change?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  iconColor = MarketNewsBrand.colors.primary[400],
  change 
}: StatsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <Text style={styles.value}>{value}</Text>
      
      {change && (
        <View style={styles.changeContainer}>
          <Ionicons 
            name={change.isPositive ? "trending-up" : "trending-down"} 
            size={14} 
            color={change.isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish} 
          />
          <Text style={[
            styles.changeText,
            { color: change.isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish }
          ]}>
            {change.value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '47%', // 2列布局，每个占47%宽度
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  value: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginLeft: 4,
  },
});
