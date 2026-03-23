/**
 * 排行榜自定义管理组件（重构版）
 * 主页面：显示本地配置，支持拖拽排序、重命名、删除
 * 底部：添加排行榜按钮（暂时简化，后续添加 Sheet）
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MarketNewsBrand } from '@/config/brand';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { CategoryCard } from './CategoryCard';
import { RenameDialog } from './RenameDialog';
import { SelectionSheet } from './SelectionSheet';
import { useLeaderboardStore } from '@/stores';
import { useTranslation } from '@/hooks/useTranslation';
import type { LocalLeaderboardCategory } from '@/types/leaderboard';

interface LeaderboardCustomizerProps {
  /** 是否显示模态框 */
  visible: boolean;
  
  /** 关闭模态框回调 */
  onClose: () => void;
}

export function LeaderboardCustomizer({
  visible,
  onClose,
}: LeaderboardCustomizerProps) {
  const { t } = useTranslation();
  
  const {
    localConfig,
    defaultConfig,
    systemConfigs,
    isLoading,
    renameCategory,
    renameLeaderboard,
    reorderCategories,
    reorderLeaderboards,
    deleteLeaderboard,
    deleteCategory,
    createCategory,
    initializeWithDefaultConfig,
    fetchSystemConfigs,
  } = useLeaderboardStore();
  
  // 展开的分类
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['recommended'])
  );
  
  // 重命名对话框状态
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    type: 'category' | 'leaderboard';
    id: string;
    categoryId?: string;
    originalName: string;
    currentCustomName?: string;
  } | null>(null);
  const [customNameInput, setCustomNameInput] = useState('');
  
  // 新增分类对话框状态
  const [createCategoryDialogVisible, setCreateCategoryDialogVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // 重置加载状态
  const [isResetting, setIsResetting] = useState(false);
  
  // 底部Sheet引用
  const sheetRef = useRef<BottomSheet | null>(null);
  
  // 当前要添加排行榜到哪个分类（用于SelectionSheet）
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  
  // 滚动容器引用（用于 auto-scroll）
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  
  // 当组件打开时加载 systemConfigs
  useEffect(() => {
    if (visible && systemConfigs.length === 0 && !isLoading.systemConfigs) {
      fetchSystemConfigs();
    }
  }, [visible, systemConfigs.length, isLoading.systemConfigs, fetchSystemConfigs]);
  
  // 切换分类展开状态
  const toggleCategoryExpand = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);
  
  // 处理分类拖拽排序（Sortable.Grid API）
  const handleCategoryReorder = useCallback(({ data }: { data: (LocalLeaderboardCategory & { key: string })[] }) => {
    const orderedIds = data.map(cat => cat.id);
    reorderCategories(orderedIds);
  }, [reorderCategories]);
  
  // 打开重命名对话框 - 分类
  const handleRenameCategoryClick = useCallback((categoryId: string) => {
    const category = localConfig?.categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    const originalName = category.name_translations.zh || category.name_translations.en;
    
    setRenameTarget({
      type: 'category',
      id: categoryId,
      originalName: originalName || '',
      currentCustomName: category.custom_name,
    });
    // 默认显示原名称，方便用户直接修改
    setCustomNameInput(category.custom_name || originalName || '');
    setRenameDialogVisible(true);
  }, [localConfig]);
  
  // 打开重命名对话框 - 排行榜
  const handleRenameLeaderboardClick = useCallback((categoryId: string, code: string) => {
    const category = localConfig?.categories.find(cat => cat.id === categoryId);
    const item = category?.leaderboards.find(lb => lb.code === code);

    // 先用完整 code 查找（带 :market_code），找不到再去掉 market_code 查找
    let config = defaultConfig?.leaderboards[code];
    if (!config) {
      const leaderboardId = code.split(':')[0];
      config = defaultConfig?.leaderboards[leaderboardId];
    }
    if (!config) {
      const leaderboardId = code.split(':')[0];
      config = systemConfigs.find(c => c.id === leaderboardId);
    }

    if (!item || !config) return;

    const originalName = config.name_translations?.zh || config.name_translations?.en || code;

    setRenameTarget({
      type: 'leaderboard',
      id: code,
      categoryId,
      originalName: originalName || '',
      currentCustomName: item.custom_name,
    });
    // 默认显示原名称，方便用户直接修改
    setCustomNameInput(item.custom_name || originalName || '');
    setRenameDialogVisible(true);
  }, [localConfig, defaultConfig, systemConfigs]);
  
  // 保存重命名
  const handleRenameSave = useCallback(async () => {
    if (!renameTarget) return;
    
    try {
      // 如果输入的名称和原名称相同，清空自定义名称（使用默认名称）
      const trimmedInput = customNameInput.trim();
      const finalName = trimmedInput === renameTarget.originalName ? '' : trimmedInput;
      
      if (renameTarget.type === 'category') {
        await renameCategory(renameTarget.id, finalName);
      } else if (renameTarget.categoryId) {
        await renameLeaderboard(renameTarget.categoryId, renameTarget.id, finalName);
      }
      
      setRenameDialogVisible(false);
      setRenameTarget(null);
      setCustomNameInput('');
    } catch {
      Alert.alert(t('common.error'), t('leaderboard.rename.failed'));
    }
  }, [renameTarget, customNameInput, renameCategory, renameLeaderboard, t]);
  
  // 取消重命名
  const handleRenameCancel = useCallback(() => {
    setRenameDialogVisible(false);
    setRenameTarget(null);
    setCustomNameInput('');
  }, []);
  
  // 保存新增分类
  const handleCreateCategorySave = useCallback(async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      Alert.alert(t('common.error'), t('leaderboard.customizer.categoryNameEmpty'));
      return;
    }
    
    try {
      await createCategory(trimmedName);
      setCreateCategoryDialogVisible(false);
      setNewCategoryName('');
    } catch {
      Alert.alert(t('common.error'), t('leaderboard.customizer.createCategoryFailed'));
    }
  }, [newCategoryName, createCategory, t]);
  
  // 取消新增分类
  const handleCreateCategoryCancel = useCallback(() => {
    setCreateCategoryDialogVisible(false);
    setNewCategoryName('');
  }, []);
  
  // 删除排行榜（带确认）
  const handleDeleteLeaderboard = useCallback((categoryId: string, code: string) => {
    // 先用完整 code 查找，找不到再去掉 market_code 查找
    let config = defaultConfig?.leaderboards[code];
    if (!config) {
      const leaderboardId = code.split(':')[0];
      config = defaultConfig?.leaderboards[leaderboardId];
    }
    const name = config?.name_translations.zh || config?.name_translations.en || code;
    
    Alert.alert(
      t('leaderboard.customizer.confirmDelete'),
      t('leaderboard.customizer.confirmDeleteLeaderboard', { name }),
      [
        { text: t('leaderboard.rename.cancel'), style: 'cancel' },
        {
          text: t('leaderboard.custom.delete'),
          style: 'destructive',
          onPress: () => deleteLeaderboard(categoryId, code),
        },
      ]
    );
  }, [defaultConfig, deleteLeaderboard, t]);
  
  // 删除分类（带确认）
  const handleDeleteCategory = useCallback((categoryId: string) => {
    const category = localConfig?.categories.find(cat => cat.id === categoryId);
    const name = category?.custom_name || 
      category?.name_translations.zh || 
      category?.name_translations.en || 
      categoryId;
    
    Alert.alert(
      t('leaderboard.customizer.confirmDelete'),
      t('leaderboard.customizer.confirmDeleteCategory', { name }),
      [
        { text: t('leaderboard.rename.cancel'), style: 'cancel' },
        {
          text: t('leaderboard.custom.delete'),
          style: 'destructive',
          onPress: () => deleteCategory(categoryId),
        },
      ]
    );
  }, [localConfig, deleteCategory, t]);
  
  // 处理分类内排行榜排序
  const handleLeaderboardReorder = useCallback((categoryId: string, orderedCodes: string[]) => {
    reorderLeaderboards(categoryId, orderedCodes);
  }, [reorderLeaderboards]);
  
  // 打开底部Sheet - 添加排行榜到指定分类
  const handleAddLeaderboardToCategory = useCallback((categoryId: string) => {
    setTargetCategoryId(categoryId);
    sheetRef.current?.expand();
  }, []);
  
  // 打开底部Sheet - 新增分类对话框
  const openCreateCategoryDialog = useCallback(() => {
    setCreateCategoryDialogVisible(true);
  }, []);
  
  // 关闭底部Sheet
  const closeSelectionSheet = useCallback(() => {
    sheetRef.current?.close();
    setTargetCategoryId(null); // 清除目标分类ID
  }, []);
  
  // 重置配置
  const handleResetConfig = useCallback(() => {
    Alert.alert(
      t('leaderboard.customizer.resetTitle'),
      t('leaderboard.customizer.resetConfirm'),
      [
        { 
          text: t('leaderboard.rename.cancel'), 
          style: 'cancel' 
        },
        {
          text: t('leaderboard.customizer.resetButton'),
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await initializeWithDefaultConfig();
              // 重置成功后，折叠所有分类并只展开推荐分类
              setExpandedCategories(new Set(['recommended']));
            } catch {
              Alert.alert(
                t('common.error'),
                t('leaderboard.customizer.resetFailed')
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  }, [t, initializeWithDefaultConfig]);
  
  // 🔧 性能优化：使用 useMemo 缓存带 key 的数据，避免每次渲染都创建新对象
  const categoriesWithKey = useMemo(() => {
    if (!localConfig) return [];
    return localConfig.categories.map(cat => ({ ...cat, key: cat.id }));
  }, [localConfig]);
  
  // 计算统计信息
  const stats = useMemo(() => ({
    totalCategories: localConfig?.categories.length || 0,
    totalLeaderboards: localConfig?.categories.reduce(
      (sum, cat) => sum + cat.leaderboards.length, 
      0
    ) || 0,
  }), [localConfig?.categories]);
  
  // 渲染分类卡片（Sortable.Grid API）
  const renderCategoryCard = useCallback(({ item }: { item: LocalLeaderboardCategory & { key: string } }) => {
    if (!defaultConfig) return null;
    
    return (
      <CategoryCard
        category={item}
        leaderboards={item.leaderboards}
        defaultConfig={defaultConfig}
        systemConfigs={systemConfigs}
        isExpanded={expandedCategories.has(item.id)}
        onExpand={() => toggleCategoryExpand(item.id)}
        onRenameCategory={handleRenameCategoryClick}
        onDeleteCategory={handleDeleteCategory}
        onAddLeaderboard={handleAddLeaderboardToCategory}
        onRenameLeaderboard={(code) => handleRenameLeaderboardClick(item.id, code)}
        onDeleteLeaderboard={(code) => handleDeleteLeaderboard(item.id, code)}
        onReorderLeaderboards={(orderedCodes) => handleLeaderboardReorder(item.id, orderedCodes)}
        scrollableRef={scrollableRef}
      />
    );
  }, [
    defaultConfig,
    systemConfigs,
    expandedCategories,
    toggleCategoryExpand,
    handleRenameCategoryClick,
    handleDeleteCategory,
    handleAddLeaderboardToCategory,
    handleRenameLeaderboardClick,
    handleDeleteLeaderboard,
    handleLeaderboardReorder,
    scrollableRef,
  ]);
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          {/* 渐变背景头部 */}
          <LinearGradient
            colors={['#0EA5E9', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Ionicons name="close-circle" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Ionicons name="options" size={24} color="#FFFFFF" style={styles.titleIcon} />
                <Text style={styles.title}>{t('leaderboard.customizer.title')}</Text>
              </View>
              <TouchableOpacity 
                onPress={handleResetConfig} 
                style={styles.headerButton}
                disabled={isResetting}
              >
                {isResetting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="refresh-circle" size={28} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            
            {/* 统计信息卡片 */}
            <View style={styles.statsCard}>
              <View style={styles.statsItem}>
                <Ionicons name="folder-open" size={24} color="#0EA5E9" />
                <Text style={styles.statsLabel}>{t('leaderboard.customizer.categories')}</Text>
                <Text style={styles.statsValue}>{stats.totalCategories}</Text>
              </View>
              
              <View style={styles.statsDivider} />
              
              <View style={styles.statsItem}>
                <Ionicons name="list" size={24} color="#0EA5E9" />
                <Text style={styles.statsLabel}>{t('leaderboard.customizer.leaderboards')}</Text>
                <Text style={styles.statsValue}>{stats.totalLeaderboards}</Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* 主内容区 */}
          {isLoading.initialization ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text style={styles.loadingText}>{t('leaderboard.customizer.loading')}</Text>
            </View>
          ) : !localConfig ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>{t('leaderboard.customizer.noConfig')}</Text>
            </View>
          ) : (
            <Animated.ScrollView
              ref={scrollableRef}
              style={styles.scrollContainer}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
            >
              {/* 🎯 使用 Sortable.Grid - 单列网格作为垂直列表 */}
              <Sortable.Grid
                data={categoriesWithKey}
                columns={1}
                rowGap={8}
                keyExtractor={(item) => item.key}
                renderItem={renderCategoryCard}
                onDragEnd={handleCategoryReorder}
                scrollableRef={scrollableRef}
                customHandle
                autoScrollEnabled
              />
            </Animated.ScrollView>
          )}
          
          {/* 底部新增分类按钮 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openCreateCategoryDialog}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>{t('leaderboard.customizer.createCategory')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* 重命名对话框 */}
          <RenameDialog
            visible={renameDialogVisible}
            title={renameTarget?.type === 'category' ? t('leaderboard.customizer.renameCategory') : t('leaderboard.customizer.renameLeaderboard')}
            originalName={renameTarget?.originalName || ''}
            customName={customNameInput}
            onChangeText={setCustomNameInput}
            onCancel={handleRenameCancel}
            onSave={handleRenameSave}
          />
          
          {/* 新增分类对话框 */}
          <RenameDialog
            visible={createCategoryDialogVisible}
            title={t('leaderboard.customizer.createCategoryTitle')}
            originalName=""
            customName={newCategoryName}
            onChangeText={setNewCategoryName}
            onCancel={handleCreateCategoryCancel}
            onSave={handleCreateCategorySave}
          />
        </SafeAreaView>
        
        {/* 底部Sheet - 选择排行榜 */}
        <SelectionSheet
          sheetRef={sheetRef}
          targetCategoryId={targetCategoryId}
          onClose={closeSelectionSheet}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  
  // 渐变头部容器
  headerGradient: {
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // 头部样式
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    marginRight: 4,
  },
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.inverse,
    letterSpacing: 0.5,
  },
  
  // 统计信息卡片
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    marginRight: 4,
  },
  statsValue: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    color: MarketNewsBrand.colors.text.primary,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: MarketNewsBrand.colors.border.default,
  },
  
  // 列表容器（关键：flex: 1 让它可以滚动）
  listContainer: {
    flex: 1,
  },
  
  // 嵌套滚动容器
  scrollContainer: {
    flex: 1,
  },
  
  // 列表样式
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 32,
  },
  
  // 加载状态
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: 16,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },
  
  // 空状态
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    marginTop: 16,
  },
  
  // 底部添加按钮
  footer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.border.default,
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.inverse,
  },
});
