/**
 * 排行榜选择底部Sheet组件
 * 用于展示和选择可添加的排行榜
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from '@/hooks/useTranslation';
import { useLeaderboardStore } from '@/stores';
import { SelectableLeaderboardItem } from './SelectableLeaderboardItem';
import { CountrySelector } from './CountrySelector';
import type { DefaultLeaderboard } from '@/types/leaderboard';

interface SelectionSheetProps {
  /** Sheet引用 */
  sheetRef: React.RefObject<BottomSheet | null>;
  
  /** 目标分类ID（要添加到哪个分类） */
  targetCategoryId: string | null;
  
  /** 关闭回调 */
  onClose: () => void;
}

type CategoryData = {
  leaderboards: DefaultLeaderboard[];
  markets?: Record<string, DefaultLeaderboard[]>; // 只有stocks有市场分组
};
type GroupedData = Record<string, CategoryData>;

export function SelectionSheet({
  sheetRef,
  targetCategoryId,
  onClose,
}: SelectionSheetProps) {
  const { t } = useTranslation();
  const { 
    systemConfigs, 
    isLoading, 
    batchAddFromSheet,
    fetchSystemConfigs 
  } = useLeaderboardStore();
  
  // 状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  // 国家选择状态
  const [countrySelections, setCountrySelections] = useState<Map<string, string>>(new Map());
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [selectedLeaderboardForCountry, setSelectedLeaderboardForCountry] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  // Sheet打开时加载系统配置
  useEffect(() => {
    if (targetCategoryId && systemConfigs.length === 0) {
      fetchSystemConfigs();
    }
  }, [targetCategoryId, systemConfigs.length, fetchSystemConfigs]);
  
  // 将 systemConfigs 转换为与 defaultConfig 兼容的格式
  const leaderboardsMap = useMemo(() => {
    const map: Record<string, DefaultLeaderboard> = {};
    systemConfigs.forEach(config => {
      map[config.id] = {
        id: config.id,
        market_type: config.market_type,
        market_code: config.market_code,
        name_translations: config.name_translations,
        description_translations: config.description_translations,
      };
    });
    return map;
  }, [systemConfigs]);
  
  // 按 market_type 分组数据，stock 类型下再按 market_code 分组
  const groupedData = useMemo(() => {
    if (Object.keys(leaderboardsMap).length === 0) {
      return {};
    }
    
    const allLeaderboards = Object.values(leaderboardsMap);
    
    // 搜索过滤
    const filtered = allLeaderboards.filter(config => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;
      
      const nameZh = config.name_translations?.zh?.toLowerCase() || '';
      const nameEn = config.name_translations?.en?.toLowerCase() || '';
      const code = config.id.toLowerCase();
      
      return nameZh.includes(searchLower) || 
             nameEn.includes(searchLower) || 
             code.includes(searchLower);
    });
    
    // 按 market_type 分组（第一级）
    const grouped: GroupedData = {};
    
    filtered.forEach(config => {
      const marketType = config.market_type || 'other';
      
      if (!grouped[marketType]) {
        grouped[marketType] = {
          leaderboards: [],
        };
      }

      grouped[marketType].leaderboards.push(config);
    });

    return grouped;
  }, [leaderboardsMap, searchQuery]);
  
  // 切换选中状态
  const toggleSelection = useCallback((code: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);
  
  // 切换分类展开状态
  const toggleCategory = useCallback((categoryKey: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  }, []);

  // 全部展开/折叠
  const toggleExpandAll = useCallback(() => {
    if (isAllExpanded) {
      // 全部折叠
      setExpandedCategories(new Set());
      setIsAllExpanded(false);
    } else {
      // 全部展开
      const allCategoryKeys = Object.keys(groupedData);
      setExpandedCategories(new Set(allCategoryKeys));
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, groupedData]);

  // 处理国家标签点击
  const handleCountryClick = useCallback((leaderboardId: string) => {
    const config = leaderboardsMap[leaderboardId];
    if (!config) return;

    const displayName = config.name_translations?.zh || config.name_translations?.en || leaderboardId;
    setSelectedLeaderboardForCountry({ id: leaderboardId, name: displayName });
    setShowCountrySelector(true);
  }, [leaderboardsMap]);

  // 处理国家选择
  const handleCountrySelect = useCallback((country: string) => {
    if (selectedLeaderboardForCountry) {
      setCountrySelections(prev => {
        const next = new Map(prev);
        next.set(selectedLeaderboardForCountry.id, country);
        return next;
      });
    }
    setShowCountrySelector(false);
    setSelectedLeaderboardForCountry(null);
  }, [selectedLeaderboardForCountry]);

  // 批量添加
  const handleAddSelected = useCallback(async () => {
    if (selectedCodes.size === 0) {
      Alert.alert(t('common.tips'), t('leaderboard.sheet.noSelection'));
      return;
    }

    setIsAdding(true);
    try {
      // 为每个选中的排行榜生成完整的配置
      const configsToAdd = Array.from(selectedCodes).map(code => {
        const config = leaderboardsMap[code];
        if (!config) return code;

        // 如果是股票类型，使用选中的国家代码（兼容 'stock' 和 'stocks'）
        if (config.market_type === 'stock' || config.market_type === 'stocks') {
          const country = countrySelections.get(code) || 'america';
          return `${code}:${country}`;
        }

        return code;
      });

      await batchAddFromSheet(configsToAdd, targetCategoryId || undefined);
      setSelectedCodes(new Set());
      setCountrySelections(new Map());
      onClose();
    } catch {
      Alert.alert(t('common.error'), t('leaderboard.sheet.addFailed'));
    } finally {
      setIsAdding(false);
    }
  }, [selectedCodes, countrySelections, leaderboardsMap, targetCategoryId, batchAddFromSheet, onClose, t]);

  // 获取市场类型的显示名称
  const getMarketTypeDisplayName = (marketType: string): string => {
    // 将后端返回的 type 值映射到翻译键
    const typeMapping: Record<string, string> = {
      'stocks': 'stock',
      'indices': 'indices',
      'crypto': 'crypto',
      'futures': 'futures',
      'currencies': 'forex',
      'bonds': 'bonds',
      'corporate_bonds': 'corporate_bonds',
      'etfs': 'etf',
    };

    const translationKey = typeMapping[marketType] || marketType;
    const translated = t(`leaderboard.sheet.marketTypes.${translationKey}`);

    // 如果翻译不存在，返回格式化的原始值
    if (translated === `leaderboard.sheet.marketTypes.${translationKey}`) {
      return marketType.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    return translated;
  };
  
  // 渲染分类（一级 - market_type）
  const renderCategory = (marketType: string, data: CategoryData) => {
    const isExpanded = expandedCategories.has(marketType);
    const totalCount = data.leaderboards.length;
    
    return (
      <View key={marketType} style={styles.category}>
        {/* 分类头部 */}
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(marketType)}
        >
          <View style={styles.categoryHeaderLeft}>
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="#6B7280"
            />
            <Text style={styles.categoryTitle}>{getMarketTypeDisplayName(marketType)}</Text>
          </View>
          
          <Text style={styles.categoryCount}>
            {totalCount}
          </Text>
        </TouchableOpacity>
        
        {/* 分类内容 */}
        {isExpanded && (
          <View>
            {data.leaderboards.map(config => (
              <SelectableLeaderboardItem
                key={config.id}
                config={config}
                isSelected={selectedCodes.has(config.id)}
                onToggle={toggleSelection}
                marketType={marketType}
                selectedCountry={countrySelections.get(config.id) || 'america'}
                onCountryClick={handleCountryClick}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['75%', '95%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('leaderboard.sheet.title')}</Text>
          <View style={styles.headerActions}>
            {/* 全部展开/折叠按钮 */}
            <TouchableOpacity onPress={toggleExpandAll} style={styles.expandButton}>
              <Ionicons 
                name={isAllExpanded ? 'contract-outline' : 'expand-outline'} 
                size={22} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            {/* 关闭按钮 */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('leaderboard.sheet.search')}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* 列表内容 - 按分类分组 */}
        <BottomSheetScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          {isLoading.systemConfigs ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text style={styles.loadingText}>{t('leaderboard.sheet.loading') || '加载中...'}</Text>
            </View>
          ) : Object.keys(groupedData).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>{t('leaderboard.sheet.noResults')}</Text>
            </View>
          ) : (
            Object.keys(groupedData).map(categoryKey => 
              renderCategory(categoryKey, groupedData[categoryKey])
            )
          )}
        </BottomSheetScrollView>
        
        {/* 浮动添加按钮 */}
        {selectedCodes.size > 0 && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleAddSelected}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.floatingButtonText}>
                    {t('leaderboard.sheet.addSelected')} ({selectedCodes.size})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </BottomSheet>

    {/* 国家选择器 */}
    <CountrySelector
      visible={showCountrySelector}
      currentCountry={countrySelections.get(selectedLeaderboardForCountry?.id || '') || 'america'}
      leaderboardName={selectedLeaderboardForCountry?.name}
      onSelect={handleCountrySelect}
      onClose={() => {
        setShowCountrySelector(false);
        setSelectedLeaderboardForCountry(null);
      }}
    />
  </>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
  },
  
  container: {
    flex: 1,
  },
  
  // 头部
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.secondary,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  
  // 搜索框
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: MarketNewsBrand.borderRadius.xl,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  
  // 滚动视图
  scrollView: {
    flex: 1,
    marginTop: 8,
  },
  
  // 一级分类
  category: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    textTransform: 'capitalize',
  },
  categoryCount: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.tertiary,
  },
  
  // 二级市场（仅stocks分类）
  marketGroup: {
    marginTop: 4,
    marginBottom: 4,
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderLeftWidth: 3,
    borderLeftColor: MarketNewsBrand.colors.primary[400],
    marginLeft: 12,
  },
  marketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marketTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
  },
  marketCount: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.tertiary,
  },
  
  // 加载状态
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: 12,
  },
  
  // 空状态
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.tertiary,
    marginTop: 12,
  },
  
  // 浮动按钮
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MarketNewsBrand.colors.primary[400],
    paddingVertical: 14,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    gap: 8,
  },
  floatingButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.inverse,
  },
});

