/**
 * 买卖盘组件
 * 
 * 显示实时买卖价、价差和更新时间
 * 使用 TradingView API 提供的额外数据
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { formatPrice } from '@/utils/currencyFormatter';
import { calculateSpreadPercent } from '@/services/chart/tradingViewAdapter';
import type { TradingViewQuote } from '@/types/tradingview';

interface BidAskSpreadProps {
  /** TradingView 报价数据 */
  quote: TradingViewQuote | null;
  /** 是否紧凑模式 */
  compact?: boolean;
}

export const BidAskSpread = React.memo(function BidAskSpread({ quote, compact = false }: BidAskSpreadProps) {
  // ✅ 必须在所有 Hooks 之前处理条件渲染
  
  // 检查数据新鲜度（2分钟内的数据才显示）
  const isDataFresh = useMemo(() => {
    if (!quote?.lp_time) return false;
    const now = Math.floor(Date.now() / 1000); // 当前时间（秒）
    const dataAge = now - quote.lp_time; // 数据年龄（秒）
    const MAX_AGE = 2 * 60; // 2分钟
    return dataAge <= MAX_AGE;
  }, [quote?.lp_time]);
  
  // 格式化更新时间
  const updateTime = useMemo(() => {
    if (!quote?.lp_time) return null;
    return new Date(quote.lp_time * 1000).toLocaleTimeString('zh-CN');
  }, [quote?.lp_time]);

  // 调试日志：查看 quote 数据和新鲜度
  React.useEffect(() => {
    if (quote) {
      const now = Math.floor(Date.now() / 1000);
      const dataAge = quote.lp_time ? now - quote.lp_time : 0;
      console.log('[BidAskSpread] Quote data:', {
        symbol: quote.short_name,
        bid: quote.bid,
        ask: quote.ask,
        lp: quote.lp,
        lp_time: quote.lp_time,
        updateTime,
        dataAge: `${dataAge}秒`,
        isDataFresh,
      });
    }
  }, [quote, updateTime, isDataFresh]);

  // ✅ 隐藏条件：
  // 1. 没有 quote 数据
  // 2. 缺少 bid 或 ask
  // 3. 数据不新鲜（超过2分钟未更新）
  if (!quote || !quote.bid || !quote.ask || !isDataFresh) {
    if (quote) {
      const now = Math.floor(Date.now() / 1000);
      const dataAge = quote.lp_time ? now - quote.lp_time : 0;
      console.log('[BidAskSpread] 隐藏盘口：', { 
        hasQuote: !!quote, 
        hasBid: !!quote?.bid, 
        hasAsk: !!quote?.ask,
        isDataFresh,
        dataAge: `${dataAge}秒`,
        reason: !quote.bid ? '缺少买价' : !quote.ask ? '缺少卖价' : '数据过时'
      });
    }
    return null;
  }

  // 计算价差和价差百分比
  const spread = quote.ask - quote.bid;
  const spreadPercent = calculateSpreadPercent(quote.bid, quote.ask, quote.lp);

  // 获取货币代码
  const currency = quote.currency_code || 'USD';

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <Text style={styles.compactLabel}>买</Text>
          <Text style={[styles.compactValue, styles.bidColor]}>
            {formatPrice(quote.bid, currency)}
          </Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactRow}>
          <Text style={styles.compactLabel}>卖</Text>
          <Text style={[styles.compactValue, styles.askColor]}>
            {formatPrice(quote.ask, currency)}
          </Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactRow}>
          <Text style={styles.compactLabel}>差</Text>
          <Text style={styles.compactValue}>
            {spreadPercent.toFixed(3)}%
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>实时盘口</Text>

      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>买价</Text>
          <Text style={[styles.value, styles.bidColor]}>
            {formatPrice(quote.bid, currency)}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.label}>卖价</Text>
          <Text style={[styles.value, styles.askColor]}>
            {formatPrice(quote.ask, currency)}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.label}>价差</Text>
          <Text style={styles.value}>
            {spreadPercent.toFixed(3)}%
          </Text>
          <Text style={styles.subValue}>
            {formatPrice(spread, currency)}
          </Text>
        </View>
      </View>

      {updateTime && (
        <View style={styles.footer}>
          <Text style={styles.updateTime}>
            更新时间: {updateTime}
          </Text>
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在报价数据变化时重渲染
  if (!prevProps.quote && !nextProps.quote) return true;
  if (!prevProps.quote || !nextProps.quote) return false;
  
  // ✅ 任何一个关键字段变化都触发重渲染
  const shouldUpdate = 
    prevProps.quote.bid !== nextProps.quote.bid ||
    prevProps.quote.ask !== nextProps.quote.ask ||
    prevProps.quote.lp !== nextProps.quote.lp ||
    prevProps.quote.lp_time !== nextProps.quote.lp_time ||
    prevProps.compact !== nextProps.compact;
  
  // 如果需要更新，输出日志
  if (shouldUpdate) {
    console.log('[BidAskSpread] 触发重渲染:', {
      bidChanged: prevProps.quote.bid !== nextProps.quote.bid,
      askChanged: prevProps.quote.ask !== nextProps.quote.ask,
      lpChanged: prevProps.quote.lp !== nextProps.quote.lp,
      timeChanged: prevProps.quote.lp_time !== nextProps.quote.lp_time,
      prevTime: new Date((prevProps.quote.lp_time || 0) * 1000).toLocaleTimeString('zh-CN'),
      nextTime: new Date((nextProps.quote.lp_time || 0) * 1000).toLocaleTimeString('zh-CN'),
    });
  }
  
  return !shouldUpdate; // 返回 true 表示不更新，false 表示更新
});

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 6,
  },
  value: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  subValue: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    marginTop: 2,
  },
  bidColor: {
    color: '#10B981', // 绿色
  },
  askColor: {
    color: '#EF4444', // 红色
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  updateTime: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
  },
  // 紧凑模式样式
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    marginTop: 8,
  },
  compactRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compactLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
  },
  compactValue: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
});

