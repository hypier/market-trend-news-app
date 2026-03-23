/**
 * 股票技术分析Tab组件
 * 
 * 融合多时间周期技术分析和详细技术指标，为普通用户提供形象化的技术指导
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTechnicalAnalysisStore } from '@/stores';
import type {
  TechnicalAnalysisData,
  DetailedTechnicalIndicators,
} from '@/types/tradingview';
import { useTranslation } from '@/hooks';

interface StockTechnicalTabProps {
  symbol: string;
  exchange: string;
  currency?: string;
}

export function StockTechnicalTab({ symbol, exchange, currency = 'USD' }: StockTechnicalTabProps) {
  const { t } = useTranslation();
  
  // 构建 TradingView 格式的 symbol
  const tvSymbol = useMemo(() => `${exchange}:${symbol}`, [exchange, symbol]);

  // 使用 store
  const {
    analysisData,
    indicatorsData,
    loading,
    errors,
    fetchTechnicalData,
  } = useTechnicalAnalysisStore();

  // 获取当前股票的数据
  const technicalAnalysis = analysisData[tvSymbol];
  const detailedIndicators = indicatorsData[tvSymbol];
  const isLoading = loading[tvSymbol];
  const error = errors[tvSymbol];

  // 加载技术分析数据
  useEffect(() => {
    fetchTechnicalData(tvSymbol);
  }, [tvSymbol, fetchTechnicalData]);

  // 加载状态
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[500]} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  // 错误状态
  if (error || !technicalAnalysis || !detailedIndicators) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || t('stock.technicalError')}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchTechnicalData(tvSymbol)}
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 三个仪表盘垂直排列 */}
      <View style={styles.gaugesSection}>
        <GaugeCard 
          title={t('stock.summary')}
          data={technicalAnalysis}
          type="all"
        />
        <GaugeCard 
          title={t('stock.oscillators')}
          data={technicalAnalysis}
          type="oscillators"
        />
        <GaugeCard 
          title={t('stock.movingAverages')}
          data={technicalAnalysis}
          type="ma"
        />
      </View>
      
      {/* 多时间周期热力图 */}
      <MultiTimeframeHeatmap analysis={technicalAnalysis} />
      
      {/* 支撑阻力位卡片 */}
      <SupportResistanceCard indicators={detailedIndicators} currency={currency} />
      
      {/* 底部留白 */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

// ============= 子组件 =============

/**
 * 圆环进度图卡片 - Apple Watch风格
 */
function GaugeCard({ 
  title, 
  data, 
  type 
}: { 
  title: string; 
  data: TechnicalAnalysisData;
  type: 'all' | 'oscillators' | 'ma';
}) {
  const { t } = useTranslation();
  
  // 统计各时间周期的5档数量
  const stats = useMemo(() => {
    const timeframes = ['1', '5', '15', '60', '240', '1D', '1W', '1M'];
    let strongSell = 0, sell = 0, neutral = 0, buy = 0, strongBuy = 0;
    
    const field = type === 'all' ? 'All' : type === 'oscillators' ? 'Other' : 'MA';
    
    timeframes.forEach(tf => {
      const value = data[tf as keyof TechnicalAnalysisData]?.[field as 'All' | 'Other' | 'MA'];
      if (typeof value === 'number') {
        if (value > 0.5) strongBuy++;
        else if (value > 0.1) buy++;
        else if (value > -0.1) neutral++;
        else if (value > -0.5) sell++;
        else strongSell++;
      }
    });
    
    return { strongSell, sell, neutral, buy, strongBuy };
  }, [data, type]);
  
  // 计算百分比和主要趋势
  const analysis = useMemo(() => {
    const total = 8; // 总时间周期数
    const bullishPercent = ((stats.buy + stats.strongBuy) / total) * 100;
    const bearishPercent = ((stats.sell + stats.strongSell) / total) * 100;
    const neutralPercent = (stats.neutral / total) * 100;
    
    let status: 'strongBuy' | 'buy' | 'neutral' | 'sell' | 'strongSell';
    let color: string;
    
    if (stats.strongBuy >= 4) {
      status = 'strongBuy';
      color = '#059669';
    } else if (bullishPercent >= 50) {
      status = 'buy';
      color = '#10B981';
    } else if (stats.strongSell >= 4) {
      status = 'strongSell';
      color = '#DC2626';
    } else if (bearishPercent >= 50) {
      status = 'sell';
      color = '#EF4444';
    } else {
      status = 'neutral';
      color = '#9CA3AF';
    }
    
    return {
      bullishPercent,
      bearishPercent,
      neutralPercent,
      status,
      color,
      label: t(`stock.${status}`)
    };
  }, [stats, t]);

  // 绘制圆环路径
  const createArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    // 处理完整圆的情况：当角度差接近360度时，分成两个半圆
    const angleDiff = endAngle - startAngle;
    if (angleDiff >= 359.9) {
      const midAngle = startAngle + 180;
      const start = polarToCartesian(centerX, centerY, radius, startAngle);
      const mid = polarToCartesian(centerX, centerY, radius, midAngle);
      const end = polarToCartesian(centerX, centerY, radius, endAngle - 0.1); // 略小于360度避免重合
      return [
        'M', start.x, start.y,
        'A', radius, radius, 0, 0, 1, mid.x, mid.y,
        'A', radius, radius, 0, 0, 1, end.x, end.y
      ].join(' ');
    }
    
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  // 计算角度
  const bearishAngle = (analysis.bearishPercent / 100) * 360;
  const neutralAngle = bearishAngle + (analysis.neutralPercent / 100) * 360;
  const bullishAngle = neutralAngle + (analysis.bullishPercent / 100) * 360;

  return (
    <View style={styles.gaugeCard}>
      <Text style={styles.gaugeTitle}>{title}</Text>
      
      {/* 圆环进度图 */}
      <View style={styles.gaugeContainer}>
        <Svg width="220" height="220" viewBox="0 0 220 220">
          <Defs>
            {/* 渐变色定义 */}
            <LinearGradient id={`bearishGradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#DC2626" stopOpacity="1" />
              <Stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id={`bullishGradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          
          {/* 背景圆环 */}
          <Circle
            cx="110"
            cy="110"
            r="85"
            stroke="#F3F4F6"
            strokeWidth="24"
            fill="none"
          />
          
          {/* 看空圆弧 */}
          {analysis.bearishPercent > 0 && (
            <Path
              d={createArc(110, 110, 85, 0, bearishAngle)}
              stroke={`url(#bearishGradient-${type})`}
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
            />
          )}
          
          {/* 中性圆弧 */}
          {analysis.neutralPercent > 0 && (
            <Path
              d={createArc(110, 110, 85, bearishAngle, neutralAngle)}
              stroke="#9CA3AF"
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
            />
          )}
          
          {/* 看多圆弧 */}
          {analysis.bullishPercent > 0 && (
            <Path
              d={createArc(110, 110, 85, neutralAngle, bullishAngle)}
              stroke={`url(#bullishGradient-${type})`}
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
            />
          )}
          
          {/* 中心文字 */}
          <SvgText
            x="100"
            y="108"
            textAnchor="middle"
            fontSize="36"
            fontWeight="bold"
            fill={analysis.color}
          >
            {Math.round(analysis.bullishPercent)}%
          </SvgText>
          <SvgText
            x="110"
            y="135"
            textAnchor="middle"
            fontSize="14"
            fill="#6B7280"
          >
            {t('stock.bullish')}
          </SvgText>
        </Svg>
      </View>
      
      {/* 当前状态 */}
      <Text style={[styles.gaugeValue, { color: analysis.color }]}>{analysis.label}</Text>
      
      {/* 统计数据 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.statLabel}>{t('stock.bearish')}</Text>
          <Text style={styles.statValue}>{stats.sell + stats.strongSell}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#9CA3AF' }]} />
          <Text style={styles.statLabel}>{t('stock.neutral')}</Text>
          <Text style={styles.statValue}>{stats.neutral}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statLabel}>{t('stock.bullish')}</Text>
          <Text style={styles.statValue}>{stats.buy + stats.strongBuy}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * 多时间周期热力图
 */
function MultiTimeframeHeatmap({ analysis }: { analysis: TechnicalAnalysisData }) {
  const { t } = useTranslation();
  
  const timeframes = ['1', '5', '15', '60', '240', '1D', '1W', '1M'] as const;
  const indicators = ['All', 'MA', 'Other'] as const;

  const getCellColor = (value: number) => {
    if (value > 0.5) return '#10B981'; // 深绿色 - 强烈看多
    if (value > 0.1) return '#86EFAC'; // 浅绿色 - 看多
    if (value > -0.1) return '#9CA3AF'; // 灰色 - 中性
    if (value > -0.5) return '#FCA5A5'; // 浅红色 - 看空
    return '#EF4444'; // 深红色 - 强烈看空
  };

  const getTimeframeLabel = (tf: string) => {
    return t(`stock.timeframes.${tf}`);
  };

  const getIndicatorLabel = (ind: 'All' | 'MA' | 'Other') => {
    const labelMap = {
      'All': t('stock.indicatorAll'),
      'MA': t('stock.indicatorMA'),
      'Other': t('stock.indicatorOther'),
    };
    return labelMap[ind];
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('stock.multiTimeframe')}</Text>
      
      {/* 表头 */}
      <View style={styles.heatmapHeader}>
        <View style={styles.heatmapCorner} />
        {indicators.map((ind) => (
          <View key={ind} style={styles.heatmapHeaderCell}>
            <Text style={styles.heatmapHeaderText}>{getIndicatorLabel(ind)}</Text>
          </View>
        ))}
      </View>
      
      {/* 热力图主体 */}
      {timeframes.map((tf) => {
        const data = analysis[tf];
        if (!data) return null;
        
        return (
          <View key={tf} style={styles.heatmapRow}>
            <View style={styles.heatmapRowHeader}>
              <Text style={styles.heatmapRowHeaderText}>{getTimeframeLabel(tf)}</Text>
            </View>
            {indicators.map((ind) => (
              <View
                key={`${tf}-${ind}`}
                style={[
                  styles.heatmapCell,
                  { backgroundColor: getCellColor(data[ind]) },
                ]}
              >
                <Text style={styles.heatmapCellText}>
                  {(data[ind] * 100).toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
      
      {/* 图例 */}
      <View style={styles.heatmapLegend}>
        <LegendItem color="#EF4444" label={t('stock.strongSell')} />
        <LegendItem color="#FCA5A5" label={t('stock.sell')} />
        <LegendItem color="#9CA3AF" label={t('stock.neutral')} />
        <LegendItem color="#86EFAC" label={t('stock.buy')} />
        <LegendItem color="#10B981" label={t('stock.strongBuy')} />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}


/**
 * 支撑阻力位卡片 - 简化版
 */
function SupportResistanceCard({ 
  indicators, 
  currency = 'USD' 
}: { 
  indicators: DetailedTechnicalIndicators;
  currency?: string;
}) {
  const { t } = useTranslation();
  const price = indicators.close;
  const r1 = indicators['Pivot.M.Classic.R1'];
  const middle = indicators['Pivot.M.Classic.Middle'];
  const s1 = indicators['Pivot.M.Classic.S1'];
  
  // 格式化价格显示
  const formatPrice = (value: number) => {
    return `${currency} ${value.toFixed(2)}`;
  };
  
  // 判断价格位置状态
  const priceStatus = useMemo(() => {
    if (price > r1) return { position: 'above', text: t('stock.aboveResistance') };
    if (price < s1) return { position: 'below', text: t('stock.belowSupport') };
    return { position: 'between', text: '' };
  }, [price, r1, s1, t]);
  
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('stock.supportResistance')}</Text>
      
      <View style={styles.srSimpleContainer}>
        {/* 价格在阻力位上方 */}
        {priceStatus.position === 'above' && (
          <View style={styles.srPriceAbove}>
            <Text style={styles.srPriceAboveText}>
              ► {t('stock.currentPrice')}: {formatPrice(price)}
            </Text>
            <Text style={styles.srPriceStatusText}>{priceStatus.text}</Text>
          </View>
        )}
        
        {/* 阻力位 */}
        <View style={[styles.srSimpleLevel, styles.srResistance]}>
          <Text style={styles.srSimpleLabel}>{t('stock.resistance')}</Text>
          <Text style={styles.srSimpleValue}>{formatPrice(r1)}</Text>
        </View>
        
        {/* 价格在区间内 */}
        {priceStatus.position === 'between' && (
          <View style={styles.srPriceBetween}>
            <Text style={styles.srPriceBetweenText}>
              ► {t('stock.currentPrice')}: {formatPrice(price)}
            </Text>
          </View>
        )}
        
        {/* 中轴 */}
        <View style={[styles.srSimpleLevel, styles.srMiddle]}>
          <Text style={styles.srSimpleLabel}>{t('stock.pivot')}</Text>
          <Text style={styles.srSimpleValue}>{formatPrice(middle)}</Text>
        </View>
        
        {/* 价格在支撑位下方 */}
        {priceStatus.position === 'below' && (
          <View style={styles.srPriceBelow}>
            <Text style={styles.srPriceBelowText}>
              ► {t('stock.currentPrice')}: {formatPrice(price)}
            </Text>
            <Text style={styles.srPriceStatusText}>{priceStatus.text}</Text>
          </View>
        )}
        
        {/* 支撑位 */}
        <View style={[styles.srSimpleLevel, styles.srSupport]}>
          <Text style={styles.srSimpleLabel}>{t('stock.support')}</Text>
          <Text style={styles.srSimpleValue}>{formatPrice(s1)}</Text>
        </View>
      </View>
    </View>
  );
}

// ============= 样式 =============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  errorText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.market.bearish,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: MarketNewsBrand.colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: MarketNewsBrand.borderRadius.lg,
  },
  retryButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  bottomSpacing: {
    height: 20,
  },
  
  // 卡片
  card: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 16,
  },
  
  // 仪表盘区域 - 垂直排列
  gaugesSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  gaugeCard: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  gaugeTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 16,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gaugeValue: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    marginBottom: 16,
  },
  // 统计数据行
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
  },
  statLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  statValue: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
  },
  
  
  // 热力图
  heatmapHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  heatmapCorner: {
    width: 40,
  },
  heatmapHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  heatmapHeaderText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  heatmapRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  heatmapRowHeader: {
    width: 40,
    justifyContent: 'center',
  },
  heatmapRowHeaderText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: '500',
    color: MarketNewsBrand.colors.text.secondary,
  },
  heatmapCell: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: MarketNewsBrand.borderRadius.md,
  },
  heatmapCellText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.inverse,
  },
  heatmapLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 5,
  },
  legendLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
  },
  
  // 支撑阻力位样式
  srSimpleContainer: {
    gap: 12,
  },
  srSimpleLevel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: MarketNewsBrand.borderRadius.lg,
  },
  srResistance: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.market.bearish,
  },
  srMiddle: {
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.market.neutral,
  },
  srSupport: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.market.bullish,
  },
  srSimpleLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: '500',
    color: MarketNewsBrand.colors.text.secondary,
  },
  srSimpleValue: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
  },
  // 价格位置样式
  srPriceAbove: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.market.bullish,
  },
  srPriceAboveText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.market.bullish,
    marginBottom: 4,
  },
  srPriceBetween: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.primary[600],
  },
  srPriceBetweenText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.primary[600],
  },
  srPriceBelow: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.market.bearish,
  },
  srPriceBelowText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.market.bearish,
    marginBottom: 4,
  },
  srPriceStatusText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontStyle: 'italic',
  },
});

