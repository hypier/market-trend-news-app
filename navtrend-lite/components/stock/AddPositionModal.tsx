/**
 * 增加持仓模态框组件
 * 
 * 功能：
 * - 显示股票基本信息
 * - 输入持仓数量和平均成本
 * - 计算总成本
 * - 表单验证
 * - 提交持仓数据
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import type { StockDetail, StockQuote } from '@/types/stock';
import { useTranslation } from '@/hooks/useTranslation';

interface AddPositionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: { shares: string; avgCost: string }) => Promise<void>;
  stockDetail: StockDetail | null;
  stockQuote: StockDetail | StockQuote | null;
  symbol: string;
  stockLogo?: string | null;
  isLoading?: boolean;
  hasExistingPosition?: boolean;
  existingShares?: number;
}



export function AddPositionModal({
  visible,
  onClose,
  onSubmit,
  stockDetail,
  stockQuote,
  symbol,
  stockLogo,
  isLoading = false,
  hasExistingPosition = false,
  existingShares = 0,
}: AddPositionModalProps) {
  const { t } = useTranslation();
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [errors, setErrors] = useState<{ shares?: string; avgCost?: string }>({});
  
  // 当前价格 - 优先使用实时报价，否则使用详情数据
  const currentPrice = stockQuote?.price || stockDetail?.price || 0;
  const stockName = stockDetail?.name || stockQuote?.name || symbol;
  
  // 计算总成本
  const totalCost = shares && avgCost ? 
    (parseFloat(shares) * parseFloat(avgCost)).toFixed(2) : '0.00';
  
  // 重置表单
  const resetForm = useCallback(() => {
    setShares('');
    setAvgCost(currentPrice.toString());
    setErrors({});
  }, [currentPrice]);
  
  // 验证表单
  const validateForm = useCallback(() => {
    const newErrors: { shares?: string; avgCost?: string } = {};
    
    // 验证股数
    if (!shares.trim()) {
      newErrors.shares = t('components.stock.position.modal.validation.sharesRequired');
    } else {
      const sharesNum = parseFloat(shares);
      if (isNaN(sharesNum) || sharesNum <= 0) {
        newErrors.shares = t('components.stock.position.modal.validation.sharesPositive');
      } else if (sharesNum > 999999) {
        newErrors.shares = t('components.stock.position.modal.validation.sharesMax');
      }
    }
    
    // 验证平均成本
    if (!avgCost.trim()) {
      newErrors.avgCost = t('components.stock.position.modal.validation.costRequired');
    } else {
      const costNum = parseFloat(avgCost);
      if (isNaN(costNum) || costNum <= 0) {
        newErrors.avgCost = t('components.stock.position.modal.validation.costPositive');
      } else if (costNum > 999999) {
        newErrors.avgCost = t('components.stock.position.modal.validation.costMax');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [shares, avgCost, t]);
  
  // 处理提交
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit({ shares, avgCost });
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert(t('components.stock.position.modal.error.title'), error.message || t('components.stock.position.modal.error.retry'));
    }
  }, [shares, avgCost, validateForm, onSubmit, resetForm, onClose, t]);
  
  // 使用当前价格填充平均成本
  const useCurrentPrice = useCallback(() => {
    if (currentPrice > 0) {
      setAvgCost(currentPrice.toFixed(2));
      setErrors(prev => ({ ...prev, avgCost: undefined }));
    }
  }, [currentPrice]);
  
  // 当模态框打开时重置表单并设置默认价格
  useEffect(() => {
    if (visible) {
      resetForm();
      if (currentPrice > 0) {
        setAvgCost(currentPrice.toFixed(2));
      }
    }
  }, [visible, resetForm, currentPrice]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('components.stock.position.modal.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 股票信息 */}
            <View style={styles.stockSection}>
              <View style={styles.stockInfoRow}>
                {stockLogo && (
                  <Image 
                    source={{ uri: stockLogo }} 
                    style={styles.stockLogo}
                    onError={() => {}} // Logo加载失败
                  />
                )}
                <View style={styles.stockInfo}>
                  <Text style={styles.stockSymbol}>{symbol}</Text>
                  <Text style={styles.stockName}>{stockName}</Text>
                </View>
              </View>
              <Text style={styles.currentPrice}>${currentPrice.toFixed(2)}</Text>
            </View>
            
            {/* 现有持仓 */}
            {hasExistingPosition && (
              <View style={styles.existingCard}>
                <Text style={styles.existingLabel}>{t('components.stock.position.modal.existingPosition')}</Text>
                <Text style={styles.existingValue}>{existingShares} {t('components.stock.position.button.shares')}</Text>
              </View>
            )}
            
            {/* 输入表单 */}
            <View style={styles.inputCard}>
              {/* 股数输入 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('components.stock.position.modal.shares')}</Text>
                <TextInput
                  style={[styles.input, errors.shares && styles.inputError]}
                  value={shares}
                  onChangeText={setShares}
                  placeholder={t('components.stock.position.modal.sharesPlaceholder')}
                  placeholderTextColor={MarketNewsBrand.colors.text.tertiary}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!isLoading}
                  returnKeyType="next"
                />
                {errors.shares && (
                  <Text style={styles.errorText}>{errors.shares}</Text>
                )}
              </View>
              
              {/* 成本输入 */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>{t('components.stock.position.modal.avgCost')}</Text>
                  <TouchableOpacity onPress={useCurrentPrice} style={styles.currentButton}>
                    <Text style={styles.currentButtonText}>{t('components.stock.position.modal.currentPrice')}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, errors.avgCost && styles.inputError]}
                  value={avgCost}
                  onChangeText={setAvgCost}
                  placeholder={t('components.stock.position.modal.avgCostPlaceholder')}
                  placeholderTextColor={MarketNewsBrand.colors.text.tertiary}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={!isLoading}
                  returnKeyType="done"
                />
                {errors.avgCost && (
                  <Text style={styles.errorText}>{errors.avgCost}</Text>
                )}
              </View>
            </View>
            
            {/* 总计 */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>{t('components.stock.position.modal.totalCost')}</Text>
              <Text style={styles.totalValue}>${totalCost}</Text>
            </View>
          </ScrollView>
          
          {/* 底部按钮 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !shares.trim() || !avgCost.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{t('components.stock.position.modal.submit')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 16,
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  headerSpacer: {
    width: 32,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  
  // 股票信息
  stockSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginBottom: 16,
  },
  stockInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stockLogo: {
    width: 40,
    height: 40,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    marginRight: 12,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 4,
  },
  stockName: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
  },
  currentPrice: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.market.bullish,
  },
  
  // 现有持仓
  existingCard: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  existingLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
  },
  existingValue: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  
  // 输入表单
  inputCard: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: MarketNewsBrand.colors.primary[50],
    borderRadius: MarketNewsBrand.borderRadius.md,
  },
  currentButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.market.bullish,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.border,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    color: MarketNewsBrand.colors.text.primary,
  },
  inputError: {
    borderColor: MarketNewsBrand.colors.semantic.error,
  },
  errorText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.semantic.error,
    marginTop: 4,
  },
  
  // 总计
  totalCard: {
    backgroundColor: MarketNewsBrand.colors.market.bullish,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.inverse,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  totalValue: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: MarketNewsBrand.colors.text.inverse,
  },
  
  // 底部按钮
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: MarketNewsBrand.colors.background.primary,
  },
  submitButton: {
    backgroundColor: MarketNewsBrand.colors.market.bullish,
    paddingVertical: 16,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: MarketNewsBrand.colors.text.disabled,
  },
  submitButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.inverse,
  },
}); 