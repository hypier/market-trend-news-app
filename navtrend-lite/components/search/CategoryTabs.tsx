import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand, getBrandSpacing } from '@/config/brand';

interface CategoryTabsProps {
  categories: { code: string }[];
  selectedCategory: string;
  onCategoryChange: (categoryCode: string) => void;
  categoryCounts?: Map<string, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}) => {
  const { t } = useTranslation();

  const renderCategoryTab = ({ item }: { item: { code: string } }) => {
    const isSelected = (item.code === 'all' && !selectedCategory) || selectedCategory === item.code;
    const displayName = t(`assetCategory.${item.code.toUpperCase()}`);
    const count = categoryCounts?.get(item.code.toLowerCase()) || 0;

    return (
      <TouchableOpacity
        style={[styles.categoryTab, isSelected && styles.selectedCategoryTab]}
        onPress={() => onCategoryChange(item.code)}
        activeOpacity={0.8}
      >
        <Text style={[styles.categoryTabText, isSelected && styles.selectedCategoryTabText]}>
          {displayName}
          {count > 0 && (
            <Text style={[styles.countText, isSelected && styles.selectedCountText]}>
              {' '}
              {count}
            </Text>
          )}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategoryTab}
        keyExtractor={(item) => item.code}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: getBrandSpacing('xs'),
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.secondary,
  },
  contentContainer: {
    paddingHorizontal: getBrandSpacing('lg'),
    gap: getBrandSpacing('sm'),
  },
  categoryTab: {
    paddingHorizontal: getBrandSpacing('sm'),
    paddingVertical: getBrandSpacing('xs'),
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedCategoryTab: {
    borderBottomColor: MarketNewsBrand.colors.primary[400],
  },
  categoryTabText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    textAlign: 'center',
  },
  selectedCategoryTabText: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  countText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
  },
  selectedCountText: {
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
});

