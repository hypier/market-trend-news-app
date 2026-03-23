import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import SettingItem, { SettingItemData } from './SettingItem';

interface SettingSectionProps {
  title: string;
  items: SettingItemData[];
}

export default function SettingSection({ title, items }: SettingSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <SettingItem key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
}); 