import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../hooks/useTranslation';
import Constants from 'expo-constants';
import { Logo } from '../../components/ui';
import { MarketNewsBrand, getBrandColor, getBrandSpacing, getBrandFontSize } from '@/config/brand';

export default function AboutScreen() {
  const { t } = useTranslation();

  const appInfo = {
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Platform.select({
      ios: Constants.expoConfig?.ios?.buildNumber || '1',
      android: Constants.expoConfig?.android?.versionCode?.toString() || '1',
      default: '1'
    }),
    releaseDate: Constants.expoConfig?.extra?.releaseDate || '1.0.0',
  };

  const links = [
    {
      id: 'website',
      title: t('profile.about.officialWebsite'),
      url: 'https://www.marketrendnews.top/',
      icon: 'globe-outline',
    },
  ];

  const features = [
    {
      icon: 'pulse',
      text: t('profile.about.features.realTimeQuotes'),
      color: getBrandColor('semantic.success'),
    },
    {
      icon: 'analytics',
      text: t('profile.about.features.technicalAnalysis'),
      color: getBrandColor('primary.400'),
    },
    {
      icon: 'wallet',
      text: t('profile.about.features.simulatedPortfolio'),
      color: getBrandColor('market.volume'),
    },
    {
      icon: 'newspaper',
      text: t('profile.about.features.financialNews'),
      color: getBrandColor('semantic.warning'),
    },
  ];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: t('profile.aboutApp'),
          headerShown: true,
          headerStyle: {
            backgroundColor: MarketNewsBrand.colors.primary[400],
          },
          headerTintColor: MarketNewsBrand.colors.text.inverse,
          headerTitleStyle: {
            fontWeight: MarketNewsBrand.typography.fontWeight.bold,
            fontSize: getBrandFontSize('lg'),
          },
        }} 
      />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section with Gradient */}
          <LinearGradient
            colors={MarketNewsBrand.colors.gradients.hero as [string, string, ...string[]]}
            style={styles.heroSection}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.logoContainer}>
                <Logo size={80} variant="full" showText={false} />
              </View>
              <Text style={styles.appName}>MarketNews</Text>
              <Text style={styles.appSlogan}>{t('profile.about.slogan')}</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.version}>
                  v{appInfo.version} ({appInfo.buildNumber})
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* App Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons 
                  name="information-circle" 
                  size={24} 
                  color={getBrandColor('primary.400')} 
                />
              </View>
              <Text style={styles.sectionTitle}>{t('profile.about.aboutTitle')}</Text>
            </View>
            <Text style={styles.description}>
              {t('profile.about.description')}
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons 
                  name="star" 
                  size={24} 
                  color={getBrandColor('semantic.warning')} 
                />
              </View>
              <Text style={styles.sectionTitle}>{t('profile.about.coreFeatures')}</Text>
            </View>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '15' }]}>
                    <Ionicons 
                      name={feature.icon as any} 
                      size={18} 
                      color={feature.color} 
                    />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons 
                  name="link" 
                  size={24} 
                  color={getBrandColor('primary.400')} 
                />
              </View>
              <Text style={styles.sectionTitle}>{t('profile.about.followUs')}</Text>
            </View>
            {links.map((link, index) => (
              <TouchableOpacity
                key={link.id}
                style={[
                  styles.linkCard, 
                  index === links.length - 1 && styles.lastLinkCard
                ]}
                onPress={() => handleLinkPress(link.url)}
                activeOpacity={0.7}
              >
                <View style={styles.linkContent}>
                  <View style={styles.linkIconContainer}>
                    <Ionicons 
                      name={link.icon as any} 
                      size={22} 
                      color={getBrandColor('primary.400')} 
                    />
                  </View>
                  <Text style={styles.linkText}>{link.title}</Text>
                </View>
                <View style={styles.linkArrow}>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={getBrandColor('text.tertiary')} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.copyright}>
              © 2025 MarketNews. {t('profile.about.copyright')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getBrandSpacing('xl'),
  },
  heroSection: {
    paddingVertical: getBrandSpacing('xxxl'),
    paddingHorizontal: getBrandSpacing('lg'),
    marginBottom: getBrandSpacing('lg'),
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MarketNewsBrand.colors.text.inverse + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getBrandSpacing('lg'),
    ...MarketNewsBrand.shadow.lg,
  },
  appName: {
    fontSize: getBrandFontSize('4xl'),
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.inverse,
    marginBottom: getBrandSpacing('sm'),
    textAlign: 'center',
  },
  appSlogan: {
    fontSize: getBrandFontSize('lg'),
    color: MarketNewsBrand.colors.text.inverse + 'e6',
    marginBottom: getBrandSpacing('lg'),
    textAlign: 'center',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  versionBadge: {
    backgroundColor: MarketNewsBrand.colors.text.inverse + '33',
    borderRadius: MarketNewsBrand.borderRadius.full,
    paddingHorizontal: getBrandSpacing('lg'),
    paddingVertical: getBrandSpacing('sm'),
  },
  version: {
    fontSize: getBrandFontSize('sm'),
    color: MarketNewsBrand.colors.text.inverse,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    textAlign: 'center',
  },
  section: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    marginHorizontal: getBrandSpacing('md'),
    marginBottom: getBrandSpacing('md'),
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: getBrandSpacing('md'),
    ...MarketNewsBrand.shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getBrandSpacing('sm'),
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getBrandSpacing('md'),
  },
  sectionTitle: {
    fontSize: getBrandFontSize('xl'),
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    flex: 1,
  },
  description: {
    fontSize: getBrandFontSize('md'),
    color: MarketNewsBrand.colors.text.secondary,
    lineHeight: getBrandFontSize('md') * MarketNewsBrand.typography.lineHeight.relaxed,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: getBrandSpacing('sm'),
  },
  featureCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: getBrandSpacing('sm'),
    paddingHorizontal: getBrandSpacing('xs'),
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getBrandSpacing('xs'),
  },
  featureText: {
    fontSize: getBrandFontSize('xs'),
    color: MarketNewsBrand.colors.text.primary,
    textAlign: 'center',
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    lineHeight: getBrandFontSize('xs') * 1.3,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getBrandSpacing('md'),
    paddingHorizontal: getBrandSpacing('sm'),
    marginBottom: getBrandSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getBrandSpacing('md'),
  },
  linkText: {
    fontSize: getBrandFontSize('md'),
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    flex: 1,
  },
  linkArrow: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastLinkCard: {
    borderBottomWidth: 0,
  },
  footer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    marginHorizontal: getBrandSpacing('md'),
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: getBrandSpacing('xl'),
    alignItems: 'center',
    ...MarketNewsBrand.shadow.sm,
  },
  footerDivider: {
    width: '30%',
    height: 3,
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderRadius: MarketNewsBrand.borderRadius.full,
    marginBottom: getBrandSpacing('lg'),
  },
  copyright: {
    fontSize: getBrandFontSize('sm'),
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    lineHeight: getBrandFontSize('sm') * MarketNewsBrand.typography.lineHeight.relaxed,
  },
}); 