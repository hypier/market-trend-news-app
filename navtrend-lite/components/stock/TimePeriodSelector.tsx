/**
 * 时间周期选择器组件
 * 
 * 用于图表的时间周期切换
 * 支持普通模式和全屏模式的不同样式
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';

export interface TimePeriod {
  label: string;
  value: string;
}

export const TIME_PERIODS: TimePeriod[] = [
  { label: '1H', value: '1h' },
  { label: '3H', value: '3h' },
  { label: '1D', value: '1day' },
  { label: '1W', value: '1week' },
  { label: '1M', value: '1month' },
  { label: '3M', value: '3month' },
  { label: '6M', value: '6month' },
  { label: '1Y', value: '1year' },
  { label: '3Y', value: '3year' },
];

interface TimePeriodSelectorProps {
  /** 当前选中的周期 */
  selectedPeriod: string;
  /** 周期切换回调 */
  onPeriodChange: (period: string) => void;
  /** 是否为全屏模式 */
  fullscreen?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 垂直布局模式（用于全屏侧边栏） */
  vertical?: boolean;
}

export function TimePeriodSelector({
  selectedPeriod,
  onPeriodChange,
  fullscreen = false,
  disabled = false,
  vertical = false,
}: TimePeriodSelectorProps) {
  const handlePress = (value: string) => {
    if (!disabled && value !== selectedPeriod) {
      onPeriodChange(value);
    }
  };

  // 垂直布局使用 ScrollView，普通模式也使用 ScrollView 支持横向滚动
  const Container = ScrollView;
  const containerProps = vertical
    ? {
        showsVerticalScrollIndicator: true,
        contentContainerStyle: [
          styles.verticalScrollContent,
          fullscreen && styles.fullscreenContentContainer,
        ],
        style: styles.verticalContainer,
      }
    : {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: [
          styles.scrollContent,
          fullscreen && styles.fullscreenContentContainer,
        ],
        style: [
          styles.container,
          fullscreen && styles.fullscreenContainer,
        ],
      };

  return (
    <Container
      {...containerProps}
    >
      {TIME_PERIODS.map((period) => {
        const isSelected = selectedPeriod === period.value;

        return (
          <TouchableOpacity
            key={period.value}
            style={[
              vertical
                ? styles.verticalButton
                : fullscreen
                ? styles.fullscreenButton
                : styles.button,
              isSelected &&
                (vertical
                  ? styles.verticalActiveButton
                  : fullscreen
                  ? styles.fullscreenActiveButton
                  : styles.activeButton),
              disabled && styles.disabled,
            ]}
            onPress={() => handlePress(period.value)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                vertical
                  ? styles.verticalButtonText
                  : fullscreen
                  ? styles.fullscreenButtonText
                  : styles.buttonText,
                isSelected &&
                  (vertical
                    ? styles.verticalActiveText
                    : fullscreen
                    ? styles.fullscreenActiveText
                    : styles.activeText),
                disabled && styles.disabledText,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Container>
  );
}

const styles = StyleSheet.create({
  // 普通模式样式
  container: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginHorizontal: 3,
    minWidth: 40,
  },
  activeButton: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  buttonText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  activeText: {
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
  
  // 全屏模式样式
  fullscreenContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  // 全屏模式的内容容器样式（用于 ScrollView 的 contentContainerStyle）
  fullscreenContentContainer: {
    justifyContent: 'space-around',
    flexGrow: 1,
  },
  fullscreenButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: MarketNewsBrand.borderRadius.full,
    alignItems: 'center',
  },
  fullscreenActiveButton: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  fullscreenButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  fullscreenActiveText: {
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
  
  // 禁用状态
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  
  // 垂直布局样式（全屏侧边栏）
  verticalContainer: {
    flex: 1,
    paddingHorizontal: 8,
    // 注意：不要在这里使用 justifyContent，ScrollView 的布局属性应该在 contentContainerStyle 中
  },
  verticalScrollContent: {
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'center', // ScrollView 的内容布局，正确位置
  },
  verticalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: MarketNewsBrand.borderRadius.full,
    alignItems: 'center',
    marginVertical: 4,
    minWidth: 60,
  },
  verticalActiveButton: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  verticalButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  verticalActiveText: {
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
});

