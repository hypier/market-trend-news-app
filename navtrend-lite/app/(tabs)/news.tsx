import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NewsFlashTab } from '../../components/news';
import { CommonHeader } from '../../components/ui';
import { MarketNewsBrand } from '@/config/brand';

/**
 * 新闻页面 - 显示 TradingView 新闻快讯
 */
export default function NewsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CommonHeader
        iconName="newspaper"
        titleKey="components.news.header.title"
        subtitleKey="components.news.header.subtitle"
        showSearchButton={false}
      />
      
      <View style={styles.content}>
        <NewsFlashTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  content: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
}); 