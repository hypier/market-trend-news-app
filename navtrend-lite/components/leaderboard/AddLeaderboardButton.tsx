/**
 * 添加排行榜按钮组件
 * 在分类tabs最右端显示加号按钮，点击打开自定义排行榜创建界面
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';

interface AddLeaderboardButtonProps {
  /** 点击回调 */
  onPress: () => void;
  
  /** 是否禁用 */
  disabled?: boolean;
}

export function AddLeaderboardButton({ 
  onPress, 
  disabled = false 
}: AddLeaderboardButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons
        name="add-circle"
        size={20}
        color={disabled ? MarketNewsBrand.colors.text.disabled : MarketNewsBrand.colors.primary[400]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
