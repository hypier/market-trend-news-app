/**
 * 国家选择器组件
 * 用于股票排行榜选择国家代码
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import { useTranslation } from '@/hooks/useTranslation';

interface CountrySelectorProps {
  /** 是否显示 */
  visible: boolean;

  /** 当前选中的国家代码 */
  currentCountry: string;

  /** 排行榜显示名称 */
  leaderboardName?: string;

  /** 选择回调 */
  onSelect: (country: string) => void;

  /** 关闭回调 */
  onClose: () => void;
}

export function CountrySelector({
  visible,
  currentCountry,
  leaderboardName,
  onSelect,
  onClose,
}: CountrySelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载国家列表
  useEffect(() => {
    if (visible) {
      console.log('[CountrySelector] Modal opened, loading countries...');
      setIsLoading(true);
      try {
        const data = require('@/config/market_code.json');
        console.log('[CountrySelector] Loaded data:', data);
        if (data.success && Array.isArray(data.data)) {
          console.log('[CountrySelector] Setting countries:', data.data.length, 'items');
          setCountries(data.data);
        }
      } catch (error) {
        console.error('[CountrySelector] Failed to load countries:', error);
        setCountries(['america', 'japan', 'korea', 'china', 'hongkong']);
      } finally {
        setIsLoading(false);
      }
    }
  }, [visible]);

  // 搜索过滤
  const filteredCountries = useMemo(() => {
    console.log('[CountrySelector] Filtering countries, total:', countries.length);
    if (!searchQuery.trim()) {
      console.log('[CountrySelector] No search query, returning all countries');
      return countries;
    }

    const query = searchQuery.toLowerCase();
    const filtered = countries.filter(code => {
      const name = t(`leaderboard.sheet.marketCodes.${code}`);
      return code.toLowerCase().includes(query) ||
             name.toLowerCase().includes(query);
    });
    console.log('[CountrySelector] Filtered to:', filtered.length, 'countries');
    return filtered;
  }, [countries, searchQuery, t]);

  // 处理国家选择
  const handleSelect = (country: string) => {
    onSelect(country);
    setSearchQuery('');
  };

  // 渲染国家项
  const renderCountryItem = ({ item }: { item: string }) => {
    const isSelected = item === currentCountry;
    const countryName = t(`leaderboard.sheet.marketCodes.${item}`);
    console.log('[CountrySelector] Rendering country:', item, countryName);

    return (
      <TouchableOpacity
        style={[styles.countryItem, isSelected && styles.countryItemSelected]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.countryItemLeft}>
          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.countryName}>{countryName}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={MarketNewsBrand.colors.primary[400]} />
        )}
      </TouchableOpacity>
    );
  };

  console.log('[CountrySelector] Rendering, visible:', visible, 'countries:', filteredCountries.length);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          {/* 标题 */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('leaderboard.sheet.selectCountry')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={MarketNewsBrand.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 搜索框 */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={MarketNewsBrand.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('leaderboard.sheet.search')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={MarketNewsBrand.colors.text.secondary}
            />
          </View>

          {/* 国家列表 */}
          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item}
            style={styles.list}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContent: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.border.default,
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: MarketNewsBrand.colors.text.primary,
  } as TextStyle,
  closeButton: {
    padding: 4,
  } as ViewStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: MarketNewsBrand.colors.text.primary,
  } as TextStyle,
  list: {
    flex: 1,
    minHeight: 200,
  } as ViewStyle,
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.border.default,
  } as ViewStyle,
  countryItemSelected: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  } as ViewStyle,
  countryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: MarketNewsBrand.colors.border.default,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  radioSelected: {
    borderColor: MarketNewsBrand.colors.primary[400],
  } as ViewStyle,
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MarketNewsBrand.colors.primary[400],
  } as ViewStyle,
  countryName: {
    fontSize: 16,
    color: MarketNewsBrand.colors.text.primary,
  } as TextStyle,
});
