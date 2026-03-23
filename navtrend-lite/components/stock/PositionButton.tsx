/**
 * 持仓按钮组件
 * 
 * 功能：
 * - 显示当前持仓数量（如果有）
 * - 提供增加持仓的入口
 * - 处理未登录状态
 * - 支持加载状态显示
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import { useTranslation } from '@/hooks/useTranslation';

interface PositionButtonProps {
  hasPosition: boolean;
  positionQuantity: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  onPress: () => void;
  symbol: string;
}

export const PositionButton = React.memo(function PositionButton({
  hasPosition,
  positionQuantity,
  isAuthenticated,
  isLoading,
  onPress,
  symbol,
}: PositionButtonProps) {
  const { t } = useTranslation();
  
  // 按钮文本和样式
  const getButtonContent = () => {
    if (!isAuthenticated) {
      return {
        text: t('components.stock.position.button.loginToAdd'),
        icon: 'log-in-outline' as const,
        style: styles.loginButton,
        textStyle: styles.loginButtonText,
      };
    }
    
    if (hasPosition) {
      return {
        text: `${t('components.stock.position.button.holdings')} ${positionQuantity} ${t('components.stock.position.button.shares')}`,
        icon: 'trending-up' as const,
        style: styles.addButton,
        textStyle: styles.addButtonText,
      };
    }
    
    return {
      text: t('components.stock.position.button.addPosition'),
      icon: 'add-circle-outline' as const,
      style: styles.buyButton,
      textStyle: styles.buyButtonText,
    };
  };
  
  const buttonContent = getButtonContent();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, buttonContent.style, isLoading && styles.buttonLoading]}
        onPress={onPress}
        disabled={isLoading}
        activeOpacity={0.8}
        
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.buttonContent}>
            <Ionicons 
              name={buttonContent.icon} 
              size={20} 
              color={buttonContent.textStyle.color}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={[styles.buttonText, buttonContent.textStyle]}>
                {buttonContent.text}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在关键状态变化时重渲染
  return (
    prevProps.hasPosition === nextProps.hasPosition &&
    prevProps.positionQuantity === nextProps.positionQuantity &&
    prevProps.isAuthenticated === nextProps.isAuthenticated &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.symbol === nextProps.symbol
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  buttonSubtext: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    opacity: 0.9,
    marginTop: 2,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  // 登录按钮样式
  loginButton: {
    backgroundColor: MarketNewsBrand.colors.primary[500],
    borderWidth: 0,
  },
  loginButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
  },
  // 增加持仓按钮样式（首次购买）
  buyButton: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderWidth: 0,
  },
  buyButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
  },
  // 增加持仓按钮样式（已有持仓）
  addButton: {
    backgroundColor: MarketNewsBrand.colors.market.successBg,
    borderWidth: 2,
    borderColor: MarketNewsBrand.colors.primary[400],
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: MarketNewsBrand.colors.primary[400],
    fontFamily: 'Inter-Bold',
  },
}); 