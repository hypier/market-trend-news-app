import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, DimensionValue } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import type { AssetCategory } from '@/types/assetCategories';
import { AssetCategoryTabsSkeleton } from '@/components/skeletons/HomeSkeleton';
import { MarketNewsBrand } from '@/config/brand';

interface MarketTabsProps {
  selectedCategory: string;
  selectedSubCategory: string;
  onMainCategoryChange: (code: string) => void;  // 主分类切换
  onSubCategoryChange: (code: string) => void;   // 子分类切换
  categories: AssetCategory[];
  width?: DimensionValue;
  loading?: boolean;
}

export const MarketTabs: React.FC<MarketTabsProps> = ({
  selectedCategory,
  selectedSubCategory,
  onMainCategoryChange,
  onSubCategoryChange,
  categories,
  loading = false,
}) => {
  const { currentLanguage } = useTranslation();

  // 使用传入的分类列表
  const allCategories = categories;

  // 使用 useMemo 缓存当前选中的主分类
  const currentCategory = React.useMemo(() => {
    return allCategories.find(cat => cat.code === selectedCategory);
  }, [allCategories, selectedCategory]);
  
  // 使用 useMemo 缓存子分类，避免每次渲染都重新计算
  const subCategories = React.useMemo(() => {
    return currentCategory?.children || [];
  }, [currentCategory]);



  // 获取显示名称的辅助函数
  const getDisplayName = (translations: { [key: string]: string }) => {
    return translations[currentLanguage] || translations.en || translations.zh || 'Unknown';
  };



  // 处理主分类切换
  const handleCategoryChange = (categoryCode: string) => {
    // 找到第一个子分类并直接传递给主分类切换
    const category = allCategories.find(cat => cat.code === categoryCode);
    const firstChild = category?.children?.[0];
    if (firstChild?.code) {
      // 直接传递子分类代码，避免重复请求
      onMainCategoryChange(firstChild.code);
    } else {
      onMainCategoryChange(categoryCode);
    }
  };

  // 处理子分类切换
  const handleSubCategoryChange = (subCategoryCode: string) => {
    onSubCategoryChange(subCategoryCode);
  };

  // 使用 useMemo 缓存子分类列表项
  const subCategoryItems = React.useMemo(() => {
    return subCategories.map(subCategory => ({
      label: subCategory.nameTranslations[currentLanguage] || subCategory.nameTranslations.en || subCategory.nameTranslations.zh || 'Unknown',
      value: subCategory.code,
    }));
  }, [subCategories, currentLanguage]);

  // 渲染主分类横向列表项（用 subTab 样式，但主分类和自选可通过不同颜色区分）
  const renderMainTabItem = ({ item }: { item: any }) => {
    const isSelected = selectedCategory === item.code;
    return (
      <TouchableOpacity
        style={[
          styles.mainTab,
          isSelected && styles.selectedMainTab,
        ]}
        onPress={() => handleCategoryChange(item.code)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
      >
        <Text style={[
          styles.mainTabText,
          isSelected && styles.selectedMainTabText,
        ]}>
          {getDisplayName(item.nameTranslations)}
        </Text>
      </TouchableOpacity>
    );
  };

  // 子分类渲染函数
  const renderSubCategoryItem = ({ item }: { item: any }) => {
    const isSelected = selectedSubCategory === item.value;
    return (
      <TouchableOpacity
        style={[
          styles.subTab,
          styles.subCategoryTab,
          isSelected && styles.selectedSubCategoryTab,
        ]}
        onPress={() => handleSubCategoryChange(item.value)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
      >
        <Text style={[
          styles.subTabText,
          styles.subCategoryTabText,
          isSelected && styles.selectedSubCategoryTabText,
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };



  return (
    <View style={styles.container}>
      {loading ? (
        <AssetCategoryTabsSkeleton />
      ) : (
        <>
          {/* 主分类 Tabs - 横向 FlatList，用 mainTab 样式 */}
          <View style={styles.tabsContainer}>
            <FlatList
              data={allCategories}
              renderItem={renderMainTabItem}
              keyExtractor={(item) => item.code}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContentContainer}
              pointerEvents="auto"
            />
          </View>

          {/* 子分类横向列表 */}
          {subCategoryItems.length > 0 && (
            <View style={styles.subTabsContainer}>
              <FlatList
                data={subCategoryItems}
                renderItem={renderSubCategoryItem}
                keyExtractor={item => item.value}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subTabsContentContainer}
                pointerEvents="auto"
                bounces={true}
                scrollEnabled={true}
                decelerationRate="normal"
                removeClippedSubviews={false}
                scrollEventThrottle={16}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    paddingBottom: MarketNewsBrand.spacing.xs,
    paddingTop: MarketNewsBrand.spacing.sm,
  },
  tabsContainer: {
    marginBottom: 0,
    paddingBottom: MarketNewsBrand.spacing.xs,
    backgroundColor: MarketNewsBrand.colors.background.surface,
  },
  tabsContentContainer: {
    paddingHorizontal: MarketNewsBrand.spacing.md,
    gap: 4, // 减小间距
  },
  mainTab: {
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    paddingVertical: MarketNewsBrand.spacing.xs,
    borderRadius: MarketNewsBrand.borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // 减小间距
    position: 'relative',
  },
  selectedMainTab: {
    backgroundColor: 'transparent',
  },
  mainTabText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  selectedMainTabText: {
    color: MarketNewsBrand.colors.primary[500],
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    letterSpacing: 0.3,
    // 添加下划线效果
    borderBottomWidth: 3,
    borderBottomColor: MarketNewsBrand.colors.primary[500],
    paddingBottom: 2,
  },
  dropdownWrapper: {
    paddingHorizontal: 20,
    zIndex: 3000,
    position: 'relative',
  },
  dropdownStyle: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: MarketNewsBrand.borderRadius.lg,
    minHeight: 48,
    elevation: 2,
  },
  dropdownContainerStyle: {
    marginBottom: 0,
  },
  dropdownTextStyle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  dropdownLabelStyle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  dropdownPlaceholderStyle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
  },
  dropDownContainerStyle: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: MarketNewsBrand.borderRadius.lg,
    elevation: 8,
  },
  listItemContainerStyle: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  listItemLabelStyle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
  },
  selectedItemContainerStyle: {
    backgroundColor: '#F8FFFE',
  },
  selectedItemLabelStyle: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  subTabsContainer: {
    marginTop: MarketNewsBrand.spacing.xs,
    paddingTop: MarketNewsBrand.spacing.sm,
    paddingBottom: MarketNewsBrand.spacing.xs,
    backgroundColor: 'transparent',
    // 在第一二层之间加柔和的分隔线
    borderTopWidth: 0.5, // 更细的线条
    borderTopColor: 'rgba(0, 0, 0, 0.08)', // 更灰的颜色
    // 添加轻微的上阴影效果
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  subTabsContentContainer: {
    paddingLeft: MarketNewsBrand.spacing.lg,
    paddingRight: 80, // 增加更多右侧空间
    gap: 2, // 进一步减小间距
    flexGrow: 1, // 让内容自然扩展
  },
  subTab: {
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    paddingVertical: MarketNewsBrand.spacing.xs,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minWidth: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6, // 进一步减小间距
  },
  selectedSubTab: {
    backgroundColor: 'rgba(18, 209, 142, 0.03)', // 非常淡的背景
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  subTabText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  selectedSubTabText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.primary[400], // 稍微淡一点的颜色
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold, // 减少字重
    letterSpacing: 0.2,
    // 去掉下划线，使用更subtle的效果
  },
  subCategoryTab: {
    // 继承 subTab 的样式
  },
  selectedSubCategoryTab: {
    backgroundColor: 'rgba(18, 209, 142, 0.03)', // 非常淡的背景
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  subCategoryTabText: {
    // 继承 subTabText 的样式
  },
  selectedSubCategoryTabText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.primary[400], // 稍微淡一点的颜色
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold, // 减少字重
    letterSpacing: 0.2,
    // 去掉下划线，使用更subtle的效果
  },
}); 