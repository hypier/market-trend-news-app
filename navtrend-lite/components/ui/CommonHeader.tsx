import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';

interface CommonHeaderProps {
  iconName: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  showSearchButton?: boolean;
  searchRoute?: string;
  onSearchPress?: () => void;
}

export const CommonHeader: React.FC<CommonHeaderProps> = ({
  iconName,
  titleKey,
  subtitleKey,
  showSearchButton = false,
  searchRoute,
  onSearchPress,
}) => {
  const { t } = useTranslation();
  
  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else if (searchRoute) {
      router.push(searchRoute as any);
    }
  };
  
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Ionicons 
            name={iconName}
            size={24} 
            color={MarketNewsBrand.colors.primary[400]}
            style={styles.titleIcon} 
          />
          <Text style={styles.title}>{t(titleKey)}</Text>
        </View>
        <Text style={styles.subtitle}>{t(subtitleKey)}</Text>
      </View>
      
      {showSearchButton && (
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={24} color={MarketNewsBrand.colors.text.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: MarketNewsBrand.spacing.md,
    paddingBottom: MarketNewsBrand.spacing.sm,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleIcon: {
    marginRight: MarketNewsBrand.spacing.xs,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.primary[400],
  },
  subtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: MarketNewsBrand.borderRadius.full,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: MarketNewsBrand.spacing.sm,
  },
});