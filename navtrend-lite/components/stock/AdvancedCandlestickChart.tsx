/**
 * 高级蜡烛图组件
 * 
 * 用于全屏模式的专业K线图表分析
 * 支持蜡烛图 + 成交量显示
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { generateCandlestickChartHTML } from '@/services/chart/chartHTMLGenerator';
import { TimePeriodSelector } from './TimePeriodSelector';
import { Logger, LogModule } from '@/utils/logger';
import type { TradingViewCandle } from '@/types/tradingview';
import { getDeviceTimezone } from '@/utils/localeUtils';

// 可选导入 NavigationBar（需要 prebuild）
let NavigationBar: any = null;
// eslint-disable-next-line
try { NavigationBar = require('expo-navigation-bar'); } catch {}

interface AdvancedCandlestickChartProps {
  /** 蜡烛图数据 */
  candles: TradingViewCandle[];
  /** 加载状态 */
  isLoading?: boolean;
  /** 股票代码 */
  symbol?: string;
  /** 股票名称/描述 */
  name?: string;
  /** 交易所 */
  exchange?: string;
  /** 货币符号 */
  currency?: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 周期切换回调 */
  onPeriodChange?: (period: string) => void;
  /** 当前选中周期 */
  selectedPeriod?: string;
  /** 是否显示成交量 */
  showVolume?: boolean;
  /** 价格精度（pricescale），如 10000 表示 4 位小数 */
  pricescale?: number;
}

const DEFAULT_COLORS = {
  upColor: '#26a69a',
  downColor: '#ef5350',
};

