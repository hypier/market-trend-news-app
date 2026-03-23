import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth/authService';
import { User } from '@/types/user';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { clerkService } from '@/services/auth/clerkService';
interface AuthStore {
  // 状态
  isAuthenticated: boolean;
  isLoading: boolean;
  isLogoutLoading: boolean;
  isOneClickLoading: boolean;
  user: User | null;
  error: string | null;
  
  // 核心认证操作
  loginWithClerk: (clerkToken: string) => Promise<void>;
  oneClickLogin: () => Promise<void>;
  logout: (signOut?: any,sessionId?: any) => Promise<void>;
  deleteAccount: (signOut?: any, sessionId?: any) => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  
  // 状态管理操作
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // 初始状态
      isAuthenticated: false,
      isLoading: false,
      isLogoutLoading: false,
      isOneClickLoading: false,
      user: null,
      error: null,

      // Clerk登录方法（由 AuthListener 调用）
      loginWithClerk: async (clerkToken: string) => {
        try {
          Logger.info(LogModule.AUTH, '🚀 开始 Clerk 登录流程');
          set({ isLoading: true, error: null });

          // 调用 authService 进行登录
          const { user } = await authService.loginWithClerk(clerkToken);
          
          // 设置用户状态
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false
          });
          
          Logger.info(LogModule.AUTH, '✅ Clerk 登录成功');
          
          // 登录成功后刷新用户数据 - 这一步放在AuthListener中处理
          return;

        } catch (error) {
          Logger.error(LogModule.AUTH, '❌ Clerk 登录失败:', error);
          const errorMessage = error instanceof Error ? error.message : '登录失败';
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      // 一键登录方法
      oneClickLogin: async () => {
        try {
          Logger.info(LogModule.AUTH, '🚀 开始一键登录流程');
          set({ isOneClickLoading: true, error: null });

          // 调用 authService 进行一键登录
          const { user } = await authService.oneClickLogin();
          
          // 设置用户状态
          set({ 
            user, 
            isAuthenticated: true, 
            isOneClickLoading: false
          });
          
          Logger.info(LogModule.AUTH, '✅ 一键登录成功');

        } catch (error) {
          Logger.error(LogModule.AUTH, '❌ 一键登录失败:', error);
          const errorMessage = error instanceof Error ? error.message : '一键登录失败';
          set({ 
            error: errorMessage, 
            isOneClickLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      // 登出方法
      logout: async (signOut: any,sessionId: any) => {
        try {

          set({ isLogoutLoading: true, error: null });
          Logger.info(LogModule.AUTH, '🚪 开始登出',);
          Logger.info(LogModule.AUTH, '🚪 获取到的 sessionId', sessionId);
          if (!sessionId) {
            // 清除本地状态
            set({
              isLogoutLoading: false,
              isAuthenticated: false,
              user: null,
              error: null
            });
            return;
          }
          await clerkService.revokeSession(sessionId);

          // Clerk登出（如果提供了signOut函数）
          if (!signOut) return
          await signOut();
          Logger.info(LogModule.AUTH, '✅ Clerk 会话已清除');
          // 调用认证服务登出
          await authService.logout();
          // 清除本地状态
          set({ 
            isLogoutLoading: false,
            isAuthenticated: false,
            user: null,
            error: null
          });
          Logger.info(LogModule.AUTH, '调用登出 Clerk 成功');
        } catch (error) {
          // 登出失败时，不清除用户状态，只更新加载状态和错误信息
          if (String(error).includes("You are signed out")) {
            set({
              isLogoutLoading: false,
              isAuthenticated: false,
              user: null,
              error: null
            });
            return;
          }
          Logger.error(LogModule.AUTH, '❌ 登出失败:', error);
          // const errorMessage = t('login.logoutFailed');
          // set({ 
          //   isLogoutLoading: false,
          //   error: errorMessage
          // });
        }
      },

      // 删除账户方法
      deleteAccount: async (signOut: any, sessionId: any) => {
        try {
          set({ isLogoutLoading: true, error: null });
          Logger.info(LogModule.AUTH, '🗑️ 开始删除账户');
          
          // 调用认证服务删除账户
          await authService.deleteAccount();
          Logger.info(LogModule.AUTH, '✅ 账户删除成功');
          
          // 删除账户成功后，清除 Clerk 会话和本地状态
          if (sessionId) {
            await clerkService.revokeSession(sessionId);
          }
          
          if (signOut) {
            await signOut();
          }
          
          // 调用登出清除本地状态
          await authService.logout();
          
          // 清除本地状态
          set({
            isLogoutLoading: false,
            isAuthenticated: false,
            user: null,
            error: null
          });
          
          Logger.info(LogModule.AUTH, '✅ 账户删除完成，已清除所有状态');
        } catch (error) {
          Logger.error(LogModule.AUTH, '❌ 删除账户失败:', error);
          const errorMessage = error instanceof Error ? error.message : '删除账户失败';
          set({
            isLogoutLoading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      // 检查认证状态 (恢复这个功能)
      checkAuthStatus: async () => {
        try {
          set({ isLoading: true });
          
          const token = await authService.getStoredToken();
          if (!token) {
            set({ isAuthenticated: false, user: null, isLoading: false });
            return false;
          }

          const user = await authService.getStoredUser();
          if (user) {
            // 验证token是否仍然有效
            const isValid = await authService.checkAuthStatus();
            if (isValid) {
              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            } else {
              set({ 
                isAuthenticated: false, 
                user: null, 
                isLoading: false 
              });
              return false;
            }
          } else {
            set({ 
              isAuthenticated: false, 
              user: null, 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          Logger.error(LogModule.AUTH, '检查认证状态失败:', error);
          set({ 
            isAuthenticated: false, 
            user: null, 
            isLoading: false 
          });
          return false;
        }
      },

      // 状态管理方法
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      clearUser: () => {
        set({ user: null, isAuthenticated: false });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),

    }
  )
);

// 处理401错误的简单方法
export const handle401Error = async () => {
  const { logout } = useAuthStore.getState();
  Logger.info(LogModule.AUTH, '🔒 检测到401错误，执行登出');
  await logout();
}; 