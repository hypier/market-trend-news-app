/**
 * 新闻相关股票组件
 * 显示新闻关联的股票列表，包含logo和实时报价
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';
import { useTradingViewStore } from '@/stores/market/tradingViewStore';
import { StockLogo } from '@/components/ui/StockLogo';
import { isCompositeSymbol } from '@/helpers/symbolUtils';
import { useTranslation } from '@/hooks/useTranslation';
import type { TradingViewQuote } from '@/types/tradingview';

interface RelatedSymbol {
  symbol: string;
  logoid?: string;
  'base-currency-logoid'?: string;
  'currency-logoid'?: string;
}

interface RelatedStocksProps {
  relatedSymbols: RelatedSymbol[];
}

export const RelatedStocks: React.FC<RelatedStocksProps> = ({ relatedSymbols }) => {
  const { t } = useTranslation();
  // ✅ 使用 TradingViewStore 替代直接调用 Service
  const { fetchBatchQuotes } = useTradingViewStore();
  const [stockQuotes, setStockQuotes] = useState<Record<string, TradingViewQuote>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(9); // 已加载的股票数量
  
  // 最多显示9个，每次加载9个
  const MAX_VISIBLE = 9;
  const BATCH_SIZE = 9;

  // 过滤有效的股票符号（必须是 EXCHANGE:SYMBOL 格式）
  const validSymbols = useMemo(() => {
    if (!relatedSymbols || relatedSymbols.length === 0) {
      return [];
    }
    
    const valid = relatedSymbols.filter(item => {
      const isValid = item.symbol && isCompositeSymbol(item.symbol);
      if (!isValid) {
        Logger.warn(LogModule.NEWS, `跳过无效 symbol 格式: ${item.symbol}`);
      }
      return isValid;
    });
    
    Logger.debug(LogModule.NEWS, `有效 symbols: ${valid.length}/${relatedSymbols.length}`);
    return valid;
  }, [relatedSymbols]);

  // 计算要显示的股票列表
  const visibleSymbols = useMemo(() => {
    if (isExpanded) {
      // 展开后显示所有股票
      return validSymbols;
    } else {
      // 折叠时只显示前9个
      return validSymbols.slice(0, MAX_VISIBLE);
    }
  }, [validSymbols, isExpanded]);
  
  const hasMore = validSymbols.length > MAX_VISIBLE;

  // 初始加载：加载前9个股票的报价
  useEffect(() => {
    const fetchInitialQuotes = async () => {
      if (!validSymbols || validSymbols.length === 0) {
        return;
      }
      
      try {
        // 只加载前9个
        const initialSymbols = validSymbols.slice(0, MAX_VISIBLE).map(item => item.symbol);
        Logger.debug(LogModule.NEWS, '初始加载股票报价:', initialSymbols);
        
        const batchResponse = await fetchBatchQuotes(initialSymbols);
        
        const quotesMap: Record<string, TradingViewQuote> = {};
        if (batchResponse?.data) {
          batchResponse.data.forEach(result => {
            if (result.success && result.data) {
              quotesMap[result.symbol] = result.data;
            }
          });
        }
        
        setStockQuotes(prev => ({ ...prev, ...quotesMap }));
        Logger.debug(LogModule.NEWS, '初始报价加载完成', { count: Object.keys(quotesMap).length });
      } catch (error) {
        Logger.error(LogModule.NEWS, '初始加载报价失败:', error);
      }
    };
    
    fetchInitialQuotes();
  }, [validSymbols, fetchBatchQuotes]);

  // 展开后自动分批加载：每次加载9个（自动进行，无需用户操作）
  useEffect(() => {
    if (!isExpanded || loadedCount >= validSymbols.length) {
      return; // 未展开或已全部加载，不需要额外加载
    }
    
    const fetchNextBatch = async () => {
      try {
        // 计算需要加载的范围：从已加载的位置开始，加载下一批
        const startIndex = loadedCount;
        const endIndex = Math.min(loadedCount + BATCH_SIZE, validSymbols.length);
        const batchSymbols = validSymbols.slice(startIndex, endIndex).map(item => item.symbol);
        
        if (batchSymbols.length === 0) {
          return;
        }
        
        // 过滤掉已经加载过的股票（避免重复加载）
        const symbolsToLoad = batchSymbols.filter(symbol => !stockQuotes[symbol]);
        
        if (symbolsToLoad.length === 0) {
          // 如果这批都已加载，直接更新 loadedCount
          setLoadedCount(endIndex);
          return;
        }
        
        Logger.debug(LogModule.NEWS, `自动加载第 ${startIndex + 1}-${endIndex} 个股票报价:`, symbolsToLoad);
        
        const batchResponse = await fetchBatchQuotes(symbolsToLoad);
        
        const quotesMap: Record<string, TradingViewQuote> = {};
        if (batchResponse?.data) {
          batchResponse.data.forEach(result => {
            if (result.success && result.data) {
              quotesMap[result.symbol] = result.data;
            }
          });
        }
        
        setStockQuotes(prev => ({ ...prev, ...quotesMap }));
        setLoadedCount(endIndex); // 更新已加载数量
        Logger.debug(LogModule.NEWS, '批次报价加载完成', { count: Object.keys(quotesMap).length });
      } catch (error) {
        Logger.error(LogModule.NEWS, '批次加载报价失败:', error);
      }
    };
    
    fetchNextBatch();
  }, [isExpanded, loadedCount, validSymbols, fetchBatchQuotes, stockQuotes]);

  // 如果没有有效的股票符号，不渲染组件
  if (!validSymbols || validSymbols.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.stocksList}>
        {visibleSymbols.map((item, index) => {
          const quote = stockQuotes[item.symbol];
          const isPositive = quote ? quote.ch >= 0 : false;
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.stockCard}
              onPress={() => {
                // 导航到股票详情页
                router.push(`/stock/${encodeURIComponent(item.symbol)}`);
              }}
            >
              {/* Logo - 使用 StockLogo 组件 */}
              <View style={styles.logoContainer}>
                <StockLogo 
                  logoid={item.logoid}
                  symbol={item.symbol}
                  baseCurrencyLogoid={item['base-currency-logoid']}
                  currencyLogoid={item['currency-logoid']}
                  size={20}
                />
              </View>
              
              {/* 股票信息 */}
              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>
                  {item.symbol.split(':')[1] || item.symbol}
                </Text>
                {quote ? (
                  <Text style={[
                    styles.changeText,
                    isPositive ? styles.changePositive : styles.changeNegative
                  ]}>
                    {isPositive ? '+' : ''}{(quote.chp || 0).toFixed(2)}%
                  </Text>
                ) : (
                  <Text style={styles.loadingText}>--</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* 展开/折叠按钮 */}
      {hasMore && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => {
            if (isExpanded) {
              // 折叠：重置为初始状态
              setIsExpanded(false);
              setLoadedCount(MAX_VISIBLE);
            } else {
              // 展开：显示所有，自动触发分批加载
              setIsExpanded(true);
              // 确保触发加载：如果当前只加载了前9个，立即触发加载下一批
              // useEffect 会自动检测到 isExpanded 变化并继续加载
            }
          }}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded 
              ? t('components.news.relatedStocks.collapse')
              : t('components.news.relatedStocks.expandMore', { count: validSymbols.length - MAX_VISIBLE })}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  label: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 6,
  },
  stocksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    minWidth: 100,
  },
  logoContainer: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 1,
  },
  changeText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.tertiary,
  },
  changePositive: {
    color: MarketNewsBrand.colors.semantic.success,
  },
  changeNegative: {
    color: MarketNewsBrand.colors.semantic.error,
  },
  expandButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.primary[500],
  },
});

