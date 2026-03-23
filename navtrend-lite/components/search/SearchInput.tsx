import React, { forwardRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand, getBrandSpacing } from '@/config/brand';

interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  ({ value, onChangeText, onClear, isFocused, onFocus, onBlur, ...props }, ref) => {
    const { t } = useTranslation();

    return (
      <View style={styles.container}>
        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
          <Ionicons
            name="search"
            size={22}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            ref={ref}
            style={styles.input}
            placeholder={t('search.placeholder')}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus
            returnKeyType="search"
            autoCapitalize="characters"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
            {...props}
          />
          {value && value.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

SearchInput.displayName = 'SearchInput';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getBrandSpacing('lg'),
    paddingVertical: getBrandSpacing('sm'),
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    paddingHorizontal: getBrandSpacing('md'),
    height: 44,
    borderWidth: 0,
  },
  inputContainerFocused: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  searchIcon: {
    marginRight: getBrandSpacing('sm'),
  },
  input: {
    flex: 1,
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    height: '100%',
  },
  clearButton: {
    marginLeft: getBrandSpacing('xs'),
    padding: 4,
  },
});

