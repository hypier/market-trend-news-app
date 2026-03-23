/**
 * 图表 HTML 生成器
 * 
 * 为 Lightweight Charts 生成 HTML 内容
 * 支持面积图和蜡烛图两种模式
 */

import type { TradingViewCandle } from '@/types/tradingview';

/**
 * 面积图配置
 */
export interface AreaChartConfig {
  /** 时间序列数据 */
  data: { time: number; value: number }[];
  /** 图表高度 */
  height: number;
  /** 颜色配置 */
  colors: {
    line: string;
    topColor: string;
    bottomColor: string;
  };
  /** 货币符号 */
  currency: string;
  /** 背景颜色 */
  backgroundColor: string;
  /** 时区（IANA 格式，如 'Asia/Shanghai'） */
  timezone?: string;
  /** 时间周期（用于智能显示横坐标格式） */
  period?: string;
  /** 价格精度（pricescale），如 10000 表示 4 位小数 */
  pricescale?: number;
  /** 开盘价（用于基准线） */
  openPrice?: number;
  /** 是否为上涨（用于最新价格点颜色） */
  isPositive?: boolean;
}

/**
 * 蜡烛图配置
 */
export interface CandlestickChartConfig {
  /** 蜡烛图数据 */
  candles: TradingViewCandle[];
  /** 图表高度 */
  height: number;
  /** 颜色配置 */
  colors: {
    upColor: string;
    downColor: string;
  };
  /** 货币符号 */
  currency: string;
  /** 是否显示成交量 */
  showVolume: boolean;
  /** 背景颜色 */
  backgroundColor: string;
  /** 时区（IANA 格式，如 'Asia/Shanghai'） */
  timezone?: string;
  /** 时间周期（用于智能显示横坐标格式） */
  period?: string;
  /** 价格精度（pricescale），如 10000 表示 4 位小数 */
  pricescale?: number;
}

/**
 * 生成面积图 HTML
 */
export function generateAreaChartHTML(config: AreaChartConfig): string {
  const { 
    data, 
    height, 
    colors, 
    currency, 
    backgroundColor, 
    timezone = 'UTC', 
    period = '1day', 
    pricescale = 100,
    openPrice
  } = config;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Area Chart</title>
    <script src="https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${backgroundColor};
            overflow: hidden;
            -webkit-tap-highlight-color: transparent;
        }
        #chartContainer {
            width: 100%;
            height: ${height}px;
            background: ${backgroundColor};
            position: relative;
        }
        #priceTooltip {
            position: absolute;
            display: none;
            background: rgba(0, 0, 0, 0.85);
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transform: translate(-50%, -100%);
            margin-top: -8px;
        }
    </style>
