/**
 * 时间轴风格的新闻项组件
 * 
 * 特点：
 * - 左侧时间线和时间点标记
 * - 时间标签显示
 * - 新闻内容卡片
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TradingViewNewsItem } from '@/types/stock';
import { formatRelativeTime, formatDateTime } from '@/utils/timeFormat';
import { MarketNewsBrand } from '@/config/brand';
import { StockLogo } from '@/components/ui/StockLogo';
import { isCompositeSymbol } from '@/helpers/symbolUtils';

interface TimelineNewsItemProps {
  item: TradingViewNewsItem;
  isFirst?: boolean;
  isLast?: boolean;
  showTimeLabel?: boolean; // 是否显示时间标签
}

export const TimelineNewsItem: React.FC<TimelineNewsItemProps> = ({ 
  item, 
  isFirst = false, 
  isLast = false,
  showTimeLabel = true 
}) => {
  const handlePress = () => {
    if (item.id) {
      router.push(`/news-flash/${encodeURIComponent(item.id)}`);
    }
  };

  // 获取前5个有效的关联股票
  const relatedSymbols = useMemo(() => {
    if (!item.relatedSymbols) return [];
    
    return item.relatedSymbols
      .filter(symbol => symbol.symbol && isCompositeSymbol(symbol.symbol))
      .slice(0, 5);
  }, [item.relatedSymbols]);

  // 格式化时间
  const timeLabel = formatRelativeTime(item.published); // 用于时间轴标签
  const newsTime = formatDateTime(item.published, 'HH:mm'); // 用于新闻项内部

  return (
    <View style={styles.container}>
      {/* 左侧时间轴 */}
      <View style={styles.timelineContainer}>
        {/* 上半部分的线 */}
        {!isFirst && <View style={styles.timelineLineTop} />}
        
        {/* 时间点标记 */}
        <View style={styles.timelineDot}>
          <View style={styles.timelineDotInner} />
        </View>
        
        {/* 下半部分的线 */}
        {!isLast && <View style={styles.timelineLineBottom} />}
      </View>

      {/* 右侧内容区域 */}
      <View style={styles.contentWrapper}>
        {/* 时间标签（仅当与上一条时间不同时显示） */}
        {showTimeLabel && (
          <Text style={styles.timeLabel}>{timeLabel}</Text>
        )}

        {/* 新闻卡片 */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            
            {/* 底部信息 */}
            <View style={styles.footer}>
              {/* 关联股票 Logo */}
              {relatedSymbols.length > 0 && (
                <View style={styles.relatedSymbolsContainer}>
                  {relatedSymbols.map((relatedSymbol, index) => (
                    <View key={`${relatedSymbol.symbol}-${index}`} style={styles.logoWrapper}>
                      <StockLogo 
                        logoid={relatedSymbol.logoid}
                        baseCurrencyLogoid={relatedSymbol['base-currency-logoid']}
                        currencyLogoid={relatedSymbol['currency-logoid']}
                        symbol={relatedSymbol.symbol}
                        size={18}
                      />
                    </View>
                  ))}
                </View>
              )}
              
              {/* 占位符，确保来源信息在右侧 */}
              <View style={styles.spacer} />
              
              {/* 来源信息和时间 */}
              <View style={styles.providerContainer}>
                {item.provider && (
                  <>
                    <Ionicons 
                      name="newspaper-outline" 
                      size={14} 
                      color={MarketNewsBrand.colors.text.tertiary} 
                      style={styles.providerIcon}
                    />
                    <Text style={styles.provider} numberOfLines={1}>
                      {item.provider.name}
                    </Text>
                  </>
                )}
                {item.provider && <Text style={styles.separator}> · </Text>}
                <Text style={styles.newsTime} numberOfLines={1}>
                  {newsTime}
                </Text>
              </View>
            </View>
          </View>
          
          {/* 箭头指示 */}
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={MarketNewsBrand.colors.text.tertiary} 
            style={styles.arrow}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  
  // 时间轴样式（紧凑版）
  timelineContainer: {
    width: 30,
    alignItems: 'center',
    paddingTop: 18,
  },
  timelineLineTop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 18,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: MarketNewsBrand.borderRadius.sm,
    backgroundColor: MarketNewsBrand.colors.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9ca3af',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2, // 小圆角，保持硬编码
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  timelineLineBottom: {
    position: 'absolute',
    bottom: 0,
    top: 28,
    width: 2,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  
  // 内容区域（紧凑版）
  contentWrapper: {
    flex: 1,
    paddingBottom: 8,
  },
  timeLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.tertiary,
    marginBottom: 4,
    marginLeft: 0,
  },
  card: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#9ca3af',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.08)',
  },
  cardContent: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    lineHeight: 19,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  relatedSymbolsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    marginRight: 4,
  },
  spacer: {
    flex: 1,
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  providerIcon: {
    marginRight: 3,
  },
  provider: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: '500',
  },
  separator: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: '400',
  },
  newsTime: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: '400',
  },
  arrow: {
    marginLeft: 2,
  },
});
