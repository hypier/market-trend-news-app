/**
 * 简单面积图组件
 * 
 * 用于小窗口快速浏览股票价格趋势
 * 轻量化设计，只显示收盘价趋势线
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { generateAreaChartHTML } from '@/services/chart/chartHTMLGenerator';
import { Logger, LogModule } from '@/utils/logger';
import { getDeviceTimezone } from '@/utils/localeUtils';
import type { TradingViewCandle } from '@/types/tradingview';
import { validateTimestamp } from '@/services/chart/tradingViewAdapter';

interface SimpleAreaChartProps {
  /** 价格数据数组 */
  data: number[];
  /** ✅ 完整K线数据（包含真实时间戳） */
  candles?: TradingViewCandle[];
  /** ✅ 时间周期对应的timeframe（'5', '120', 'D'等） */
  timeframe?: string;
  /** 实时报价数据（用于数据累积） */
  quote?: { lp: number; lp_time?: number } | null;
  /** 图表高度 */
  height?: number;
  /** 加载状态 */
  isLoading?: boolean;
  /** 股票代码 */
  symbol?: string;
  /** 货币符号 */
  currency?: string;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 全屏请求回调 */
  onFullscreenRequest?: () => void;
  /** 是否显示全屏按钮 */
  showFullscreenButton?: boolean;
  /** 时间周期 */
  period?: string;
  /** 价格精度（pricescale），如 10000 表示 4 位小数 */
  pricescale?: number;
  /** 开盘价（用于基准线） */
  openPrice?: number;
  /** 是否为上涨（用于最新价格点颜色） */
  isPositive?: boolean;
}

// 时间范围映射 (秒) - 默认显示1天数据
const DEFAULT_TIME_RANGE = 24 * 3600; // 1天
// 数据点累积时间间隔（秒）- 超过此时间间隔才追加新数据点
const DATA_POINT_INTERVAL = 3; // 3秒

const DEFAULT_COLORS = {
  line: 'rgba(255, 255, 255, 0.95)',
  topColor: 'rgba(255, 255, 255, 0.3)',
  bottomColor: 'rgba(255, 255, 255, 0.05)',
};