</head>
<body>
    <div id="chartContainer"></div>
    <div id="priceTooltip"></div>

    <script>
        try {
            const container = document.getElementById('chartContainer');
            const priceTooltip = document.getElementById('priceTooltip');
            
            // 价格格式化函数（与 formatPriceWithPricescale 保持一致）
            function formatPrice(price, pricescale) {
              if (typeof price !== 'number' || isNaN(price)) {
                price = 0;
              }
              
              // 计算原始小数位数
              let rawDecimals = 2;
              if (typeof pricescale === 'number' && pricescale > 0 && isFinite(pricescale)) {
                rawDecimals = Math.max(0, Math.floor(Math.log10(pricescale)));
              }
              
              // 判断是否需要科学计数法
              const testFixed = price.toFixed(8);
              const needsScientific = testFixed.includes('e') || (price !== 0 && Math.abs(price) < 0.00000001);
              
              if (needsScientific) {
                const scientificNotation = price.toExponential(4);
                return scientificNotation.replace(/\\.?0+e/, 'e').replace(/(\\.\\d*?)0+e/, '$1e');
              }
              
              // 普通格式，最多 8 位小数
              const decimals = Math.min(rawDecimals, 8);
              const formattedPrice = price.toFixed(decimals);
              
              // 去除末尾的零
              return formattedPrice.replace(/(\\.[0-9]*?)0+$/, '$1').replace(/\\.$/, '');
            }
            
            const chart = LightweightCharts.createChart(container, {
                width: container.clientWidth,
                height: ${height},
                layout: {
                    background: { 
                        type: 'solid',
                        color: '${backgroundColor}' 
                    },
                    textColor: 'rgba(255, 255, 255, 0.7)',
                    fontSize: 11,
                },
                grid: {
                    vertLines: { 
                        color: 'rgba(255, 255, 255, 0.05)',
                        visible: true
                    },
                    horzLines: { 
                        color: 'rgba(255, 255, 255, 0.05)',
                        visible: true
                    },
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
                    vertLine: {
                        width: 1,
                        color: 'rgba(255, 255, 255, 0.3)',
                        style: LightweightCharts.LineStyle.Dashed,
                    },
                    horzLine: {
                        width: 1,
                        color: 'rgba(255, 255, 255, 0.3)',
                        style: LightweightCharts.LineStyle.Dashed,
                    },
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    // 使用自定义价格格式化器
                    mode: LightweightCharts.PriceScaleMode.Normal,
                },
                localization: {
                    priceFormatter: (price) => formatPrice(price, ${pricescale}),
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                    tickMarkFormatter: (time) => {
                        const date = new Date(time * 1000);
                        const period = '${period}';
                        
                        // 根据周期决定显示格式
                        if (period === '1week' || period === '1W') {
                            // 周：显示 月-日 (Dec 29)
                            return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                timeZone: '${timezone}'
                            });
                        } else if (period === '1month' || period === '3month' || period === '6month' || 
                                   period === '1M' || period === '3M' || period === '6M') {
                            // 月：显示 月-日 (Dec 29)
                            return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                timeZone: '${timezone}'
                            });
                        } else if (period === '1year' || period === '3year' || period === '1Y' || period === '3Y') {
                            // 年：显示 月份 (Dec 2024)
                            return date.toLocaleDateString('en-US', { 
                                month: 'short',
                                year: 'numeric',
                                timeZone: '${timezone}'
                            });
                        } else {
                            // 3H, 1D：显示时间 (15:30)
                            return date.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false,
                                timeZone: '${timezone}'
                            });
                        }
                    },
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: false,
                },
                handleScale: {
                    axisPressedMouseMove: true,
                    mouseWheel: true,
                    pinch: true,
                },
            });

            const series = chart.addAreaSeries({
                topColor: '${colors.topColor}',
                bottomColor: '${colors.bottomColor}',
                lineColor: '${colors.line}',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: true,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
            });

            const initialData = ${JSON.stringify(data)};
            series.setData(initialData);
            
            // 🎯 方案A：添加最新价格点标记
            if (initialData.length > 0) {
                const lastPoint = initialData[initialData.length - 1];
                const markerColor = '#FFFFFF'; // NavTrend品牌色（涨绿跌红）
                
                series.setMarkers([{
                    time: lastPoint.time,
                    position: 'inBar',
                    color: markerColor,
                    shape: 'circle',
                    size: 1,
                }]);
            }
            
            // 🎯 方案A：添加开盘价基准线
            ${openPrice !== undefined && openPrice !== null ? `
            const openPriceLine = series.createPriceLine({
                price: ${openPrice},
                color: 'rgba(255, 255, 255, 0.35)',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: 'Open',
            });
            ` : ''}
            
            chart.timeScale().fitContent();

            const resizeObserver = new ResizeObserver(entries => {
                if (entries.length === 0 || entries[0].target !== container) return;
                const newRect = entries[0].contentRect;
                chart.resize(newRect.width, newRect.height);
            });
            resizeObserver.observe(container);

            chart.subscribeCrosshairMove((param) => {
                if (!param.point || !param.time || param.seriesData.size === 0) {
                    priceTooltip.style.display = 'none';
                    return;
                }
                
                const data = param.seriesData.get(series);
                if (data && data.value !== undefined) {
                    const price = data.value;
                    const formattedPrice = formatPrice(price, ${pricescale});
                    
                    // 使用指定时区格式化时间
                    const date = new Date(param.time * 1000);
                    const timeStr = date.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: '${timezone}'
                    });
                    
                    priceTooltip.textContent = \`${currency} \${formattedPrice} (\${timeStr})\`;
                    priceTooltip.style.display = 'block';
                    
                    let x = param.point.x;
                    let y = param.point.y;
                    
                    const tooltipRect = priceTooltip.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    const tooltipHalfWidth = tooltipRect.width / 2;
                    if (x - tooltipHalfWidth < 0) {
                        x = tooltipHalfWidth;
                    } else if (x + tooltipHalfWidth > containerRect.width) {
                        x = containerRect.width - tooltipHalfWidth;
                    }
                    
                    priceTooltip.style.left = x + 'px';
                    priceTooltip.style.top = y + 'px';
                }
            });

            window.addEventListener('message', function(event) {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'setData' && message.data) {
                        series.setData(message.data);
                        chart.timeScale().fitContent();
                    } else if (message.type === 'appendData' && message.data) {
                        message.data.forEach(point => series.update(point));
                    } else if (message.type === 'updateLastPoint' && message.time && message.value) {
                        series.update({ time: message.time, value: message.value });
                    } else if (message.type === 'resize' && message.width && message.height) {
                        chart.resize(message.width, message.height);
                        chart.timeScale().fitContent();
                    }
                } catch (error) {
                    console.error('[Area Chart] Message error:', error);
                }
            });

            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'chartLoaded',
                    chartType: 'area'
                }));
            }

        } catch (error) {
            console.error('[Area Chart] Init error:', error);
            document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">' +
                '<h3>图表加载失败</h3>' +
                '<p style="color: rgba(255,255,255,0.7); font-size: 14px;">' + error.message + '</p></div>';
        }
    </script>
</body>
</html>
  `;
}

