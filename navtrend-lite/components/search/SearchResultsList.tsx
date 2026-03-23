import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SearchResultItem } from './SearchResultItem';
import type { TVSearchResultItem } from '@/types/tradingview';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand, getBrandSpacing } from '@/config/brand';

interface SearchResultsListProps {
  results: TVSearchResultItem[];
  onItemPress: (id: string) => void;
  fadeAnim: Animated.Value;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({ results, onItemPress, fadeAnim }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.resultsCount}>{results.length}</Text>
        <Text style={styles.resultsText}>{t('search.searchResultsCount')}</Text>
      </View>
      
      <View style={styles.list}>
        {results.map((item, index) => {
          const uniqueKey = `${item.symbol}-${item.exchange}-${item.type}-${index}`;
          return <SearchResultItem key={uniqueKey} item={item} onPress={onItemPress} />;
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getBrandSpacing('lg'),
    paddingVertical: getBrandSpacing('sm'),
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.secondary,
  },
  resultsCount: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.primary[600],
    marginRight: 6,
  },
  resultsText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.secondary,
  },
  list: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
});

