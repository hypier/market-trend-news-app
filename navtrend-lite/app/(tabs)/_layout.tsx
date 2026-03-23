import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';

export default function TabLayout() {
  const { t } = useTranslation();


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: MarketNewsBrand.colors.primary[400],
        tabBarInactiveTintColor: MarketNewsBrand.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: MarketNewsBrand.colors.background.surface,
          borderTopWidth: 1,
          borderTopColor: MarketNewsBrand.colors.primary[200],
          height: MarketNewsBrand.tokens.navigation.height,
          paddingBottom: MarketNewsBrand.tokens.navigation.paddingBottom,
        },
        tabBarLabelStyle: {
          fontSize: MarketNewsBrand.typography.fontSize.xs,
          fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
        },
        headerStyle: {
          backgroundColor: MarketNewsBrand.colors.primary[400],
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: MarketNewsBrand.colors.text.inverse,
        headerTitleStyle: {
          fontWeight: MarketNewsBrand.typography.fontWeight.bold,
          fontSize: MarketNewsBrand.typography.fontSize.lg,
        },
      }}
    >
      <Tabs.Screen
        name="trading"
        options={{
          title: t('navigation.markets'),
          headerShown: false,
          headerTitle: () => null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: t('navigation.watchlist'),
          headerTitle: t('navigation.watchlist'),
          headerShown: false, // 隐藏系统标题，使用组件内的标题
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wealth"
        options={{
          title: t('navigation.portfolio'),
          headerTitle: t('navigation.portfolio'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="news"
        options={{
          title: t('navigation.news'),
          headerShown: false, // 隐藏系统标题，使用组件内的标题
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          headerTitle: t('navigation.profile'),
          headerShown: false, // 隐藏系统标题，使用组件内的标题
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