/**
 * 生成蜡烛图 HTML
 */
export function generateCandlestickChartHTML(config: CandlestickChartConfig): string {
  const { candles, height, colors, currency, showVolume, backgroundColor, timezone = 'UTC', period = '1day', pricescale = 100 } = config;

  // 转换数据格式：max/min → high/low
  const candleData = candles.map(c => ({
    time: c.time,
    open: c.open,
    high: c.max,
    low: c.min,
    close: c.close,
  }));

  const volumeData = showVolume
    ? candles
        .filter(c => c.volume && c.volume > 0) // 过滤掉无效的成交量数据
        .map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? colors.upColor : colors.downColor,
        }))
    : [];
  
  // 检查是否有有效的成交量数据
  const hasValidVolume = volumeData.length > 0;
  const effectiveShowVolume = showVolume && hasValidVolume;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Candlestick Chart</title>
    <script src="https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${backgroundColor};
            overflow: hidden;
            -webkit-tap-highlight-color: transparent;
        }
        #chartContainer {
            width: 100%;
            height: ${height}px;
            background: ${backgroundColor};
            position: relative;
        }
        #infoTooltip {
            position: absolute;
            display: none;
            background: rgba(0, 0, 0, 0.9);
            color: #ffffff;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            pointer-events: none;
            z-index: 1000;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            max-width: 250px;
        }
        .tooltip-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
        }
        .tooltip-label {
            color: rgba(255, 255, 255, 0.7);
            margin-right: 12px;
        }
        .tooltip-value {
            font-weight: 600;
        }
        .tooltip-positive {
            color: ${colors.upColor};
        }
        .tooltip-negative {
            color: ${colors.downColor};
        }
    </style>
