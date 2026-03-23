/**
 * 投资组合图表组件
 * 
 * 显示投资组合的历史表现图表，包括：
 * - 多时间段数据展示（1W, 1M, 3M, 6M, 1Y, 2Y, 5Y, ALL）
 * - 实时数据更新和缓存
 * - 完整的加载状态和错误处理
 * - 时间段切换和数据刷新
 * 
 * 主要特性：
 * - 直接使用Store获取投资组合数据
 * - 支持多种图表样式和交互
 * - 响应式设计和动画效果
 * 
 * @author MarketNews Team
 * @version 2.0.0
 */

import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
// import { EnhancedSimpleChart } from '../stock/EnhancedSimpleChart'; // 已删除，待替换为其他图表组件
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';

interface PortfolioChartProps {
  /** 外部传入的图表数据（可选，会覆盖历史数据） */
  chartData?: number[];
  /** 是否加载中 */
  isLoading?: boolean;
  /** 图表标题中显示的名称 */
  symbol?: string;
  /** 投资组合ID（可选，不传则从store获取） */
  portfolioId?: string;
  /** 初始时间段 */
  initialPeriod?: string;
  /** 图表高度 */
  height?: number;
  /** 是否显示统计信息 */
  showStats?: boolean;
  /** 点击时间段按钮的回调 */
  onPeriodChange?: (period: string) => void;
}

/**
 * 投资组合图表组件
 */
export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  chartData,
  isLoading = false,
  symbol = 'Portfolio',
  portfolioId: propPortfolioId,
  initialPeriod = '1M',
  height = 180,
  showStats = true,
  onPeriodChange,
}) => {
  const { t } = useTranslation();

  // 统一的加载状态
  const isChartLoading = isLoading;

  // 渲染开发中状态
  const renderDevelopmentState = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{t('components.portfolio.chart.title')}</Text>
      </View>
      <View style={styles.developmentChart}>
        <Text style={styles.developmentTitle}>{t('components.portfolio.chart.developmentTitle')}</Text>
        <Text style={styles.developmentMessage}>
          {t('components.portfolio.chart.developmentMessage')}
        </Text>
      </View>
    </View>
  );

  // 渲染加载状态
  const renderLoadingState = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{t('components.portfolio.chart.title')}</Text>
      </View>
      <View style={styles.loadingChart}>
        <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
        <Text style={styles.loadingText}>{t('components.portfolio.chart.loadingChart')}</Text>
      </View>
    </View>
  );



  // 如果正在加载初始数据
  if (isChartLoading) {
    return renderLoadingState();
  }

  // 如果没有外部传入的图表数据，显示开发中状态
  if (!chartData || chartData.length === 0) {
    return renderDevelopmentState();
  }

  // 图表功能开发中，EnhancedSimpleChart 已删除
  return renderDevelopmentState();
};

const styles = StyleSheet.create({
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 0,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.secondary,
  },
  chartTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    flex: 1,
  },
  errorIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: MarketNewsBrand.colors.market.dangerBg,
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  errorIndicatorText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.semantic.error,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 2,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  statValue: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
  positive: {
    color: MarketNewsBrand.colors.semantic.success,
  },
  negative: {
    color: MarketNewsBrand.colors.semantic.error,
  },
  loadingChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    marginTop: 12,
  },
  developmentChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    paddingHorizontal: 20,
  },
  developmentTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginBottom: 8,
    textAlign: 'center',
  },
  developmentMessage: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.market.dangerBg,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.semantic.error,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: MarketNewsBrand.colors.semantic.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: MarketNewsBrand.borderRadius.lg,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  emptyChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  dataIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.background.tertiary,
    alignItems: 'center',
  },
  dataIndicatorText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
}); 