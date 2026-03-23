import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';

interface UserProfileCardProps {
  isLoggedIn: boolean;
  user?: {
    name: string;
    email: string;
    accountType: string;
    picture?: string;
  };
  onLogin: () => void;
}

export default function UserProfileCard({ 
  isLoggedIn, 
  user, 
  onLogin 
}: UserProfileCardProps) {
  const { t } = useTranslation();

  if (!isLoggedIn) {
    return (
      <View style={styles.loginCard}>
        <View style={styles.loginContent}>
          <View style={styles.loginIconContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.loginTextContainer}>
            <Text style={styles.loginTitle}>{t('profile.welcome')}</Text>
            <Text style={styles.loginSubtitle}>
              {t('profile.signInDesc')}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={onLogin}
          activeOpacity={0.8}
        >
          <Ionicons name="log-in-outline" size={18} color={MarketNewsBrand.colors.text.inverse} style={styles.loginButtonIcon} />
          <Text style={styles.loginButtonText}>{t('profile.signIn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderAvatar = () => {
    if (user?.picture) {
      return (
        <Image 
          source={{ uri: user.picture }}
          style={styles.avatarImage}
        />
      );
    }
    
    return (
      <View style={styles.avatar}>
        <Ionicons name="person" size={40} color={MarketNewsBrand.colors.text.inverse} />
      </View>
    );
  };

  return (
    <View style={styles.userSection}>
      <View style={styles.userContent}>
        {renderAvatar()}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || 'John Doe'}</Text>
          <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="middle">
            {user?.email || 'john.doe@example.com'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loginCard: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    padding: 20,
    marginBottom: 10
  },
  loginContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginIconContainer: {
    width: 64,
    height: 64,
    borderRadius: MarketNewsBrand.borderRadius.full, // 使用极大值确保完全圆形
    backgroundColor: MarketNewsBrand.colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    // 创建立体阴影效果
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    // 添加边框增强圆形效果
    borderWidth: 2,
    borderColor: MarketNewsBrand.colors.primary[400] + '33',
    // 确保内容居中且圆形效果明显
    overflow: 'hidden',
  },
  logoImage: {
    width: 48,
    height: 48,
    // 让logo本身也是圆形，与容器匹配
    borderRadius: MarketNewsBrand.borderRadius.full,
    backgroundColor: 'transparent',
  },
  loginTextContainer: {
    flex: 1,
  },
  loginTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonIcon: {
    marginRight: 6,
  },
  loginButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.inverse,
    letterSpacing: 0.3,
  },
  userSection: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    padding: 20,
    marginBottom: 10
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: MarketNewsBrand.colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginRight: 16,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 4,
    flexShrink: 1,
  },
}); 