</head>
<body>
    <div id="chartContainer"></div>
    <div id="infoTooltip"></div>

    <script>
        try {
            const container = document.getElementById('chartContainer');
            const infoTooltip = document.getElementById('infoTooltip');
            
            // 价格格式化函数（与 formatPriceWithPricescale 保持一致）
            function formatPrice(price, pricescale) {
              if (typeof price !== 'number' || isNaN(price)) {
                price = 0;
              }
              
              // 计算原始小数位数
              let rawDecimals = 2;
              if (typeof pricescale === 'number' && pricescale > 0 && isFinite(pricescale)) {
                rawDecimals = Math.max(0, Math.floor(Math.log10(pricescale)));
              }
              
              // 判断是否需要科学计数法
              const testFixed = price.toFixed(8);
              const needsScientific = testFixed.includes('e') || (price !== 0 && Math.abs(price) < 0.00000001);
              
              if (needsScientific) {
                const scientificNotation = price.toExponential(4);
                return scientificNotation.replace(/\\.?0+e/, 'e').replace(/(\\.\\d*?)0+e/, '$1e');
              }
              
              // 普通格式，最多 8 位小数
              const decimals = Math.min(rawDecimals, 8);
              const formattedPrice = price.toFixed(decimals);
              
              // 去除末尾的零
              return formattedPrice.replace(/(\\.[0-9]*?)0+$/, '$1').replace(/\\.$/, '');
            }
            
            const chartHeight = ${effectiveShowVolume ? height * 0.75 : height};
            const volumeHeight = ${effectiveShowVolume ? height * 0.25 : 0};
            
            const chart = LightweightCharts.createChart(container, {
                width: container.clientWidth,
                height: ${height},
                layout: {
                    background: { 
                        type: 'solid',
                        color: '${backgroundColor}' 
                    },
                    textColor: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 12,
                },
                grid: {
                    vertLines: { 
                        color: 'rgba(255, 255, 255, 0.08)',
                        visible: true
                    },
                    horzLines: { 
                        color: 'rgba(255, 255, 255, 0.08)',
                        visible: true
                    },
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
                    vertLine: {
                        width: 1,
                        color: 'rgba(255, 255, 255, 0.4)',
                        style: LightweightCharts.LineStyle.Dashed,
                    },
                    horzLine: {
                        width: 1,
                        color: 'rgba(255, 255, 255, 0.4)',
                        style: LightweightCharts.LineStyle.Dashed,
                    },
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    scaleMargins: {
                        top: 0.1,
                        bottom: ${effectiveShowVolume ? 0.3 : 0.1},
                    },
                    // 使用自定义价格格式化器
                    mode: LightweightCharts.PriceScaleMode.Normal,
                },
                localization: {
                    priceFormatter: (price) => formatPrice(price, ${pricescale}),
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                    tickMarkFormatter: (time) => {
                        const date = new Date(time * 1000);
                        const period = '${period}';
                        
                        // 根据周期决定显示格式
                        if (period === '1week' || period === '1W') {
                            // 周：显示 月-日 (Dec 29)
                            return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                timeZone: '${timezone}'
                            });
                        } else if (period === '1month' || period === '3month' || period === '6month' || 
                                   period === '1M' || period === '3M' || period === '6M') {
                            // 月：显示 月-日 (Dec 29)
                            return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                timeZone: '${timezone}'
                            });
                        } else if (period === '1year' || period === '3year' || period === '1Y' || period === '3Y') {
                            // 年：显示 月份 (Dec 2024)
                            return date.toLocaleDateString('en-US', { 
                                month: 'short',
                                year: 'numeric',
                                timeZone: '${timezone}'
                            });
                        } else {
                            // 3H, 1D：显示时间 (15:30)
                            return date.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false,
                                timeZone: '${timezone}'
                            });
                        }
                    },
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: false,
                },
                handleScale: {
                    axisPressedMouseMove: true,
                    mouseWheel: true,
                    pinch: true,
                },
            });

            const candleSeries = chart.addCandlestickSeries({
                upColor: '${colors.upColor}',
                downColor: '${colors.downColor}',
                borderVisible: true,
                wickUpColor: '${colors.upColor}',
                wickDownColor: '${colors.downColor}',
                borderUpColor: '${colors.upColor}',
                borderDownColor: '${colors.downColor}',
            });

            candleSeries.setData(${JSON.stringify(candleData)});

            ${effectiveShowVolume ? `
            const volumeSeries = chart.addHistogramSeries({
                color: '${colors.upColor}',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: 'volume',
                scaleMargins: {
                    top: 0.7,
                    bottom: 0,
                },
            });

            chart.priceScale('volume').applyOptions({
                scaleMargins: {
                    top: 0.7,
                    bottom: 0,
                },
            });

            volumeSeries.setData(${JSON.stringify(volumeData)});
            ` : ''}

            chart.timeScale().fitContent();

            const resizeObserver = new ResizeObserver(entries => {
                if (entries.length === 0 || entries[0].target !== container) return;
                const newRect = entries[0].contentRect;
                chart.resize(newRect.width, newRect.height);
            });
            resizeObserver.observe(container);

            chart.subscribeCrosshairMove((param) => {
                if (!param.point || !param.time || param.seriesData.size === 0) {
                    infoTooltip.style.display = 'none';
                    return;
                }
                
                const candleData = param.seriesData.get(candleSeries);
                ${effectiveShowVolume ? 'const volumeData = param.seriesData.get(volumeSeries);' : ''}
                
                if (candleData) {
                    const date = new Date(candleData.time * 1000);
                    const dateStr = date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        timeZone: '${timezone}'
                    });
                    const timeStr = date.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: '${timezone}'
                    });
                    
                    const change = candleData.close - candleData.open;
                    const changePercent = (change / candleData.open * 100).toFixed(2);
                    const isPositive = change >= 0;
                    const changeClass = isPositive ? 'tooltip-positive' : 'tooltip-negative';
                    
                    const formattedOpen = formatPrice(candleData.open, ${pricescale});
                    const formattedHigh = formatPrice(candleData.high, ${pricescale});
                    const formattedLow = formatPrice(candleData.low, ${pricescale});
                    const formattedClose = formatPrice(candleData.close, ${pricescale});
                    const formattedChange = formatPrice(change, ${pricescale});
                    
                    let html = \`
                        <div style="margin-bottom: 8px; font-weight: 600;">\${dateStr} \${timeStr}</div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">O:</span>
                            <span class="tooltip-value">${currency} \${formattedOpen}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">H:</span>
                            <span class="tooltip-value">${currency} \${formattedHigh}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">L:</span>
                            <span class="tooltip-value">${currency} \${formattedLow}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">C:</span>
                            <span class="tooltip-value">${currency} \${formattedClose}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Change:</span>
                            <span class="tooltip-value \${changeClass}">\${isPositive ? '+' : ''}\${formattedChange} (\${changePercent}%)</span>
                        </div>
                    \`;
                    
                    ${effectiveShowVolume ? `
                    if (volumeData) {
                        html += \`
                            <div class="tooltip-row">
                                <span class="tooltip-label">Vol:</span>
                                <span class="tooltip-value">\${volumeData.value.toLocaleString()}</span>
                            </div>
                        \`;
                    }
                    ` : ''}
                    
                    infoTooltip.innerHTML = html;
                    infoTooltip.style.display = 'block';
                    
                    let x = param.point.x + 15;
                    let y = param.point.y + 15;
                    
                    const tooltipRect = infoTooltip.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    if (x + tooltipRect.width > containerRect.width) {
                        x = param.point.x - tooltipRect.width - 15;
                    }
                    
                    if (y + tooltipRect.height > containerRect.height) {
                        y = param.point.y - tooltipRect.height - 15;
                    }
                    
                    infoTooltip.style.left = x + 'px';
                    infoTooltip.style.top = y + 'px';
                }
            });

            window.addEventListener('message', function(event) {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'resize' && message.width && message.height) {
                        chart.resize(message.width, message.height);
                        chart.timeScale().fitContent();
                    }
                } catch (error) {
                    console.error('[Candlestick Chart] Message error:', error);
                }
            });

            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'chartLoaded',
                    chartType: 'candlestick'
                }));
            }

        } catch (error) {
            console.error('[Candlestick Chart] Init error:', error);
            document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">' +
                '<h3>图表加载失败</h3>' +
                '<p style="color: rgba(255,255,255,0.7); font-size: 14px;">' + error.message + '</p></div>';
        }
    </script>
</body>
</html>
  `;
}

