/**
 * 时间轴日期分组头部组件
 * 
 * 用于在时间轴中显示日期分隔符
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';

interface TimelineDateHeaderProps {
  date: string; // 显示的日期文本，如 "今天"、"昨天"、"2024年11月20日"
}

export const TimelineDateHeader: React.FC<TimelineDateHeaderProps> = ({ date }) => {
  return (
    <View style={styles.container}>
      {/* 左侧装饰线 */}
      <View style={styles.leftLine} />
      
      {/* 日期标签 */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{date}</Text>
      </View>
      
      {/* 右侧装饰线 */}
      <View style={styles.rightLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingLeft: 42, // 对齐时间轴（30px timeline + 12px padding）
  },
  leftLine: {
    flex: 1,
    height: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    marginRight: 8,
  },
  dateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.secondary,
  },
  dateText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightLine: {
    flex: 1,
    height: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    marginLeft: 8,
  },
});
