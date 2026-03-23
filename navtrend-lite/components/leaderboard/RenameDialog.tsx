/**
 * 重命名对话框组件
 * 用于重命名分类或排行榜
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MarketNewsBrand } from '@/config/brand';
import { useTranslation } from '@/hooks/useTranslation';

interface RenameDialogProps {
  /** 是否显示对话框 */
  visible: boolean;
  
  /** 对话框标题 */
  title: string;
  
  /** 原名称（显示用） */
  originalName: string;
  
  /** 当前自定义名称 */
  customName: string;
  
  /** 名称变化回调 */
  onChangeText: (text: string) => void;
  
  /** 取消回调 */
  onCancel: () => void;
  
  /** 保存回调 */
  onSave: () => void;
}

export function RenameDialog({
  visible,
  title,
  originalName,
  customName,
  onChangeText,
  onCancel,
  onSave,
}: RenameDialogProps) {
  const { t } = useTranslation();
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />
        
        <View style={styles.dialog}>
          <View style={styles.content}>
            {/* 标题 */}
            <Text style={styles.dialogTitle}>{title}</Text>
            
            {/* 名称输入 */}
            <View style={styles.section}>
              <Text style={styles.label}>
                {t('leaderboard.rename.originalName')}: <Text style={styles.originalText}>{originalName}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={customName}
                onChangeText={onChangeText}
                placeholder={t('leaderboard.rename.placeholder')}
                placeholderTextColor="#9CA3AF"
                autoFocus
                selectTextOnFocus
                maxLength={50}
              />
              <Text style={styles.hint}>{t('leaderboard.rename.hint')}</Text>
            </View>
            
            {/* 按钮组 */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>{t('leaderboard.rename.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={onSave}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[MarketNewsBrand.colors.primary[400], MarketNewsBrand.colors.primary[500]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Text style={styles.saveText}>{t('leaderboard.rename.save')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: '85%',
    maxWidth: 400,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 20,
  },
  dialogTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 10,
  },
  originalText: {
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
  },
  input: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.primary,
    padding: 12,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.border,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  hint: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    marginTop: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.inverse,
  },
});

