import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initializeAuth: async () => {
        try {
          // 检查当前会话
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '用户',
            };
            set({ user, isAuthenticated: true });
          }

          // 监听认证状态变化
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const user: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '用户',
              };
              set({ user, isAuthenticated: true });
            } else {
              set({ user: null, isAuthenticated: false });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return false;
          }

          if (data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '用户',
            };
            set({ user, isAuthenticated: true, isLoading: false });
            return true;
          }

          return false;
        } catch (error) {
          set({ error: '登录失败，请重试', isLoading: false });
          return false;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          // 先注册
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          });

          if (signUpError) {
            set({ error: signUpError.message, isLoading: false });
            return false;
          }

          // 注册成功后立即登录
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            // 如果登录失败，可能是因为需要邮箱确认
            set({ 
              error: '注册成功，但登录失败。如果启用了邮箱确认，请先确认邮箱后再登录。', 
              isLoading: false 
            });
            return false;
          }

          if (signInData.user) {
            const user: User = {
              id: signInData.user.id,
              email: signInData.user.email || '',
              name: name || signInData.user.email?.split('@')[0] || '用户',
            };
            set({ user, isAuthenticated: true, isLoading: false });
            return true;
          }

          return false;
        } catch (error) {
          set({ error: '注册失败，请重试', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // 只持久化用户基本信息，不持久化敏感信息
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
