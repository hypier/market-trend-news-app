/**
 * 持仓管理页面 - 重构版：直接Store调用
 * 
 * 功能：
 * - 显示股票基本信息
 * - 支持增持和减持操作
 * - 输入持仓数量和平均成本
 * - 计算总成本/总收益
 * - 表单验证
 * - 提交持仓数据
 * 
 * @author MarketNews Team
 * @version 2.0.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWealthStore, useAuthStore, useSettingsStore, useExchangeRateStore, useTradingViewStore, useStockDetailStore } from '@/stores';
import { toTradingViewSymbol } from '@/services/chart/tradingViewAdapter';
import { StockInfoCard, OperationTypeToggle, PositionFormInputs } from '@/components/position';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';
import { parseSymbol } from '@/helpers/symbolUtils';

// 操作类型
type OperationType = 'add' | 'reduce';

/**
 * 本地价格格式化函数（不使用科学计数法）
 * 
 * 用于持仓管理页面，因为需要编辑价格，不适合科学计数法显示
 * 
 * 特点：
 * - 最多 8 位小数（对应 API 最小精度 0.00000001）
 * - 不使用科学计数法（便于用户编辑）
 * - 自动去掉末尾的零
 * 
 * @param price 价格数值
 * @param pricescale 价格精度（如 100 = 2位小数，100000000 = 8位小数）
 * @returns 格式化的价格字符串
 */
function formatPriceForInput(price: number, pricescale: number = 100): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return '0';
  }

  // 计算小数位数
  let decimals = 2;
  if (typeof pricescale === 'number' && pricescale > 0 && isFinite(pricescale)) {
    decimals = Math.max(0, Math.floor(Math.log10(pricescale)));
  }

  // 限制最多8位小数（对应 API 最小精度）
  decimals = Math.min(decimals, 8);

  // 使用 toFixed 格式化（不使用科学计数法）
  const formattedPrice = price.toFixed(decimals);

  // 去掉末尾的零
  let cleaned = formattedPrice.replace(/\.(\d+?)0+$/, '.$1');
  cleaned = cleaned.replace(/\.$/, '');

  return cleaned;
}

