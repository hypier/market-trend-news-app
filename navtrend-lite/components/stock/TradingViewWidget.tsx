/**
 * TradingView 图表组件 (React Native 版本)
 * 
 * 基于 TradingView 的高级图表组件，适用于 React Native WebView
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  // Dimensions, // 暂未使用
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { WebView } from 'react-native-webview';
import { Logger, LogModule } from '@/utils/logger';

// const { width: screenWidth } = Dimensions.get('window'); // 暂未使用

interface TradingViewWidgetProps {
  /** 股票代码 */
  symbol: string;
  /** 图表高度 */
  height?: number;
  /** 时间间隔 */
  interval?: string;
  /** 主题 */
  theme?: 'light' | 'dark';
  /** 是否显示时间选择器 */
  showTimeSelector?: boolean;
}

const TIME_PERIODS = [
  { label: '1D', value: '1D' },
  { label: '5D', value: '5D' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: '3Y', value: '3Y' },
];

export function TradingViewWidget({
  symbol,
  height = 400,
  interval = '1D',
  theme = 'light',
  showTimeSelector = true,
}: TradingViewWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('1D');
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // 生成简化的 TradingView 图表 HTML
  const generateTradingViewHTML = useCallback(() => {
    // 确保股票代码格式正确
    const formattedSymbol = symbol.includes(':') ? symbol : `NASDAQ:${symbol}`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TradingView Chart</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
        }
        .tradingview-widget-container {
            height: 100%;
            width: 100%;
            position: relative;
        }
        .error-message {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            font-size: 16px;
            color: MarketNewsBrand.colors.text.secondary;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <div class="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span class="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>

    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js" async>
    {
      "symbols": [
        [
          "${formattedSymbol}",
          "${formattedSymbol}|${selectedPeriod}"
        ]
      ],
      "chartOnly": false,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "colorTheme": "${theme}",
      "autosize": true,
      "showVolume": false,
      "showMA": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartType": "area",
      "maLineColor": "#2962FF",
      "maLineWidth": 1,
      "maLength": 9,
      "headerFontSize": "medium",
      "lineWidth": 2,
      "lineType": 0,
      "dateRanges": [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M"
      ]
    }
    </script>

    <script>
        // Loading TradingView
        
        // 简单的加载完成通知
        setTimeout(function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'loaded',
                    symbol: '${formattedSymbol}'
                }));
            }
        }, 3000);
        
        // 错误处理
        window.addEventListener('error', function(e) {
            Logger.error(LogModule.STOCK, 'Error:', e.message);
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: e.message
                }));
            }
        });
    </script>
</body>
</html>
    `;
  }, [symbol, theme, selectedPeriod]);

  // 处理 WebView 消息
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
              // WebView消息处理
      
      if (message.type === 'loaded') {
        setIsLoading(false);
      } else if (message.type === 'error') {
        Logger.error(LogModule.STOCK, 'Chart error:', message.message);
        setIsLoading(false);
      }
    } catch (error) {
      Logger.error(LogModule.STOCK, 'Failed to parse message:', error);
    }
  }, []);

  // 处理时间周期切换
  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
    setIsLoading(true);
    
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* 时间周期选择器 */}
      {showTimeSelector && (
        <View style={styles.periodSelector}>
          {TIME_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.label && styles.activePeriod
              ]}
              onPress={() => handlePeriodChange(period.value)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.label && styles.activePeriodText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 图表容器 */}
      <View style={[styles.chartContainer, { height }]}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
            <Text style={styles.loadingText}>加载图表中...</Text>
            <Text style={styles.debugText}>{symbol} • {selectedPeriod}</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: generateTradingViewHTML() }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mixedContentMode="compatibility"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => {
            // 10秒超时
            setTimeout(() => {
              if (isLoading) {
                setIsLoading(false);
              }
            }, 10000);
          }}
          onError={(e) => {
            Logger.error(LogModule.STOCK, 'WebView error:', e.nativeEvent);
            setIsLoading(false);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activePeriod: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
  },
  periodText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: '500',
  },
  activePeriodText: {
    color: '#fff',
  },
  chartContainer: {
    position: 'relative',
    backgroundColor: '#f8f8f8',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
  },
  debugText: {
    marginTop: 8,
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
  },
});