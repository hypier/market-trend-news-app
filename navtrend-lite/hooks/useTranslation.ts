import { t } from '@/config/i18n';
import { useLanguageStore } from '@/stores';

/**
 * 翻译 Hook
 * 
 * 响应式翻译 Hook，订阅 languageStore 的状态变化
 * 当用户切换语言时，所有使用此 Hook 的组件会自动重新渲染并显示新语言
 * 
 * @returns {Object} 翻译函数和当前语言
 * @returns {Function} t - 翻译函数，用法: t('common.welcome')
 * @returns {Language} currentLanguage - 当前应用语言代码
 * 
 * @example
 * ```tsx
 * const { t, currentLanguage } = useTranslation();
 * 
 * return (
 *   <Text>{t('common.welcome')}</Text>
 * );
 * ```
 */
export function useTranslation() {
  // 订阅 languageStore 的 currentLanguage 状态
  // 当语言改变时，这个 selector 会触发组件重新渲染
  const currentLanguage = useLanguageStore(state => state.currentLanguage);
  
  return {
    t,
    currentLanguage,
  };
} 