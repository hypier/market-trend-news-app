import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores';
import { MarketNewsBrand } from '@/config/brand';
import { formatPriceWithCode, formatChangeWithCode, formatChangePercent } from '@/utils/currencyFormatter';

/**
 * 分离数值和货币代码的辅助组件
 * 让货币代码显示更小的字体
 */
const PriceWithSmallCurrency: React.FC<{ 
  value: string; 
  valueStyle: any; 
  currencyStyle?: any;
}> = ({ value, valueStyle, currencyStyle }) => {
  // 使用正则表达式分离数值和货币代码
  const match = value.match(/^([+-]?[\d,.]+)\s+([A-Z]{3,4})$/);
  
  if (match) {
    const [, number, currency] = match;
    return (
      <Text style={valueStyle}>
        {number}
        <Text style={[currencyStyle, { fontSize: (valueStyle?.fontSize || MarketNewsBrand.typography.fontSize.sm) * 0.7, opacity: 0.8 }]}>
          {' '}{currency}
        </Text>
      </Text>
    );
  }
  
  return <Text style={valueStyle}>{value}</Text>;
};

// 财富概览卡片组件的Props类型
interface WealthOverviewCardProps {
  portfolioStatsData?: {
    totalValue?: number;
    totalGain?: number;
    totalGainPercent?: number;
    isPositive?: boolean;
  } | null;
  integratedPortfolio?: {
    totalInvestment?: string | number;
    totalSharesCount?: string;
  } | null;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  hasPositions?: boolean;
  hasBasicData?: boolean;    // 是否有基础数据
}

/**
 * 财富概览卡片组件
 * 
 * 显示投资组合的总览信息，包括：
 * - 总资产价值
 * - 总盈亏和盈亏百分比
 * - 总投资成本
 * - 持仓总股数
 * 
 * 特性：
 * - 根据盈亏状态动态显示渐变色背景
 * - 支持加载状态和未登录状态
 * - 自动格式化货币显示
 */
