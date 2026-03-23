/**
 * 图表容器组件
 * 
 * 统一管理小窗口面积图和全屏蜡烛图
 * 负责全屏状态管理和数据协调
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SimpleAreaChart } from './SimpleAreaChart';
import { AdvancedCandlestickChart } from './AdvancedCandlestickChart';
import { TimePeriodSelector } from './TimePeriodSelector';
import { useTradingViewStore } from '@/stores';
import { Logger, LogModule } from '@/utils/logger';
import { getRefreshIntervalForPeriod, convertPeriod } from '@/services/chart/tradingViewAdapter';

interface ChartContainerProps {
  /** 股票代码 */
  symbol: string;
  /** 交易所 */
  exchange: string;
  /** 货币符号 */
  currency: string;
  /** 周期切换回调 */
  onPeriodChange: (period: string) => Promise<void>;
  /** 当前选中周期 */
  selectedPeriod?: string;
  /** 是否显示时间选择器 */
  showTimeSelector?: boolean;
  /** 图表高度（小窗口） */
  height?: number;
  /** 全屏请求回调（外部控制） */
  onFullscreenRequest?: () => void;
  /** 是否使用外部全屏控制 */
  externalFullscreenControl?: boolean;
  /** 价格精度（pricescale），如 10000 表示 4 位小数 */
  pricescale?: number;
}