export function SimpleAreaChart({
  data,
  candles, // ✅ 新增：完整K线数据
  timeframe, // ✅ 新增：timeframe
  quote,
  height = 220,
  isLoading = false,
  symbol = '',
  currency = 'USD',
  backgroundColor = 'transparent',
  onFullscreenRequest,
  showFullscreenButton = true,
  period = '1day',
  pricescale = 100,
  openPrice, // 🎯 方案A：开盘价
  isPositive = true, // 🎯 方案A：是否上涨
}: SimpleAreaChartProps) {
  const webViewRef = useRef<WebView>(null);
  const previousDataRef = useRef<number[]>([]);
  const timeSeriesDataRef = useRef<{ time: number; value: number }[]>([]);
  const accumulatedDataRef = useRef<number[]>([]); // 累积的数据数组
  const lastAppendTimeRef = useRef<number>(0); // 上次追加数据点的时间
  const previousQuoteRef = useRef<{ lp: number; lp_time?: number } | null>(null);
  const previousPeriodRef = useRef<string>(period); // 记录上次的周期
  const [isPeriodChanging, setIsPeriodChanging] = React.useState(false); // 周期切换中状态

  // 数据处理：当历史数据变化时，初始化累积数据数组
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      timeSeriesDataRef.current = [];
      accumulatedDataRef.current = [];
      return {
        values: [],
        timeSeriesData: [],
        firstPrice: 0,
        currentPrice: 0,
      };
    }

    const validData = data.filter(
      (price) =>
        typeof price === 'number' && !isNaN(price) && isFinite(price) && price > 0
    );

    if (validData.length === 0) {
      timeSeriesDataRef.current = [];
      accumulatedDataRef.current = [];
      return {
        values: [],
        timeSeriesData: [],
        firstPrice: 0,
        currentPrice: 0,
      };
    }

    // 🔥 关键：检测周期变化
    const periodChanged = previousPeriodRef.current !== period;
    if (periodChanged) {
      Logger.info(LogModule.STOCK, '[SimpleAreaChart] 周期变化，准备重置累积数据', {
        from: previousPeriodRef.current,
        to: period,
        currentDataLength: validData.length,
        accumulatedLength: accumulatedDataRef.current.length,
      });
      previousPeriodRef.current = period;
      setIsPeriodChanging(true); // 🔥 设置周期切换中状态，显示加载指示器
      
      // 🎯 用户体验优化：保留旧数据继续显示，不立即清空
      // 这样用户看到的是平滑过渡，不会有空白闪现
      // 新数据到达时会自动替换旧数据
      Logger.info(LogModule.STOCK, '[SimpleAreaChart] 周期变化，保留旧数据显示，等待新数据', {
        period,
        keepingOldDataLength: accumulatedDataRef.current.length,
      });
    }
    
    // 🔥 任务4.6：修复数据污染 - 检测 candles 和 data 同步
    // 注意：这个检测在 periodChanged 外部，处理后续渲染的数据不匹配情况
    
    // 检测 candles 为空或不存在时
    if (!candles || candles.length === 0) {
      // 如果有旧数据，继续显示旧数据（平滑体验）
      if (accumulatedDataRef.current.length > 0) {
        Logger.info(LogModule.STOCK, '[SimpleAreaChart] Candles为空，保留旧数据显示', {
          period,
          oldDataLength: accumulatedDataRef.current.length,
        });
        // 继续使用旧数据，不返回空
      } else {
        // 完全没有数据时才返回空
        return {
          values: [],
          timeSeriesData: [],
          firstPrice: 0,
          currentPrice: 0,
        };
      }
    }
    
    // 🔥 关键修复：验证 candles 和 data 长度匹配
    // 如果不匹配，说明 data 还是旧周期的数据
    if (candles && candles.length > 0 && candles.length !== validData.length) {
      // 数据不同步，但有旧数据可以显示
      if (accumulatedDataRef.current.length > 0) {
        Logger.info(LogModule.STOCK, '[SimpleAreaChart] 数据长度不匹配，保留旧数据显示', {
          period,
          candlesLength: candles.length,
          dataLength: validData.length,
          oldDataLength: accumulatedDataRef.current.length,
        });
        // 继续使用旧数据，不返回空
      } else {
        // 没有旧数据时才返回空
        Logger.warn(LogModule.STOCK, '[SimpleAreaChart] 数据长度不匹配且无旧数据，返回空', {
          period,
          candlesLength: candles.length,
          dataLength: validData.length,
        });
        return {
          values: [],
          timeSeriesData: [],
          firstPrice: 0,
          currentPrice: 0,
        };
      }
    }
    
    // 🎯 数据同步成功，现在可以安全地更新数据
    if (candles && candles.length === validData.length) {
      // 重置累积数据，使用新数据
      accumulatedDataRef.current = [];
      lastAppendTimeRef.current = 0;
      previousQuoteRef.current = null;
      
      if (periodChanged) {
        Logger.info(LogModule.STOCK, '[SimpleAreaChart] 数据同步完成，开始使用新数据', {
          period,
          newDataLength: validData.length,
        });
      }
    }
    
    // 🔥 关键：如果历史数据长度增加，或者累积数据为空需要初始化，说明是新的历史数据加载
    if (validData.length > accumulatedDataRef.current.length || accumulatedDataRef.current.length === 0) {
      accumulatedDataRef.current = [...validData];
      lastAppendTimeRef.current = Math.floor(Date.now() / 1000);
      previousQuoteRef.current = null; // 重置 quote 引用，让新的 quote 触发累积
      setIsPeriodChanging(false); // 🔥 数据加载完成，重置切换状态
      
      // Logger.info(LogModule.STOCK, '[SimpleAreaChart] 历史数据加载，初始化累积数据', {
      //   period,
      //   dataLength: validData.length,
      //   wasPeriodChanged: periodChanged,
      // });
    }

    // 使用累积的数据数组
    const displayData = accumulatedDataRef.current.length > 0 
      ? accumulatedDataRef.current 
      : validData;

    // ✅ 生成时间序列数据（任务4.2：使用真实时间戳）
    let timeSeriesData: { time: number; value: number }[];
    
    // 优先使用 candles 中的真实时间戳
    if (candles && candles.length > 0 && candles.length === displayData.length) {
      timeSeriesData = displayData.map((value, index) => {
        const candleTime = candles[index].time;
        
        // 验证时间戳有效性
        if (!validateTimestamp(candleTime)) {
          Logger.warn(LogModule.STOCK, '[SimpleAreaChart] 无效时间戳，使用当前时间', {
            index,
            candleTime,
            symbol,
          });
          return {
            time: Math.floor(Date.now() / 1000),
            value,
          };
        }
        
        return {
          time: candleTime,
          value,
        };
      });
      
      // Logger.debug(LogModule.STOCK, '[SimpleAreaChart] ✅ 使用真实时间戳', {
      //   symbol,
      //   period,
      //   dataLength: displayData.length,
      //   firstTime: timeSeriesData[0].time,
      //   lastTime: timeSeriesData[timeSeriesData.length - 1].time,
      // });
    } else {
      // 回退：使用假时间戳（向后兼容）
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - DEFAULT_TIME_RANGE;
      const dataPointInterval =
        displayData.length > 1 ? DEFAULT_TIME_RANGE / (displayData.length - 1) : DEFAULT_TIME_RANGE;

      timeSeriesData = displayData.map((value, index) => ({
        time: startTime + index * dataPointInterval,
        value,
      }));
      
      Logger.debug(LogModule.STOCK, '[SimpleAreaChart] ⚠️ 使用假时间戳（兼容模式）', {
        symbol,
        period,
        reason: !candles ? 'candles未提供' : 'candles长度不匹配',
        candlesLength: candles?.length || 0,
        dataLength: displayData.length,
      });
    }

    // 保存到 ref，供后续更新使用
    timeSeriesDataRef.current = timeSeriesData;

    return {
      values: displayData,
      timeSeriesData,
      firstPrice: displayData[0],
      currentPrice: displayData[displayData.length - 1],
    };
  }, [data, period, candles, symbol]); // ✅ 添加 candles 依赖

  // 获取设备时区
  const deviceTimezone = useMemo(() => {
    const timezone = getDeviceTimezone();
    Logger.debug(LogModule.STOCK, '[SimpleAreaChart] Using timezone:', timezone);
    return timezone;
  }, []);

  // 生成图表 HTML
  const chartHTML = useMemo(() => {
    if (chartData.timeSeriesData.length === 0) return '';

    return generateAreaChartHTML({
      data: chartData.timeSeriesData,
      height,
      colors: DEFAULT_COLORS,
      currency,
      backgroundColor,
      timezone: deviceTimezone,
      period,
      pricescale,
      openPrice, // 🎯 方案A：开盘价基准线
      isPositive, // 🎯 方案A：最新价格点颜色
    });
  }, [chartData.timeSeriesData, height, currency, backgroundColor, deviceTimezone, period, pricescale, openPrice, isPositive]);

  // 🔥 关键：基于 WebSocket quote 数据累积
  useEffect(() => {
    if (!quote || !quote.lp || !webViewRef.current) return;
    
    const currentPrice = quote.lp;
    const currentTime = quote.lp_time || Math.floor(Date.now() / 1000);
    const previousQuote = previousQuoteRef.current;
    
    // 初始化
    if (!previousQuote) {
      previousQuoteRef.current = quote;
      return;
    }
    
    // 价格变化
    if (Math.abs(currentPrice - previousQuote.lp) > 0.01) {
      const now = Math.floor(Date.now() / 1000);
      const timeSinceLastAppend = now - lastAppendTimeRef.current;
      
      // 如果时间间隔足够，追加新数据点（累积）
      if (timeSinceLastAppend >= DATA_POINT_INTERVAL) {
        // 追加新数据点到累积数组
        accumulatedDataRef.current = [...accumulatedDataRef.current, currentPrice];
        
        // 生成新的时间序列数据点
        const savedTimeSeriesData = timeSeriesDataRef.current;
        const lastTime = savedTimeSeriesData.length > 0 
          ? savedTimeSeriesData[savedTimeSeriesData.length - 1].time 
          : currentTime - DEFAULT_TIME_RANGE;
        const newTime = lastTime + timeSinceLastAppend;
        
        const newDataPoint = {
          time: newTime,
          value: currentPrice,
        };
        
        // 更新本地时间序列数据
        timeSeriesDataRef.current = [...savedTimeSeriesData, newDataPoint];
        
        // 发送追加数据消息到 WebView
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'appendData',
            data: [newDataPoint],
          })
        );
        
        Logger.info(LogModule.STOCK, '[SimpleAreaChart] ✅ Append new data point from WS quote', {
          time: newTime,
          price: currentPrice,
          timeSinceLastAppend,
          totalPoints: accumulatedDataRef.current.length,
        });
        
        lastAppendTimeRef.current = now;
      } else {
        // 时间间隔不够，只更新最后一个点
        const savedTimeSeriesData = timeSeriesDataRef.current;
        if (savedTimeSeriesData.length > 0) {
          const lastIndex = savedTimeSeriesData.length - 1;
          const lastTime = savedTimeSeriesData[lastIndex].time;
          
          // 更新累积数组的最后一个值
          if (accumulatedDataRef.current.length > 0) {
            accumulatedDataRef.current[accumulatedDataRef.current.length - 1] = currentPrice;
          }
          
          // 更新本地时间序列数据的最后一个点
          timeSeriesDataRef.current[lastIndex] = {
            time: lastTime,
            value: currentPrice,
          };
          
          // 发送更新最后一个点的消息到 WebView
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'updateLastPoint',
              time: lastTime,
              value: currentPrice,
            })
          );
          
          Logger.info(LogModule.STOCK, '[SimpleAreaChart] 🔄 Update last point from WS quote', {
            time: lastTime,
            price: currentPrice,
            previousPrice: previousQuote.lp,
            timeSinceLastAppend,
          });
        }
      }
      
      previousQuoteRef.current = quote;
    }
  }, [quote]);

  // 智能数据更新
  useEffect(() => {
    if (!data || data.length === 0 || !webViewRef.current) return;

    const currentData = data.filter(
      (d) => typeof d === 'number' && !isNaN(d) && isFinite(d) && d > 0
    );
    const previousData = previousDataRef.current;

    if (previousData.length === 0) {
      previousDataRef.current = currentData;
      return;
    }

    // 数据长度增加：新增数据点
    if (currentData.length > previousData.length) {
      const isValidAppend = currentData
        .slice(0, previousData.length)
        .every((val, idx) => Math.abs(val - previousData[idx]) < 0.01);

      if (isValidAppend) {
        // 🔥 关键修复：使用保存的时间戳，而不是重新计算
        const savedTimeSeriesData = timeSeriesDataRef.current;
        if (savedTimeSeriesData.length === currentData.length) {
          const newDataPoints = savedTimeSeriesData.slice(previousData.length);
          
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'appendData',
              data: newDataPoints,
            })
          );
          
          Logger.info(LogModule.STOCK, '[SimpleAreaChart] Append data', {
            count: newDataPoints.length,
          });
        }
      } else {
        // 数据不连续，完全刷新
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'setData',
            data: chartData.timeSeriesData,
          })
        );
        
        Logger.info(LogModule.STOCK, '[SimpleAreaChart] Data discontinuous, full refresh');
      }
    }
    // 数据长度相同：更新最后一个点
    else if (currentData.length === previousData.length) {
      const lastIndex = currentData.length - 1;
      const lastValueChanged =
        Math.abs(currentData[lastIndex] - previousData[lastIndex]) > 0.01;

      if (lastValueChanged) {
        // 🔥 关键修复：使用保存的时间戳，而不是重新计算
        const savedTimeSeriesData = timeSeriesDataRef.current;
        if (savedTimeSeriesData.length > 0 && savedTimeSeriesData.length === currentData.length) {
          const lastTime = savedTimeSeriesData[lastIndex].time;
          
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'updateLastPoint',
              time: lastTime,
              value: currentData[lastIndex],
            })
          );
          
          Logger.info(LogModule.STOCK, '[SimpleAreaChart] Update last point', {
            time: lastTime,
            value: currentData[lastIndex],
            previousValue: previousData[lastIndex],
          });
        }
      }
    }
    // 数据长度减少：完全刷新
    else if (currentData.length < previousData.length) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'setData',
          data: chartData.timeSeriesData,
        })
      );
      
      Logger.info(LogModule.STOCK, '[SimpleAreaChart] Data length decreased, full refresh');
    }

    previousDataRef.current = currentData;
  }, [data, chartData.timeSeriesData]);

  // 处理 WebView 消息
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        // case 'chartLoaded':
        //   Logger.info(LogModule.STOCK, '[SimpleAreaChart] Chart loaded');
        //   break;

        case 'chartError':
          Logger.error(LogModule.STOCK, '[SimpleAreaChart] Chart error:', message.error);
          break;
      }
    } catch (error) {
      Logger.error(LogModule.STOCK, '[SimpleAreaChart] Message parse error:', error);
    }
  }, []);

  // 加载状态
  if (isLoading && (!data || data.length === 0)) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载图表中...</Text>
        </View>
      </View>
    );
  }

  // 无数据状态
  if (!data || data.length === 0 || chartData.values.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无数据</Text>
          {symbol && <Text style={styles.emptySubtext}>{symbol} - 数据不可用</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { height }]}>
        <WebView
          ref={webViewRef}
          source={{ html: chartHTML }}
          style={[styles.webView, { backgroundColor }]}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          onError={(error) =>
            Logger.error(LogModule.STOCK, '[SimpleAreaChart] WebView error:', error)
          }
        />

        {/* 全屏按钮 */}
        {showFullscreenButton && onFullscreenRequest && (
          <TouchableOpacity style={styles.fullscreenButton} onPress={onFullscreenRequest}>
            <Ionicons name="expand" size={20} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        )}
        
        {/* 🎯 周期切换中指示器 - 右上角悬浮提示，不遮挡图表 */}
        {isPeriodChanging && (
          <View style={styles.switchingIndicator}>
            <View style={styles.switchingBadge}>
              <Text style={styles.switchingText}>加载中</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  chartContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // 🎯 周期切换指示器 - 右上角悬浮，不遮挡图表
  switchingIndicator: {
    position: 'absolute',
    top: 8,
    right: 48, // 避开全屏按钮
    zIndex: 6,
  },
  switchingBadge: {
    backgroundColor: 'rgba(18, 209, 142, 0.9)', // NavTrend 品牌色
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  switchingText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

