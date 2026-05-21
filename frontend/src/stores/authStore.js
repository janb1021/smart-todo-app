import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// 从环境变量读取 API 基础地址
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 401 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 忽略请求被取消的错误
    if (error.code === 'ERR_CANCELED' || error.message?.includes('canceled')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 可以在这里触发全局登出或跳转
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 创建 auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录方法
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          console.log('发送登录请求...');
          const response = await api.post('/auth/login', { email, password });
          console.log('登录响应:', response.data);
          if (response.data.success) {
            const { token, user } = response.data.data;
            console.log('获取到 token:', token ? '有token' : '无token');
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            console.log('保存到 localStorage 后:', localStorage.getItem('token') ? '成功' : '失败');
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          }
        } catch (error) {
          console.error('登录错误:', error);
          const message = error.response?.data?.message || '登录失败';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      // 注册方法
      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', {
            email,
            password,
            name,
          });
          if (response.data.success) {
            const { token, user } = response.data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          }
        } catch (error) {
          const message = error.response?.data?.message || '注册失败';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      // 登出方法
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // 获取当前用户信息（可选）
      fetchUser: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoading: true });
        try {
          // 这里可以添加获取用户详情的 API 调用
          // const response = await api.get('/auth/me');
          // set({ user: response.data.data, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),

      // 初始化状态（从 localStorage 恢复）
      initAuth: () => {
        set({ isLoading: true });
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true, isLoading: false });
          } catch (e) {
            // 解析失败，清除存储
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage 的 key
      partialize: (state) => ({
        // 只持久化这些字段
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 导出 api 实例供其他组件使用
export { api };