export function ChartContainer({
  symbol,
  exchange,
  currency,
  onPeriodChange,
  selectedPeriod = '1day',
  showTimeSelector = true,
  height = 220,
  onFullscreenRequest,
  externalFullscreenControl = false,
  pricescale = 100,
}: ChartContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(selectedPeriod);

  // 使用 ref 存储回调，避免依赖项变化导致无限循环
  const onPeriodChangeRef = useRef(onPeriodChange);
  useEffect(() => {
    onPeriodChangeRef.current = onPeriodChange;
  }, [onPeriodChange]);

  const onFullscreenRequestRef = useRef(onFullscreenRequest);
  useEffect(() => {
    onFullscreenRequestRef.current = onFullscreenRequest;
  }, [onFullscreenRequest]);

  // 从 Store 获取数据 - 直接订阅避免对象比较问题
  const candles = useTradingViewStore((state) => state.history);
  const quote = useTradingViewStore((state) => state.quote);
  const isLoading = useTradingViewStore((state) => state.isLoading.history);
  const silentRefreshHistory = useTradingViewStore((state) => state.silentRefreshHistory);

  // ✅ 解析当前周期的 timeframe（任务3.1）
  const timeframe = useMemo(() => {
    const { timeframe: tf } = convertPeriod(selectedPeriod);
    return tf;
  }, [selectedPeriod]);

  // 提取面积图数据（收盘价）
  const areaChartData = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return candles.map((c) => c.close);
  }, [candles]);

  // 🎯 方案A：计算开盘价和涨跌状态
  const { openPrice, isPositive } = useMemo(() => {
    const open = quote?.open_price || 0;
    const change = quote?.ch || 0;
    
    return {
      openPrice: open,
      isPositive: change >= 0,
    };
  }, [quote]);

  // 周期切换处理
  const handlePeriodChange = useCallback(
    async (period: string) => {
      Logger.info(LogModule.STOCK, '[ChartContainer] 切换周期', {
        symbol,
        to: period,
      });

      setCurrentPeriod(period);
      await onPeriodChangeRef.current(period);
    },
    [symbol]
  );

  // 全屏状态切换
  const handleFullscreenRequest = useCallback(() => {
    Logger.info(LogModule.STOCK, '[ChartContainer] 进入全屏', { 
      symbol, 
      externalControl: externalFullscreenControl 
    });
    
    // 如果使用外部控制，调用外部回调
    if (externalFullscreenControl && onFullscreenRequestRef.current) {
      onFullscreenRequestRef.current();
    } else {
      // 否则使用内部状态
      setIsFullscreen(true);
    }
  }, [symbol, externalFullscreenControl]);

  const handleFullscreenClose = useCallback(() => {
    Logger.info(LogModule.STOCK, '[ChartContainer] 退出全屏', { symbol });
    setIsFullscreen(false);
  }, [symbol]);

  // 同步外部周期变化
  useEffect(() => {
    if (selectedPeriod !== currentPeriod) {
      setCurrentPeriod(selectedPeriod);
    }
  }, [selectedPeriod, currentPeriod]);

  // 全屏时确保有足够的数据（可选优化）
  useEffect(() => {
    if (isFullscreen && candles.length < 100) {
      Logger.info(LogModule.STOCK, '[ChartContainer] 全屏模式，检查数据量', {
        symbol,
        candlesCount: candles.length,
      });
      // 可以在这里触发加载更多数据
      // 但由于已经通过 TradingView 获取数据，这里暂时不需要额外处理
    }
  }, [isFullscreen, candles.length, symbol]);

  // 🔄 智能定时刷新：根据周期自动计算刷新间隔
  useEffect(() => {
    // 计算当前周期的刷新间隔
    const refreshInterval = getRefreshIntervalForPeriod(currentPeriod);
    
    // 如果间隔为 0，表示不需要自动刷新（如周K线）
    if (refreshInterval === 0) {
      Logger.info(LogModule.STOCK, '[ChartContainer] 当前周期不需要自动刷新', {
        symbol,
        period: currentPeriod,
      });
      return;
    }

    Logger.info(LogModule.STOCK, '[ChartContainer] 启动智能刷新', {
      symbol,
      period: currentPeriod,
      interval: `${refreshInterval / 1000 / 60}分钟`,
    });

    // 设置定时器
    const timer = setInterval(() => {
      Logger.info(LogModule.STOCK, '[ChartContainer] 🔄 执行定时刷新', {
        symbol,
        period: currentPeriod,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 静默刷新（不触发 loading 状态）
      silentRefreshHistory(symbol, exchange, currentPeriod);
    }, refreshInterval);

    // 清理函数：组件卸载或周期切换时清除定时器
    return () => {
      Logger.info(LogModule.STOCK, '[ChartContainer] 清除定时器', {
        symbol,
        period: currentPeriod,
      });
      clearInterval(timer);
    };
  }, [symbol, exchange, currentPeriod, silentRefreshHistory]);

  return (
    <View style={styles.container}>
      {/* 小窗口：面积图 */}
      <SimpleAreaChart
        data={areaChartData}
        candles={candles} // ✅ 传递完整K线数据（任务3.2）
        timeframe={timeframe} // ✅ 传递timeframe（任务3.2）
        quote={quote}
        height={height}
        isLoading={isLoading}
        symbol={symbol}
        currency={currency}
        backgroundColor="transparent"
        onFullscreenRequest={externalFullscreenControl ? undefined : handleFullscreenRequest}
        showFullscreenButton={!externalFullscreenControl}
        period={selectedPeriod}
        pricescale={pricescale}
        openPrice={openPrice} // 🎯 方案A：开盘价基准线
        isPositive={isPositive} // 🎯 方案A：最新价格点颜色
      />

      {/* 时间选择器 */}
      {showTimeSelector && (
        <TimePeriodSelector
          selectedPeriod={currentPeriod}
          onPeriodChange={handlePeriodChange}
          fullscreen={false}
          disabled={isLoading}
        />
      )}

      {/* 全屏：蜡烛图（仅在非外部控制时显示） */}
      {!externalFullscreenControl && isFullscreen && (
        <AdvancedCandlestickChart
          candles={candles}
          isLoading={isLoading}
          symbol={symbol}
          currency={currency}
          onClose={handleFullscreenClose}
          onPeriodChange={handlePeriodChange}
          selectedPeriod={currentPeriod}
          showVolume={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});