export const WealthOverviewCard: React.FC<WealthOverviewCardProps> = ({ 
  portfolioStatsData, 
  integratedPortfolio, 
  isLoading, 
  isAuthenticated, 
  hasBasicData,
}) => {
  const { t } = useTranslation();
  const currency = useSettingsStore(state => state.currency) || 'USD';

  // 安全地处理数值
  const safeValue = typeof portfolioStatsData?.totalValue === 'number' && !isNaN(portfolioStatsData.totalValue) ? portfolioStatsData.totalValue : 0;
  const safeGain = typeof portfolioStatsData?.totalGain === 'number' && !isNaN(portfolioStatsData.totalGain) ? portfolioStatsData.totalGain : 0;
  const safeGainPercent = typeof portfolioStatsData?.totalGainPercent === 'number' && !isNaN(portfolioStatsData.totalGainPercent) ? portfolioStatsData.totalGainPercent : 0;
  
  const safeTotalInvestment = typeof integratedPortfolio?.totalInvestment === 'string' 
    ? parseFloat(integratedPortfolio.totalInvestment) 
    : (integratedPortfolio?.totalInvestment || 0);
  const safeTotalShares = integratedPortfolio?.totalSharesCount || "0";

  // 确保赢亏逻辑基于实际增减值
  const isPositive = safeGain > 0;
  const isGainZero = Math.abs(safeGain) < 0.005;

  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginIcon}>
          <Ionicons name="pie-chart-outline" size={48} color={MarketNewsBrand.colors.primary[400]} />
        </View>
        <Text style={styles.loginTitle}>{t('portfolio.title')}</Text>
        <Text style={styles.loginSubtitle}>{t('portfolio.loginDesc')}</Text>
      </View>
    );
  }

  // 渐进式加载显示逻辑
  if (isLoading && !hasBasicData) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingShimmer}>
          <View style={[styles.shimmerLine, { width: '60%' }]} />
          <View style={[styles.shimmerLine, { width: '40%', marginTop: 8 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wealthOverviewContainer}>
      {/* 主要财富展示卡片 */}
      <View style={styles.mainWealthCard}>
        {/* 渐变背景 - 类似股票详情页的效果 */}
        <LinearGradient
          colors={isGainZero 
            ? MarketNewsBrand.colors.gradients.primary as any // 使用品牌配置的主渐变
            : (isPositive 
              ? MarketNewsBrand.colors.gradients.success as any // 成功渐变（绿色）
              : MarketNewsBrand.colors.gradients.error as any) // 错误渐变（红色）
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />
        
        <View style={styles.wealthHeader}>
          <View style={styles.wealthIconContainer}>
            <Ionicons name="wallet-outline" size={16} color={MarketNewsBrand.colors.text.inverse} />
          </View>
          <View style={styles.wealthHeaderText}>
            <Text style={styles.wealthTitle}>{t('portfolio.title')}</Text>
            <Text style={styles.wealthSubtitle}>{t('portfolio.totalAssets')}</Text>
          </View>
        </View>

        <View style={styles.wealthValueContainer}>
          <PriceWithSmallCurrency
            value={formatPriceWithCode(safeValue, currency)}
            valueStyle={styles.wealthValue}
          />
          
          {/* 突出显示涨跌信息 - 精简版 */}
          <View style={styles.wealthChangeRow}>
            <View style={styles.changeAmountSection}>
              <Ionicons 
                name={isGainZero ? "remove" : isPositive ? "trending-up" : "trending-down"} 
                size={18} 
                color={MarketNewsBrand.colors.text.inverse}
                style={styles.changeIcon}
              />
              <View style={styles.changeTextContainer}>
                <Text style={styles.changeLabel}>{t('components.portfolio.gainLoss.totalGain')}</Text>
                <PriceWithSmallCurrency
                  value={formatChangeWithCode(safeGain, currency)}
                  valueStyle={styles.changeAmountLarge}
                />
              </View>
            </View>
            
            <View style={styles.changePercentBadge}>
              <Text style={styles.changePercentLarge}>
                {formatChangePercent(safeGainPercent)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 详细信息卡片 - 精简版 */}
      <View style={styles.detailsContainer}>
        {/* 持仓成本 */}
        <View style={[
          styles.detailCard,
          {
            borderLeftWidth: 3,
            borderLeftColor: isGainZero 
              ? (MarketNewsBrand.colors.gradients.primary as any)[0]
              : (isPositive 
                ? (MarketNewsBrand.colors.gradients.success as any)[0]
                : (MarketNewsBrand.colors.gradients.error as any)[0]),
            backgroundColor: MarketNewsBrand.colors.background.surface,
          }
        ]}>
          <View style={styles.detailHeader}>
            <View style={[
              styles.detailIconContainer, 
              { 
                backgroundColor: isGainZero 
                  ? 'rgba(99, 102, 241, 0.12)'
                  : (isPositive 
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)'),
              }
            ]}>
              <Ionicons 
                name="cash-outline" 
                size={18} 
                color={isGainZero 
                  ? (MarketNewsBrand.colors.gradients.primary as any)[0]
                  : (isPositive 
                    ? (MarketNewsBrand.colors.gradients.success as any)[0]
                    : (MarketNewsBrand.colors.gradients.error as any)[0])}
              />
            </View>
            <Text style={styles.detailLabel}>{t('components.portfolio.gainLoss.totalInvestment')}</Text>
          </View>
          <PriceWithSmallCurrency
            value={formatPriceWithCode(safeTotalInvestment, currency)}
            valueStyle={styles.detailValue}
          />
        </View>

        {/* 持仓数量 */}
        <View style={[
          styles.detailCard,
          {
            borderLeftWidth: 3,
            borderLeftColor: isGainZero 
              ? (MarketNewsBrand.colors.gradients.primary as any)[1]
              : (isPositive 
                ? (MarketNewsBrand.colors.gradients.success as any)[1]
                : (MarketNewsBrand.colors.gradients.error as any)[1]),
            backgroundColor: MarketNewsBrand.colors.background.surface,
          }
        ]}>
          <View style={styles.detailHeader}>
            <View style={[
              styles.detailIconContainer, 
              { 
                backgroundColor: isGainZero 
                  ? 'rgba(139, 92, 246, 0.12)'
                  : (isPositive 
                    ? 'rgba(52, 211, 153, 0.12)'
                    : 'rgba(248, 113, 113, 0.12)'),
              }
            ]}>
              <Ionicons 
                name="layers-outline" 
                size={18} 
                color={isGainZero 
                  ? (MarketNewsBrand.colors.gradients.primary as any)[1]
                  : (isPositive 
                    ? (MarketNewsBrand.colors.gradients.success as any)[1]
                    : (MarketNewsBrand.colors.gradients.error as any)[1])}
              />
            </View>
            <Text style={styles.detailLabel}>{t('components.portfolio.gainLoss.totalShares')}</Text>
          </View>
          <Text style={styles.detailValue}>
            {parseFloat(safeTotalShares).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// 组件样式
const styles = StyleSheet.create({
  // 财富概览容器
  wealthOverviewContainer: {
    marginBottom: MarketNewsBrand.spacing.lg,
  },
  
  // 主要财富卡片
  mainWealthCard: {
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: MarketNewsBrand.spacing.md,
    marginBottom: MarketNewsBrand.spacing.md,
    position: 'relative',
    overflow: 'hidden',
    ...MarketNewsBrand.shadow.md,
  },
  
  // 渐变覆盖层（现在是主要背景）
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: MarketNewsBrand.borderRadius.lg,
  },
  
  // 财富卡片头部
  wealthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MarketNewsBrand.spacing.sm,
    zIndex: 1,
  },
  
  wealthIconContainer: {
    width: 28,
    height: 28,
    borderRadius: MarketNewsBrand.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: MarketNewsBrand.spacing.xs,
  },
  
  wealthHeaderText: {
    flex: 1,
  },
  
  wealthTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold as any,
    color: MarketNewsBrand.colors.text.inverse,
    marginBottom: 1,
  },
  
  wealthSubtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal as any,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // 财富数值区域
  wealthValueContainer: {
    zIndex: 1,
  },
  
  wealthValue: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.inverse,
    marginBottom: MarketNewsBrand.spacing.sm,
    letterSpacing: -0.5,
  },
  
  // 涨跌信息行 - 精简版
  wealthChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  
  changeAmountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  changeIcon: {
    marginRight: MarketNewsBrand.spacing.xs,
  },
  
  changeTextContainer: {
    flex: 1,
  },
  
  changeLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  
  changeAmountLarge: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.inverse,
    letterSpacing: -0.2,
  },
  
  changePercentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    paddingVertical: 6,
    borderRadius: MarketNewsBrand.borderRadius.full,
    minWidth: 70,
    alignItems: 'center',
  },
  
  changePercentLarge: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.inverse,
  },
  
  // 详细信息容器
  detailsContainer: {
    flexDirection: 'row',
    gap: MarketNewsBrand.spacing.sm,
  },
  
  // 详细信息卡片 - 精简版
  detailCard: {
    flex: 1,
    borderRadius: MarketNewsBrand.borderRadius.md,
    padding: MarketNewsBrand.spacing.sm,
    ...MarketNewsBrand.shadow.sm,
  },
  
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: MarketNewsBrand.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  
  detailLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
    color: MarketNewsBrand.colors.text.secondary,
    flex: 1,
  },
  
  detailValue: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.primary,
    letterSpacing: -0.2,
  },
  
  // 登录状态
  loginContainer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: MarketNewsBrand.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MarketNewsBrand.colors.primary[200],
    borderStyle: 'dashed',
  },
  
  loginIcon: {
    marginBottom: MarketNewsBrand.spacing.md,
    opacity: 0.8,
  },
  
  loginTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: MarketNewsBrand.spacing.xs,
    textAlign: 'center',
  },
  
  loginSubtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal as any,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    lineHeight: MarketNewsBrand.typography.fontSize.md * 1.4,
  },
  
  // 加载状态
  loadingContainer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: MarketNewsBrand.spacing.lg,
  },
  
  loadingShimmer: {
    opacity: 0.6,
  },
  
  shimmerLine: {
    height: 16,
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
});