export default function ManagePositionScreen() {
  const { t } = useTranslation();
  const { 
    logFirstAddPosition, 
    logAddBuyPosition, 
    logReducePosition 
  } = useAnalytics();
  const { symbol: routeParam, mode } = useLocalSearchParams<{ symbol: string; mode?: string }>();
  
  // 解码并解析symbol，处理复合格式（如 NASDAQ:AAPL）
  const decodedParam = routeParam ? decodeURIComponent(routeParam) : '';
  const { symbol, exchange } = parseSymbol(decodedParam);
  
  // 早期错误检查，防止 symbol 为 undefined 或空字符串
  const safeSymbol = useMemo(() => {
    try {
      if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
        return null;
      }
      return symbol.trim();
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, '处理symbol参数时出错:', error);
      return null;
    }
  }, [symbol]);

  const [operationType, setOperationType] = useState<OperationType>(mode === 'reduce' ? 'reduce' : 'add');
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [errors, setErrors] = useState<{ shares?: string; avgCost?: string }>({});
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [justCompletedOperation, setJustCompletedOperation] = useState(false);
  
  // 键盘状态
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
 
  // 持仓信息状态 - 使用简化的数据结构
  const [currentPosition, setCurrentPosition] = useState<any>(null);
  
  // 货币转换状态（直接调用 Service）
  const [convertedPrice, setConvertedPrice] = useState(0);
  const [convertedAvgCost, setConvertedAvgCost] = useState<number | undefined>(undefined);
  const [convertedTotalAmount, setConvertedTotalAmount] = useState<number | undefined>(undefined);
  
  // ===== 细粒度状态订阅 =====
  // 认证状态
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // 获取当前设置的货币
  const targetCurrency = useSettingsStore(state => state.currency) || 'USD';
  
  // 股票数据（使用本地状态）
  const [stockQuote, setStockQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  
  // 投资组合数据
  const isCreatingPosition = useWealthStore(state => state.isLoading.creating);
  const isUpdatingPosition = useWealthStore(state => state.isLoading.updating);
  const isLoadingHolding = useWealthStore(state => state.isLoading.holdingMarketData);
  
  // 汇率 Store
  const { convertCurrency } = useExchangeRateStore();
  
  // ===== 计算属性 =====
  const currentPrice = useMemo(() => {
    try {
      return stockQuote?.price || 0;
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '获取当前价格时出错:', error);
      return 0;
    }
  }, [stockQuote]);
  
  // 计算显示价格（转换后的价格或原始价格）
  const displayPrice = useMemo(() => {
    return targetCurrency === 'USD' ? currentPrice : convertedPrice;
  }, [targetCurrency, currentPrice, convertedPrice]);
  
  const stockName = useMemo(() => {
    try {
      return stockQuote?.name || safeSymbol || 'Unknown';
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '获取股票名称时出错:', error);
      return safeSymbol || 'Unknown';
    }
  }, [stockQuote, safeSymbol]);
  
  // 基于currentPosition的计算属性
  const position = useMemo(() => {
    try {
      if (!currentPosition) return null;
      
      // currentPosition 已经是 EnhancedPosition 格式
      return {
        id: currentPosition.id,
        symbol: currentPosition.symbol,
        exchange: currentPosition.exchange,
        quantity: currentPosition.quantity,
        averagePrice: currentPosition.averagePrice,
      };
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, '计算持仓信息时出错:', error);
      return null;
    }
  }, [currentPosition]);
  
  // 基于新position计算属性的hasPosition
  const hasPosition = useMemo(() => {
    try {
      return position !== null && typeof position === 'object' && typeof position.quantity === 'number' && position.quantity > 0;
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '检查持仓状态时出错:', error);
      return false;
    }
  }, [position]);
  
  const isLoading = useMemo(() => ({
    stock: isLoadingQuote,
    position: isLoadingHolding || isCreatingPosition || isUpdatingPosition,
    all: isLoadingQuote || isLoadingHolding || isCreatingPosition || isUpdatingPosition,
  }), [isLoadingQuote, isLoadingHolding, isCreatingPosition, isUpdatingPosition]);
  
  // 动态计算 KeyboardAvoidingView 的 behavior
  const keyboardBehavior = useMemo(() => {
    if (Platform.OS === 'ios') {
      return 'padding';
    }
    // Android: 键盘弹出时使用 'height'，否则使用 undefined
    return isKeyboardVisible ? 'height' : undefined;
  }, [isKeyboardVisible]);
  

  // 获取当前股票的持仓信息 - 使用简化的store方法
  const fetchCurrentPosition = useCallback(async () => {
    try {
      if (!safeSymbol || !exchange) return;

      // 使用新的简化方法获取持仓信息
      const position = await useWealthStore.getState().getStockPosition(safeSymbol, exchange);
      
      Logger.info(LogModule.PORTFOLIO, `获取持仓信息: ${safeSymbol}:${exchange}`, {
        hasPosition: !!position,
        quantity: position?.quantity
      });
      
      setCurrentPosition(position);
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '获取持仓数据失败:', error);
      setCurrentPosition(null);
    }
  }, [safeSymbol, exchange]);
  
  // 检查持仓限制 - 简化版本（移除广告相关逻辑）
  const checkPositionLimit = useCallback(async (): Promise<boolean> => {
    try {
      // 使用新的智能方法获取持仓数量
      const currentPositionCount = await useWealthStore.getState().getPositionCount();
      const positionLimit = 8; // 基础持仓限制
      
      Logger.info(LogModule.PORTFOLIO, `[ManagePosition] 持仓检查: 当前${currentPositionCount}个, 限制${positionLimit}个`);
      Logger.info(LogModule.PORTFOLIO, `[ManagePosition] 操作类型: ${operationType}, 是否有现有持仓: ${hasPosition}`);
      
      if (currentPositionCount >= positionLimit && operationType === 'add' && !hasPosition) {
        Logger.info(LogModule.PORTFOLIO, `[ManagePosition] 达到持仓限制`);
        return false; // 达到限制
      }
      
      Logger.info(LogModule.PORTFOLIO, `[ManagePosition] 未达到限制或是增持现有持仓，可以继续`);
      return true; // 未达到限制或是增持现有持仓
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '检查持仓限制失败:', error);
      return true; // 出错时允许添加
    }
  }, [operationType, hasPosition]);

  // 计算总成本或预计收益
  const calculateTotal = useCallback(() => {
    try {
      if (!shares || !avgCost) return '0';
      
      const sharesNum = parseFloat(shares);
      const priceNum = parseFloat(avgCost);
      
      if (isNaN(sharesNum) || isNaN(priceNum)) return '0';
      
      // 计算总额
      const total = sharesNum * priceNum;
      
      // 使用本地格式化函数（不使用科学计数法）
      const pricescaleToUse = stockQuote?.pricescale || 100; // 100 = 2位小数（默认）
      return formatPriceForInput(total, pricescaleToUse);
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '计算总金额时出错:', error);
      return '0';
    }
  }, [shares, avgCost, stockQuote?.pricescale]);
  
  const totalAmount = useMemo(() => {
    try {
      return calculateTotal();
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '计算总金额时出错:', error);
      return '0.00';
    }
  }, [calculateTotal]);
  
  
  // ===== 生命周期 =====
  // 键盘事件监听
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);
  
  // 初始化数据
  useEffect(() => {
    try {
      if (!safeSymbol) {
        Alert.alert(t('common.error'), t('position.stockCodeEmpty'), [
          { text: t('common.back'), onPress: () => router.back() }
        ]);
        return;
      }
      
      if (!isAuthenticated) {
        Alert.alert(t('common.info'), t('position.loginToTrade'), [
          { text: t('common.cancel'), onPress: () => router.back() },
          { text: t('common.login'), onPress: () => router.push('/auth/login' as any) }
        ]);
        return;
      }
      
      // 加载股票报价数据
      const loadData = async () => {
        try {
          setIsLoadingQuote(true);
          
          // ✅ 优化1: 优先检查 tradingViewStore 的缓存
          const tvStore = useTradingViewStore.getState();
          const cachedQuote = tvStore.quote;
          const lastUpdate = tvStore.lastQuoteUpdate;
          const cacheAge = Date.now() - lastUpdate;
          
          // 构建股票标识符
          const tvSymbol = toTradingViewSymbol(safeSymbol!, exchange);
          const cachedSymbol = cachedQuote?.symbol;
          
          // 判断缓存是否可用：
          // 1. 缓存存在
          // 2. 是同一个股票
          // 3. 缓存时间在10秒内
          const isCacheValid = cachedQuote && 
                               cachedSymbol === tvSymbol && 
                               cacheAge < 10000;
          
          if (isCacheValid) {
            // ✅ 使用缓存数据，无需网络请求
            Logger.info(LogModule.PORTFOLIO, `⚡ 使用 TradingView 缓存数据`, {
              symbol: tvSymbol,
              cacheAge: `${(cacheAge / 1000).toFixed(1)}s`,
              price: cachedQuote.lp
            });
            
            // 转换为应用内格式
            const quoteData = {
              symbol: safeSymbol,
              exchange: exchange,
              name: cachedQuote.description || cachedQuote.local_description || safeSymbol,
              price: cachedQuote.lp || 0,
              currency: cachedQuote.currency_code || 'USD',
              logoid: cachedQuote.logoid,
              baseCurrencyLogoid: cachedQuote['base-currency-logoid'],
              currencyLogoid: cachedQuote['currency-logoid'],
              pricescale: cachedQuote.pricescale,
            };
            
            setStockQuote(quoteData);
          } else {
            // ❌ 缓存不可用，重新请求
            Logger.info(LogModule.PORTFOLIO, `🌐 缓存不可用，重新请求报价`, {
              symbol: tvSymbol,
              hasCachedQuote: !!cachedQuote,
              isSameSymbol: cachedSymbol === tvSymbol,
              cacheAge: cacheAge > 0 ? `${(cacheAge / 1000).toFixed(1)}s` : 'N/A'
            });
            
            const symbolQueryStr = `${exchange}:${safeSymbol!.toUpperCase()}`;
            // ✅ 使用 Store 方法替代直接调用 Service
            const batchQuoteResponse = await tvStore.fetchBatchQuotes([symbolQueryStr]);
            
            if (batchQuoteResponse.success && batchQuoteResponse.data && batchQuoteResponse.data.length > 0) {
              const quoteResult = batchQuoteResponse.data[0];
              if (quoteResult.success && quoteResult.data) {
                // 转换为应用内格式
                const quoteData = {
                  symbol: safeSymbol,
                  exchange: exchange,
                  name: quoteResult.data.description || quoteResult.data.local_description || safeSymbol,
                  price: quoteResult.data.lp || 0,
                  currency: quoteResult.data.currency_code || 'USD',
                  logoid: quoteResult.data.logoid,
                  baseCurrencyLogoid: quoteResult.data['base-currency-logoid'],
                  currencyLogoid: quoteResult.data['currency-logoid'],
                  pricescale: quoteResult.data.pricescale,
                };
                
                setStockQuote(quoteData);
              }
            }
          }
          
          // 获取持仓数据 - 使用简化的方法
          await fetchCurrentPosition();
        } catch (error) {
          Logger.error(LogModule.PORTFOLIO, '初始化数据时出错:', error);
        } finally {
          setIsLoadingQuote(false);
        }
      };
      
      loadData();
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, '初始化页面时出错:', error);
    }
  }, [safeSymbol, isAuthenticated, exchange, fetchCurrentPosition, t]);
  
  // 货币转换逻辑（使用 Store）
  useEffect(() => {
    const convertPrices = async () => {
      if (targetCurrency !== 'USD') {
        try {
          // 转换当前价格
          if (currentPrice > 0) {
            const converted = await convertCurrency(currentPrice, 'USD', targetCurrency);
            setConvertedPrice(converted);
          }
          
          // 转换平均成本
          if (avgCost && parseFloat(avgCost) > 0) {
            const convertedCost = await convertCurrency(parseFloat(avgCost), 'USD', targetCurrency);
            setConvertedAvgCost(convertedCost);
          } else {
            setConvertedAvgCost(undefined);
          }
          
          // 转换总成本
          if (totalAmount && parseFloat(totalAmount) > 0) {
            const convertedTotal = await convertCurrency(parseFloat(totalAmount), 'USD', targetCurrency);
            setConvertedTotalAmount(convertedTotal);
          } else {
            setConvertedTotalAmount(undefined);
          }
        } catch (err) {
          Logger.error(LogModule.PORTFOLIO, '货币转换失败:', err);
          setConvertedPrice(currentPrice); // 失败时使用原价
          setConvertedAvgCost(undefined);
          setConvertedTotalAmount(undefined);
        }
      } else {
        // USD时不需要转换
        setConvertedPrice(currentPrice);
        setConvertedAvgCost(undefined);
        setConvertedTotalAmount(undefined);
      }
    };
    
    convertPrices();
  }, [currentPrice, targetCurrency, avgCost, totalAmount, convertCurrency]);
  
  // 设置默认价格
  useEffect(() => {
    try {
      // 只在初始设置时填充价格，而不是每次avgCost变化时
      if (currentPrice > 0) {
        // 使用本地格式化函数（不使用科学计数法）
        const pricescaleToUse = stockQuote?.pricescale || 100; // 100 = 2位小数（默认）
        const avgPrice = formatPriceForInput(currentPrice, pricescaleToUse);
        setAvgCost(avgPrice);
      } 
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '设置默认价格时出错:', error);
    }
  }, [currentPrice, stockQuote?.pricescale]); 
  
  // 切换操作类型时，如果没有持仓则只能选择增持
  // 添加 isOperationInProgress 和 justCompletedOperation 检查，避免在操作成功后触发错误提示
  useEffect(() => {
    try {
      if (!hasPosition && operationType === 'reduce' && !isOperationInProgress && !justCompletedOperation) {
        setOperationType('add');
      }
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '检查操作类型时出错:', error);
    }
  }, [hasPosition, operationType, isOperationInProgress, justCompletedOperation, t]);

  useEffect(() => {
    if (mode === 'reduce' && hasPosition) {
      setOperationType('reduce');
    }
    if (mode === 'reduce' && !hasPosition) {
      setOperationType('add');
    }
  }, [mode, hasPosition]);
  

  
  // ===== 事件处理器 =====
  // 验证表单
  const validateForm = useCallback(() => {
    try {
      const newErrors: { shares?: string; avgCost?: string } = {};
      
      // 验证股数
      if (!shares.trim()) {
        newErrors.shares = t('position.enterShares');
      } else {
        const sharesNum = parseFloat(shares);
        if (isNaN(sharesNum) || sharesNum <= 0) {
          newErrors.shares = t('position.sharesMustBePositive');
        } else if (sharesNum > 999999) {
          newErrors.shares = t('position.sharesExceedMax');
        } else if (operationType === 'reduce' && hasPosition && position && sharesNum > position.quantity) {
          newErrors.shares = t('position.sharesCantExceedHolding');
        }
      }
      
      // 验证平均成本/卖出价格
      if (!avgCost.trim()) {
        newErrors.avgCost = operationType === 'add' ? t('position.enterAverageCost') : t('position.enterSellPrice');
      } else {
        const costNum = parseFloat(avgCost);
        // API 支持最小 8 位小数，即 0.00000001
        const minPrice = 0.00000001;
        if (isNaN(costNum) || costNum <= 0) {
          newErrors.avgCost = t('position.priceMustBePositive');
        } else if (costNum < minPrice) {
          newErrors.avgCost = t('position.priceMustBeGreaterThanOrEqual', { minPrice: minPrice.toString() });
        } else if (costNum > 999999) {
          newErrors.avgCost = t('position.priceExceedMax');
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, '表单验证时出错:', error);
      return false;
    }
  }, [shares, avgCost, operationType, hasPosition, position, t]);
  
  // 核心提交逻辑 - 可被直接调用，跳过限制检查
  const performSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsOperationInProgress(true);
      const sharesNum = parseFloat(shares);
      const priceNum = parseFloat(avgCost); // 用户输入的USD价格
      const wealthStore = useWealthStore.getState();
      
      if (operationType === 'add') {
        if (hasPosition && position) {
          // 🔧 修复：使用正确的 EXCHANGE:SYMBOL 格式
          await wealthStore.adjustPosition(
            `${position.exchange}:${position.symbol}`, 
            sharesNum, 
            priceNum // 直接传递USD价格
          );
          await logAddBuyPosition(safeSymbol!, false);
        } else {
          await logFirstAddPosition(safeSymbol!);
          // 🔧 修复：使用正确的 EXCHANGE:SYMBOL 格式
          let symbolQueryStr = `${exchange}:${safeSymbol!.toUpperCase()}`;
          await wealthStore.adjustPosition(symbolQueryStr, sharesNum, priceNum);
        }
      } else {
        if (!hasPosition || !position) {
          throw new Error(t('position.noPositionToSell'));
        }
        await logReducePosition(safeSymbol!);
        // 🔧 修复：使用正确的 EXCHANGE:SYMBOL 格式
        await wealthStore.adjustPosition(
          `${position.exchange}:${position.symbol}`, 
          -sharesNum, 
          priceNum
        );
      }
      
      setJustCompletedOperation(true);
      setIsOperationInProgress(false);
      
      // ⚡ 优化：立即返回，不等待
      Logger.info(LogModule.PORTFOLIO, '✅ 持仓操作成功，立即返回');
      
      // ✅ 优化2: 设置导航来源标记，优化返回详情页时的刷新逻辑
      const stockDetailStore = useStockDetailStore.getState();
      const tvSymbol = toTradingViewSymbol(safeSymbol!, exchange);
      stockDetailStore.setNavigationFrom('position_add', tvSymbol);
      
      try {
        router.back();
      } catch (error) {
        Logger.warn(LogModule.PORTFOLIO, '导航失败，使用替代方案:', error);
        router.replace('/(tabs)/wealth' as any);
      }
    } catch (error: any) {
      Logger.error(LogModule.PORTFOLIO, '❌ 操作失败:', error);
      const failedMessage = operationType === 'add' ? t('position.increaseFailed') : t('position.decreaseFailed');
      Alert.alert(failedMessage, error.message || t('position.retryLater'));
      setIsOperationInProgress(false);
    }
  }, [validateForm, operationType, hasPosition, position, shares, avgCost, safeSymbol, t, exchange, logAddBuyPosition, logFirstAddPosition, logReducePosition]);
  
  // 提交持仓的完整逻辑（包括限制检查）- 现在简化为调用核心逻辑
  const submitPosition = useCallback(async () => {
    // 直接调用核心提交逻辑
    await performSubmit();
  }, [performSubmit]);
  
  // 处理提交
  const handleSubmit = useCallback(async () => {
    // 检查持仓限制（仅针对新增持仓）
    if (operationType === 'add' && !hasPosition) {
      const canAdd = await checkPositionLimit();
      if (!canAdd) {
        // 显示激励广告
        return;
      }
    }
    
    // 调用核心提交逻辑
    await submitPosition();
  }, [operationType, hasPosition, checkPositionLimit, submitPosition]);
  
  // 使用当前价格填充价格
  const useCurrentPrice = useCallback(() => {
    try {
      if (currentPrice > 0) {
        // 使用本地格式化函数（不使用科学计数法）
        const pricescaleToUse = stockQuote?.pricescale || 100; // 100 = 2位小数（默认）
        const avgPrice = formatPriceForInput(currentPrice, pricescaleToUse);
        setAvgCost(avgPrice);
        setErrors(prev => ({ ...prev, avgCost: undefined }));
      }
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '使用当前价格时出错:', error);
    }
  }, [currentPrice, stockQuote?.pricescale]); 
  
  // 切换操作类型
  const switchOperationType = useCallback((type: OperationType) => {
    try {
      if (type === 'reduce' && !hasPosition && !isOperationInProgress && !justCompletedOperation) {
        Alert.alert(t('common.info'), t('position.noPositionToSell'));
        return;
      }
      setOperationType(type);
      setShares('');
      setErrors({});
      setJustCompletedOperation(false); // 重置刚完成操作的标志
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '切换操作类型时出错:', error);
    }
  }, [hasPosition, isOperationInProgress, justCompletedOperation, t]);
  
  // ===== 渲染 =====
  // 如果没有有效的 symbol，显示错误界面
  if (!safeSymbol) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={MarketNewsBrand.colors.market.bearish} />
          <Text style={styles.errorTitle}>{t('common.error')}</Text>
          <Text style={styles.errorMessage}>{t('position.stockCodeEmpty')}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // 如果没有报价数据，显示加载或错误状态
  if (!stockQuote && isLoadingQuote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={keyboardBehavior}
        keyboardVerticalOffset={100}
        enabled={true}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* 股票信息卡片（新组件） */}
          <View style={styles.cardContainer}>
            <StockInfoCard
              symbol={safeSymbol || ''}
              exchange={exchange}
              name={stockName}
              currentPrice={currentPrice}
              displayPrice={displayPrice}
              displayCurrency={targetCurrency}
              originalCurrency={targetCurrency !== 'USD' ? 'USD' : undefined}
              logoid={stockQuote?.logoid}
              baseCurrencyLogoid={stockQuote?.baseCurrencyLogoid}
              currencyLogoid={stockQuote?.currencyLogoid}
              operationType={operationType}
              isLoading={isLoadingQuote}
              pricescale={stockQuote?.pricescale}
            />
          </View>

          {/* 操作类型切换（新组件，独立一行） */}
          <View style={styles.cardContainer}>
            <OperationTypeToggle
              operationType={operationType}
              hasPosition={hasPosition}
              onTypeChange={switchOperationType}
              disabled={isLoading.all}
            />
          </View>

          {/* 表单输入（新组件） */}
          <View style={styles.cardContainer}>
            <PositionFormInputs
              operationType={operationType}
              shares={shares}
              avgCost={avgCost}
              errors={errors}
              currentPrice={currentPrice}
              displayCurrency={targetCurrency}
              position={position}
              totalAmount={totalAmount}
              isLoading={isLoading.all}
              onSharesChange={setShares}
              onAvgCostChange={setAvgCost}
              onUseCurrentPrice={useCurrentPrice}
              convertedAvgCost={convertedAvgCost}
              convertedTotalAmount={convertedTotalAmount}
            />
          </View>
          

        </ScrollView>
        
        {/* 底部按钮 */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                operationType === 'reduce' && styles.submitButtonReduce,
                (isLoading.all || !shares.trim() || !avgCost.trim()) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isLoading.all || !shares.trim() || !avgCost.trim()}
            >
              {isLoading.position ? (
                <ActivityIndicator color={MarketNewsBrand.colors.text.inverse} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {operationType === 'add' ? t('position.addPosition') : t('position.sellStock')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: 'bold',
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // 为底部按钮和键盘预留空间
    flexGrow: 1,
  },
  
  // 组件容器样式
  cardContainer: {
    marginBottom: 0, // 组件内部已有margin
  },
  
  // 底部按钮
  footer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.border.default,
    // 确保footer在键盘弹出时不被压缩
    flexShrink: 0,
  },
  footerInner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  submitButton: {
    backgroundColor: MarketNewsBrand.colors.semantic.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonReduce: {
    backgroundColor: MarketNewsBrand.colors.semantic.error,
  },
  submitButtonDisabled: {
    backgroundColor: MarketNewsBrand.colors.text.tertiary,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.inverse,
  },
  currencyNote: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: 4,
  },
}); 