import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated, SafeAreaView, TextInput } from 'react-native';
import { useDebounce } from '@/hooks';
import { useSearchStore } from '@/stores';
import { useAnalytics } from '@/hooks/useAnalytics';
import { navigateToStockDetail } from '@/helpers/navigation';
import { MarketNewsBrand, getBrandSpacing } from '@/config/brand';
import {
  SearchInput,
  CategoryTabs,
  SearchResultsList,
  SearchEmptyState,
} from '@/components/search';

export default function SearchScreen() {
  const { logSearchStocks } = useAnalytics();
  
  // 使用搜索状态管理
  const { 
    query,
    results,
    isLoading, 
    error, 
    setQuery, 
    searchStocks, 
    clearSearch,
    assetCategories,
    getFilteredResults,
  } = useSearchStore();

  const inputRef = useRef<TextInput>(null);
  
  // 使用防抖来避免频繁的API调用
  const debouncedQuery = useDebounce(query || '', 1000);
  
  // 添加分类筛选状态
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 添加焦点状态和动画
  const [isInputFocused, setIsInputFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 页面进入动画
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  
  // 当防抖后的查询发生变化时执行搜索
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim()) {
      logSearchStocks(debouncedQuery);
    }
    searchStocks(debouncedQuery || '');
  }, [debouncedQuery, searchStocks, logSearchStocks]);
  
  // 处理股票点击（使用 TradingView 格式的 id，如 "NASDAQ:AAPL"）
  const handleStockPress = useCallback((id: string) => {
    // TradingView 格式：EXCHANGE:SYMBOL
    const [exchange, symbol] = id.split(':');
    if (symbol && exchange) {
      navigateToStockDetail(symbol, exchange);
    }
  }, []);
  
  // 处理搜索输入变化
  const handleQueryChange = useCallback(
    (text: string) => {
    setQuery(text);
    },
    [setQuery]
  );
  
  // 清空搜索
  const handleClearSearch = useCallback(() => {
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);
  
  // 重试搜索
  const handleRetry = useCallback(() => {
    searchStocks(query || '');
  }, [query, searchStocks]);

  // 处理分类切换
  const handleCategoryChange = useCallback((categoryCode: string) => {
    setSelectedCategory((prevCategory) => {
      // 选中 all 或再次点击当前分类则切换为全部（空字符串）
      if (categoryCode === 'all' || prevCategory === categoryCode) {
        return '';
      }
      return categoryCode;
    });
  }, []);

  // 获取过滤后的结果
  const filteredResults = getFilteredResults(selectedCategory);
  
  // 根据搜索结果动态过滤可用的分类，并计算每个分类的数量
  const { availableCategories, categoryCounts } = React.useMemo(() => {
    // 如果没有搜索结果，返回所有分类，数量为0
    if (!results || results.length === 0) {
      const counts = new Map<string, number>();
      assetCategories.forEach((cat) => counts.set(cat.code, 0));
      return { availableCategories: assetCategories, categoryCounts: counts };
    }

    // TradingView API type 到前端分类的映射表
    const typeToCategory: Record<string, string> = {
      // 加密货币相关
      'spot': 'crypto',
      'crypto': 'crypto',
      
      // 基金相关
      'fund': 'funds',
      'etf': 'funds',
      'funds': 'funds',
      
      // 股票相关
      'stock': 'stock',
      'dr': 'stock',        // 存托凭证
      'structured': 'stock', // 结构性产品
      
      // 债券相关
      'bond': 'bond',
      
      // 指数相关
      'index': 'index',
      
      // 外汇相关
      'forex': 'forex',
      
      // 期货相关
      'futures': 'futures',
      'future': 'futures',
      
      // 经济指标
      'economic': 'economic',
      
      // 期权相关
      'option': 'options',
      'options': 'options',
      'warrant': 'options',  // 认股权证
      
      // 差价合约
      'cfd': 'stock', // CFD 通常基于股票，归类到股票
    };

    // 统计每种类型的数量
    const typeCounts = new Map<string, number>();
    results.forEach((item) => {
      const itemType = item.type?.toLowerCase() || '';
      
      // 使用映射表转换类型，未知类型归类为 'other'
      const categoryType = typeToCategory[itemType] || 'other';
      
      typeCounts.set(categoryType, (typeCounts.get(categoryType) || 0) + 1);
    });

    // "全部"分类的数量是所有结果的总数
    typeCounts.set('all', results.length);

    // 过滤出有结果的分类
    const filtered = assetCategories.filter((category) => {
      // "全部"分类始终显示
      if (category.code === 'all') {
        return true;
      }
      // 其他分类只有在有结果时才显示
      return typeCounts.has(category.code.toLowerCase());
    });

    return { availableCategories: filtered, categoryCounts: typeCounts };
  }, [results, assetCategories]);

  // 当搜索结果变化时，如果当前选中的分类不在可用分类中，自动切换回"全部"
  useEffect(() => {
    if (selectedCategory && results.length > 0) {
      const isAvailable = availableCategories.some(
        (cat) => cat.code === selectedCategory
      );
      if (!isAvailable) {
        setSelectedCategory('');
      }
    }
  }, [availableCategories, selectedCategory, results.length]);

  // 渲染搜索内容
  const renderSearchContent = () => {
    if (isLoading) {
      return <SearchEmptyState type="loading" fadeAnim={fadeAnim} />;
    }
    
    if (error) {
      return <SearchEmptyState type="error" fadeAnim={fadeAnim} error={error} onRetry={handleRetry} />;
    }
    
    // 如果没有查询，显示提示
    if (!query || !query.trim()) {
      return <SearchEmptyState type="no-query" fadeAnim={fadeAnim} />;
    }
    
    // 如果有查询但没有原始结果，显示无结果
    if (query && query.trim() && results.length === 0) {
      return <SearchEmptyState type="no-results" fadeAnim={fadeAnim} />;
    }
    
    // 如果有原始结果但过滤后为空，显示提示切换分类
    if (query && query.trim() && results.length > 0 && filteredResults.length === 0) {
      return (
        <SearchEmptyState
          type="no-category-results"
          fadeAnim={fadeAnim}
          totalResults={results.length}
        />
      );
    }

    // 显示搜索结果
    return (
      <SearchResultsList results={filteredResults} onItemPress={handleStockPress} fadeAnim={fadeAnim} />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索框 */}
      <SearchInput
            ref={inputRef}
        value={query || ''}
            onChangeText={handleQueryChange}
        onClear={handleClearSearch}
        isFocused={isInputFocused}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
      />

      {/* 分类标签 */}
      <CategoryTabs
        categories={availableCategories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        categoryCounts={categoryCounts}
      />

      {/* 搜索结果 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderSearchContent()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getBrandSpacing('lg'),
  },
  bottomSpacing: {
    height: getBrandSpacing('sm'),
  },
});