export function AdvancedCandlestickChart({
  candles,
  isLoading = false,
  symbol = '',
  name = '',
  exchange = '',
  currency = 'USD',
  onClose,
  onPeriodChange,
  selectedPeriod = '1day',
  showVolume = true,
  pricescale = 100,
}: AdvancedCandlestickChartProps) {
  const webViewRef = useRef<WebView>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isOrientationReady, setIsOrientationReady] = useState(false);
  const previousPeriodRef = useRef<string>(selectedPeriod); // 记录上次的周期

  // 全屏模式使用横屏高度（确保宽 > 高）
  const chartHeight = useMemo(() => {
    return screenWidth > screenHeight ? screenHeight : screenWidth;
  }, [screenWidth, screenHeight]);

  // 进入全屏时锁定横屏
  useEffect(() => {
    const handleOrientation = async () => {
      try {
        Logger.info(LogModule.STOCK, '[CandlestickChart] 开始横屏切换', { 
          width: screenWidth, 
          height: screenHeight 
        });

        // 强制锁定为横屏
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
        );

        // 隐藏安卓导航栏
        if (NavigationBar) {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
          } catch (navError) {
            Logger.warn(LogModule.STOCK, '[CandlestickChart] 导航栏隐藏失败', navError);
          }
        }

        // 等待屏幕旋转完成（分阶段重试确保正确的尺寸）
        const timers = [
          setTimeout(() => setIsOrientationReady(true), 100),
          setTimeout(() => {
            if (webViewRef.current) {
              const currentWidth = screenWidth > screenHeight ? screenWidth : screenHeight;
              const currentHeight = screenWidth > screenHeight ? screenHeight : screenWidth;
              
              Logger.info(LogModule.STOCK, '[CandlestickChart] Resize (500ms)', { 
                width: currentWidth, 
                height: currentHeight 
              });
              
              webViewRef.current.postMessage(
                JSON.stringify({
                  type: 'resize',
                  width: currentWidth,
                  height: currentHeight,
                })
              );
            }
          }, 500),
          // 再次重试确保尺寸正确
          setTimeout(() => {
            if (webViewRef.current) {
              const currentWidth = screenWidth > screenHeight ? screenWidth : screenHeight;
              const currentHeight = screenWidth > screenHeight ? screenHeight : screenWidth;
              
              Logger.info(LogModule.STOCK, '[CandlestickChart] Resize (800ms)', { 
                width: currentWidth, 
                height: currentHeight 
              });
              
              webViewRef.current.postMessage(
                JSON.stringify({
                  type: 'resize',
                  width: currentWidth,
                  height: currentHeight,
                })
              );
            }
          }, 800),
        ];

        return () => timers.forEach(clearTimeout);
      } catch (error) {
        Logger.warn(LogModule.STOCK, '[CandlestickChart] 屏幕方向控制失败', error);
      }
    };

    handleOrientation();

    // 清理：恢复竖屏
    return () => {
      setIsOrientationReady(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
        () => {}
      );

      // 恢复导航栏
      if (NavigationBar) {
        NavigationBar.setVisibilityAsync('visible').catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在挂载时执行一次，不依赖 screenWidth/screenHeight（避免重复旋转）

  // 获取设备时区
  const deviceTimezone = useMemo(() => {
    const timezone = getDeviceTimezone();
    Logger.debug(LogModule.STOCK, '[AdvancedCandlestickChart] Using timezone:', timezone);
    return timezone;
  }, []);

  // 🔥 关键：检测周期变化
  useEffect(() => {
    if (previousPeriodRef.current !== selectedPeriod) {
      Logger.info(LogModule.STOCK, '[AdvancedCandlestickChart] 周期变化', {
        from: previousPeriodRef.current,
        to: selectedPeriod,
        candlesCount: candles.length,
      });
      previousPeriodRef.current = selectedPeriod;
    }
  }, [selectedPeriod, candles.length]);

  // 生成蜡烛图 HTML
  const chartHTML = useMemo(() => {
    if (!candles || candles.length === 0) return '';

    return generateCandlestickChartHTML({
      candles,
      height: chartHeight,
      colors: DEFAULT_COLORS,
      currency,
      showVolume,
      backgroundColor: '#000000',
      timezone: deviceTimezone,
      period: selectedPeriod,
      pricescale,
    });
  }, [candles, chartHeight, currency, showVolume, deviceTimezone, selectedPeriod, pricescale]);

  // 处理 WebView 消息
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'chartLoaded':
          Logger.info(LogModule.STOCK, '[CandlestickChart] Chart loaded');
          break;

        case 'chartError':
          Logger.error(LogModule.STOCK, '[CandlestickChart] Chart error:', message.error);
          break;
      }
    } catch (error) {
      Logger.error(LogModule.STOCK, '[CandlestickChart] Message parse error:', error);
    }
  }, []);

  // 周期切换处理
  const handlePeriodChange = useCallback(
    (period: string) => {
      Logger.info(LogModule.STOCK, '[CandlestickChart] 切换周期', { symbol, period });
      onPeriodChange?.(period);
    },
    [symbol, onPeriodChange]
  );

  // 监听屏幕尺寸变化（响应式调整）
  useEffect(() => {
    if (!isOrientationReady || !webViewRef.current) return;
    
    // 确保使用横屏尺寸（宽 > 高）
    const currentWidth = screenWidth > screenHeight ? screenWidth : screenHeight;
    const currentHeight = screenWidth > screenHeight ? screenHeight : screenWidth;
    
    Logger.info(LogModule.STOCK, '[CandlestickChart] 尺寸变化', { 
      width: currentWidth, 
      height: currentHeight,
      raw: { screenWidth, screenHeight }
    });
    
    webViewRef.current.postMessage(
      JSON.stringify({
        type: 'resize',
        width: currentWidth,
        height: currentHeight,
      })
    );
  }, [screenWidth, screenHeight, isOrientationReady]);

  // 无数据状态（在Modal内显示）
  if (!candles || candles.length === 0) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        statusBarTranslucent={true}
        presentationStyle="fullScreen"
      >
        <StatusBar hidden translucent backgroundColor="transparent" />
        <View style={styles.fullscreenContainer}>
          <View style={styles.fullscreenChartContainer}>
            <View style={styles.emptyContainer}>
              <Ionicons name="bar-chart-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
              <View style={styles.emptyTextContainer}>
                <View style={styles.emptyTitleRow}>
                  <Ionicons name="information-circle-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.emptyTitleText}>暂无K线数据</Text>
                </View>
                {symbol && <Text style={styles.emptySubtext}>{symbol} - 正在加载数据...</Text>}
              </View>
            </View>
            
            {/* 左上角股票信息 */}
            {(symbol || name || exchange) && (
              <View style={styles.stockInfo}>
                {(symbol || exchange) && (
                  <View style={styles.stockSymbolRow}>
                    {symbol && (
                      <Text style={styles.stockSymbol}>{symbol}</Text>
                    )}
                    {symbol && exchange && (
                      <Text style={styles.stockSeparator}>·</Text>
                    )}
                    {exchange && (
                      <Text style={styles.stockExchange}>{exchange}</Text>
                    )}
                  </View>
                )}
                {name && (
                  <Text style={styles.stockName} numberOfLines={1}>{name}</Text>
                )}
              </View>
            )}
          </View>

          {/* 右侧控制栏 */}
          <View style={styles.rightSidebar}>
            {/* 关闭按钮（顶部） */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>

            {/* 时间选择器（垂直布局） */}
            <View style={styles.sidebarPeriodSelector}>
              <TimePeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={handlePeriodChange}
                fullscreen={true}
                vertical={true}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <StatusBar hidden translucent backgroundColor="transparent" />
      <View style={styles.fullscreenContainer}>
        {/* 全屏图表 */}
        <View style={styles.fullscreenChartContainer}>
          <WebView
            key={`candlestick-${selectedPeriod}-${candles.length}`} // 🔥 关键：周期或数据变化时重新创建 WebView
            ref={webViewRef}
            source={{ html: chartHTML }}
            style={styles.fullscreenWebView}
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
              Logger.error(LogModule.STOCK, '[CandlestickChart] WebView error:', error)
            }
          />
          
          {/* 左上角股票信息 */}
          {(symbol || name || exchange) && (
            <View style={styles.stockInfo}>
              {(symbol || exchange) && (
                <View style={styles.stockSymbolRow}>
                  {symbol && (
                    <Text style={styles.stockSymbol}>{symbol}</Text>
                  )}
                  {symbol && exchange && (
                    <Text style={styles.stockSeparator}>·</Text>
                  )}
                  {exchange && (
                    <Text style={styles.stockExchange}>{exchange}</Text>
                  )}
                </View>
              )}
              {name && (
                <Text style={styles.stockName} numberOfLines={1}>{name}</Text>
              )}
            </View>
          )}
        </View>

        {/* 右侧控制栏 */}
        <View style={styles.rightSidebar}>
          {/* 关闭按钮（顶部） */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="rgba(255, 255, 255, 0.9)" />
          </TouchableOpacity>

          {/* 时间选择器（垂直布局） */}
          <View style={styles.sidebarPeriodSelector}>
            <TimePeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              fullscreen={true}
              vertical={true}
              disabled={isLoading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    flexDirection: 'row', // 横向布局：图表在左，控制栏在右
  },
  fullscreenChartContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenWebView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // 右侧控制栏
  rightSidebar: {
    width: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'column',
    paddingTop: 12,
    paddingBottom: 12,
  },
  closeButton: {
    alignSelf: 'center',
    padding: 8,
    marginBottom: 12,
  },
  sidebarPeriodSelector: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTextContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  emptyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitleText: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptySubtext: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // 左上角股票信息
  stockInfo: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: 300,
    zIndex: 10,
  },
  stockSymbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  stockSymbol: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  stockSeparator: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  stockName: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  stockExchange: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
});

