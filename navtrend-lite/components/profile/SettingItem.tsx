import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';

export interface SettingItemData {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'switch' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  textColor?: string;
  disabled?: boolean;
}

interface SettingItemProps {
  item: SettingItemData;
}

export default function SettingItem({ item }: SettingItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingItem, item.disabled && styles.disabledItem]}
      onPress={item.onPress}
      disabled={item.type === 'switch' || item.disabled}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons 
            name={item.icon as any} 
            size={24} 
            color={item.disabled ? "#ccc" : (item.textColor || MarketNewsBrand.colors.text.secondary)} 
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle, 
            item.textColor && { color: item.textColor },
            item.disabled && styles.disabledText
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, item.disabled && styles.disabledText]}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#ccc', true: MarketNewsBrand.colors.primary[400] }}
            thumbColor="#fff"
            disabled={item.disabled}
          />
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={item.disabled ? "#ddd" : "#ccc"} 
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  settingRight: {
    marginLeft: 12,
  },
  disabledItem: {
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  disabledText: {
    color: MarketNewsBrand.colors.text.tertiary,
  },
}); 