/**
 * 新闻快讯详情页面
 * 
 * 显示从TradingView API获取的新闻详细内容
 * 支持AST节点渲染（段落、加粗、股票符号等）
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNewsStore } from '@/stores';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';
import { formatFullDateTime } from '@/utils/timeFormat';
import { RelatedStocks } from '@/components/news/RelatedStocks';
import type { ASTNode } from '@/types/stock';

/**
 * 渲染AST节点为React Native组件
 * 支持HTML和Markdown格式
 */
const renderASTNode = (node: string | ASTNode, index: number): React.ReactNode => {
  // 如果是字符串，清理并返回文本
  if (typeof node === 'string') {
    // 清理段落中的 ** 标记
    let cleanedText = node;
    
    // 1. 清理开头的 ** 标记
    cleanedText = cleanedText.replace(/^\*\*\s*/g, '');
    
    // 2. 清理句子中间的 ** 标记（前后有空格）
    cleanedText = cleanedText.replace(/\s+\*\*\s+/g, ' ');
    
    // 3. 清理行首的 ** 标记（换行后的）
    cleanedText = cleanedText.replace(/\n\*\*\s*/g, '\n');
    
    return cleanedText;
  }

  const { type, children, params } = node;

  // 处理不同类型的节点
  switch (type) {
    // === 段落和标题 ===
    case 'p':
      return (
        <Text key={index} style={styles.paragraph}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'h1':
      return (
        <Text key={index} style={styles.heading1}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'h2':
      return (
        <Text key={index} style={styles.heading2}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'h3':
      return (
        <Text key={index} style={styles.heading3}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'h4':
      return (
        <Text key={index} style={styles.heading4}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'h5':
    case 'h6':
      return (
        <Text key={index} style={styles.heading5}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    // === 文本样式 ===
    case 'b':
    case 'strong':
      return (
        <Text key={index} style={styles.bold}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'em':
    case 'i':
      return (
        <Text key={index} style={styles.italic}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'u':
      return (
        <Text key={index} style={styles.underline}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 's':
    case 'del':
      return (
        <Text key={index} style={styles.strikethrough}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    case 'code':
      // 内联代码
      return (
        <Text key={index} style={styles.inlineCode}>
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    // === 特殊元素 ===
    case 'symbol':
      return (
        <Text key={index} style={styles.symbol}>
          {params?.text || params?.symbol || ''}
        </Text>
      );

    case 'a':
      return (
        <Text
          key={index}
          style={styles.link}
          onPress={() => {
            if (params?.href) {
              Linking.openURL(params.href).catch(err => {
                Logger.error(LogModule.NEWS, '打开链接失败:', err);
              });
            }
          }}
        >
          {children?.map((child, idx) => renderASTNode(child, idx))}
        </Text>
      );

    // === 列表 ===
    case 'ul':
      return (
        <View key={index} style={styles.list}>
          {children?.map((child, idx) => {
            const rendered = renderASTNode(child, idx);
            // 确保列表项被正确处理
            return typeof rendered === 'string' ? (
              <Text key={idx} style={styles.paragraph}>{rendered}</Text>
            ) : rendered;
          })}
        </View>
      );

    case 'ol':
      return (
        <View key={index} style={styles.list}>
          {children?.map((child, idx) => {
            const rendered = renderASTNode(child, idx);
            return (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bulletPoint}>{idx + 1}. </Text>
                <View style={{ flex: 1 }}>
                  {typeof rendered === 'string' ? (
                    <Text style={styles.paragraph}>{rendered}</Text>
                  ) : rendered}
                </View>
              </View>
            );
          })}
        </View>
      );

    case 'li':
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bulletPoint}>• </Text>
          <Text style={styles.listItemText}>
            {children?.map((child, idx) => renderASTNode(child, idx))}
          </Text>
        </View>
      );

    // === 引用块 ===
    case 'blockquote':
      return (
        <View key={index} style={styles.blockquote}>
          <View style={styles.blockquoteBar} />
          <View style={styles.blockquoteContent}>
            {children?.map((child, idx) => {
              const rendered = renderASTNode(child, idx);
              return typeof rendered === 'string' ? (
                <Text key={idx} style={styles.paragraph}>{rendered}</Text>
              ) : rendered;
            })}
          </View>
        </View>
      );

    // === 代码块 ===
    case 'pre':
      return (
        <View key={index} style={styles.codeBlock}>
          <Text style={styles.codeBlockText}>
            {children?.map((child, idx) => {
              if (typeof child === 'string') return child;
              if (typeof child === 'object' && child.type === 'code') {
                return child.children?.join('') || '';
              }
              return renderASTNode(child, idx);
            })}
          </Text>
        </View>
      );

    // === 分隔线 ===
    case 'hr':
      return (
        <View key={index} style={styles.horizontalRule} />
      );

    // === 换行 ===
    case 'br':
      return <Text key={index}>{'\n'}</Text>;

    // === 表格（简化处理）===
    case 'table':
      return (
        <View key={index} style={styles.table}>
          {children?.map((child, idx) => {
            const rendered = renderASTNode(child, idx);
            return typeof rendered === 'string' ? (
              <Text key={idx} style={styles.paragraph}>{rendered}</Text>
            ) : rendered;
          })}
        </View>
      );

    case 'tr':
      return (
        <View key={index} style={styles.tableRow}>
          {children?.map((child, idx) => {
            const rendered = renderASTNode(child, idx);
            return typeof rendered === 'string' ? (
              <Text key={idx} style={styles.paragraph}>{rendered}</Text>
            ) : rendered;
          })}
        </View>
      );

    case 'th':
      return (
        <View key={index} style={styles.tableHeaderCell}>
          <Text style={styles.tableHeaderText}>
            {children?.map((child, idx) => renderASTNode(child, idx))}
          </Text>
        </View>
      );

    case 'td':
      return (
        <View key={index} style={styles.tableCell}>
          <Text style={styles.tableCellText}>
            {children?.map((child, idx) => renderASTNode(child, idx))}
          </Text>
        </View>
      );

    default:
      // 对于未知类型，使用 Text 组件包裹以避免渲染错误
      if (children && children.length > 0) {
        return (
          <Text key={index} style={styles.paragraph}>
            {children.map((child, idx) => renderASTNode(child, idx))}
          </Text>
        );
      }
      return null;
  }
};

export default function NewsFlashDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const {
    newsDetail,
    isLoading,
    error,
    fetchNewsDetail,
  } = useNewsStore();

  // 获取当前新闻详情
  const currentNews = id ? newsDetail[id] : null;

  // 加载新闻详情
  useEffect(() => {
    if (id && !currentNews && !isLoading.newsDetail) {
      fetchNewsDetail(id);
    }
  }, [id, currentNews, isLoading.newsDetail, fetchNewsDetail]);

  // 渲染加载状态
  if (isLoading.newsDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('stock.news') }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('stock.news') }} />
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={MarketNewsBrand.colors.semantic.error}
          />
          <Text style={styles.errorTitle}>{t('common.loadFailed')}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => id && fetchNewsDetail(id)}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 渲染空状态
  if (!currentNews) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('stock.news') }} />
        <View style={styles.centerContainer}>
          <Ionicons
            name="document-outline"
            size={60}
            color={MarketNewsBrand.colors.text.tertiary}
          />
          <Text style={styles.emptyText}>{t('stock.noNewsAvailable')}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Stack.Screen
        options={{
          title: t('stock.news'),
          headerBackTitle: t('common.back'),
        }}
      />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* 标题 */}
        <Text style={styles.title}>{currentNews.title}</Text>

        {/* 元信息 */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            {/* 提供者 */}
            {currentNews.provider && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="newspaper-outline"
                  size={14}
                  color={MarketNewsBrand.colors.text.tertiary}
                />
                <Text style={styles.metaText}>{currentNews.provider.name}</Text>
              </View>
            )}

            {/* 发布时间 */}
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={MarketNewsBrand.colors.text.tertiary}
              />
              <Text style={styles.metaText}>
                {formatFullDateTime(currentNews.published)}
              </Text>
            </View>

            {/* 阅读时间 */}
            {currentNews.read_time && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={MarketNewsBrand.colors.text.tertiary}
                />
                <Text style={styles.metaText}>
                  {Math.ceil(currentNews.read_time / 60)} min
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 相关股票 */}
        {currentNews.relatedSymbols && currentNews.relatedSymbols.length > 0 && (
          <RelatedStocks relatedSymbols={currentNews.relatedSymbols} />
        )}


        {/* 主要内容 - 渲染AST */}
        {currentNews.astDescription && (
          <View style={styles.contentSection}>
            {currentNews.astDescription.children.map((node, index) => {
              const rendered = renderASTNode(node, index);
              // 确保字符串被包裹在 Text 组件中
              return typeof rendered === 'string' ? (
                <Text key={index} style={styles.paragraph}>{rendered}</Text>
              ) : rendered;
            })}
          </View>
        )}

        {/* 标签 */}
        {currentNews.tags && currentNews.tags.length > 0 && (
          <View style={styles.tagsContainer}>

            <View style={styles.tagsList}>
              {currentNews.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 版权信息 */}
        {currentNews.copyright && (
          <View style={styles.copyrightContainer}>
            <Text style={styles.copyrightText}>{currentNews.copyright}</Text>
          </View>
        )}

        {/* 底部间距 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
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
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.secondary,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
  },
  errorText: {
    marginTop: 8,
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderRadius: 12,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.inverse,
  },
  emptyText: {
    marginTop: 16,
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.secondary,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },

  // 内容样式
  title: {
    marginTop: 12,
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    lineHeight: 36,
    color: MarketNewsBrand.colors.text.primary,
    letterSpacing: -0.3,
  },
  metaContainer: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
  },
  // === 标签样式 ===
  tagsContainer: {
    marginTop: 24,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  tagsLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
  },
  tagChipText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.secondary,
  },
  
  shortDescriptionContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    borderLeftWidth: 3,
    borderLeftColor: MarketNewsBrand.colors.primary[400],
    borderRadius: 4,
  },
  shortDescription: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    lineHeight: 22,
    color: MarketNewsBrand.colors.text.secondary,
    fontStyle: 'italic',
  },
  contentSection: {
    marginTop: 24,
    paddingTop: 20,
    paddingHorizontal: 4,
  },
  // === 段落和标题样式 ===
  paragraph: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    lineHeight: 28,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  heading1: {
    fontSize: MarketNewsBrand.typography.fontSize['3xl'],
    lineHeight: 36,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 24,
    marginBottom: 16,
  },
  heading2: {
    fontSize: MarketNewsBrand.typography.fontSize['2xl'],
    lineHeight: 32,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  heading3: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    lineHeight: 28,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 16,
    marginBottom: 10,
  },
  heading4: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    lineHeight: 26,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 14,
    marginBottom: 8,
  },
  heading5: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    lineHeight: 24,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },

  // === 文本样式 ===
  bold: {
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    color: MarketNewsBrand.colors.text.primary,
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: MarketNewsBrand.colors.text.tertiary,
  },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    backgroundColor: MarketNewsBrand.colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    color: MarketNewsBrand.colors.primary[700],
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.primary[200],
  },

  // === 特殊元素 ===
  symbol: {
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.primary[600],
  },
  link: {
    color: MarketNewsBrand.colors.primary[500],
    textDecorationLine: 'underline',
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },

  // === 列表样式 ===
  list: {
    marginVertical: 12,
    paddingLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    lineHeight: 28,
    color: MarketNewsBrand.colors.primary[400],
    marginRight: 10,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
  },
  listItemText: {
    flex: 1,
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    lineHeight: 28,
    color: MarketNewsBrand.colors.text.primary,
    letterSpacing: 0.2,
  },

  // === 引用块样式 ===
  blockquote: {
    flexDirection: 'row',
    marginVertical: 16,
    paddingLeft: 16,
    paddingVertical: 12,
    backgroundColor: MarketNewsBrand.colors.primary[50],
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.primary[400],
  },
  blockquoteBar: {
    width: 4,
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderRadius: 2,
    marginRight: 12,
  },
  blockquoteContent: {
    flex: 1,
  },

  // === 代码块样式 ===
  codeBlock: {
    backgroundColor: MarketNewsBrand.colors.background.primary,
    borderRadius: 12,
    padding: 18,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    shadowColor: MarketNewsBrand.colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeBlockText: {
    fontFamily: 'Courier',
    fontSize: MarketNewsBrand.typography.fontSize.base,
    lineHeight: 20,
    color: MarketNewsBrand.colors.text.tertiary,
  },

  // === 分隔线样式 ===
  horizontalRule: {
    height: 2,
    backgroundColor: MarketNewsBrand.colors.primary[200],
    marginVertical: 24,
    borderRadius: 1,
  },

  // === 表格样式 ===
  table: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.background.tertiary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.tertiary,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    backgroundColor: MarketNewsBrand.colors.primary[50],
    borderRightWidth: 1,
    borderRightColor: MarketNewsBrand.colors.background.tertiary,
  },
  tableHeaderText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  tableCell: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: MarketNewsBrand.colors.background.tertiary,
  },
  tableCellText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.primary,
  },
  copyrightContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: MarketNewsBrand.colors.background.tertiary,
  },
  copyrightText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});

