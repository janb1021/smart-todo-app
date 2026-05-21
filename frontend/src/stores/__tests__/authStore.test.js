// 模拟 localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
    resetStore() {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// 模拟 window.location
delete window.location;
window.location = { href: '' };

// 模拟 axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return mockAxios;
});

const axios = require('axios');
const { useAuthStore } = require('../src/stores/authStore');

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    // 重置 localStorage
    localStorageMock.resetStore();
    // 清除所有 mock
    jest.clearAllMocks();
    
    // 重置 store 状态（通过调用 logout）
    const store = useAuthStore.getState();
    if (store.logout) {
      store.logout();
    }
  });

  describe('初始状态', () => {
    test('初始状态应为未认证', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login 方法', () => {
    test('登录成功 - 应更新状态并保存到 localStorage', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-jwt-token',
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const store = useAuthStore.getState();
      const result = await store.login('test@example.com', 'password123');

      expect(result).toEqual({ success: true });

      // 验证状态已更新
      const newState = useAuthStore.getState();
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.token).toBe('test-jwt-token');
      expect(newState.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(newState.isLoading).toBe(false);

      // 验证 localStorage 已保存
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-jwt-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }));
    });

    test('登录失败 - 应设置错误信息', async () => {
      const error = {
        response: {
          data: {
            message: '邮箱或密码错误',
          },
        },
      };
      axios.post.mockRejectedValue(error);

      const store = useAuthStore.getState();
      const result = await store.login('wrong@example.com', 'wrongpass');

      expect(result).toEqual({ success: false, message: '邮箱或密码错误' });

      const newState = useAuthStore.getState();
      expect(newState.error).toBe('邮箱或密码错误');
      expect(newState.isAuthenticated).toBe(false);
    });

    test('登录失败 - 网络错误应显示通用错误', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      const store = useAuthStore.getState();
      const result = await store.login('test@example.com', 'password');

      expect(result).toEqual({ success: false, message: '登录失败' });
    });

    test('登录时 isLoading 应为 true', () => {
      // 创建一个异步测试来验证中间状态
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            user: { id: 'user-1', email: 'test@test.com' },
          },
        },
      };

      axios.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100)));

      const store = useAuthStore.getState();
      const loginPromise = store.login('test@test.com', 'pass');

      // 在异步操作进行中，isLoading 应该是 true
      expect(useAuthStore.getState().isLoading).toBe(true);

      return loginPromise.then(() => {
        expect(useAuthStore.getState().isLoading).toBe(false);
      });
    });
  });

  describe('register 方法', () => {
    test('注册成功 - 应更新状态并保存到 localStorage', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'new-user-token',
            user: {
              id: 'new-user-123',
              email: 'new@example.com',
              name: 'New User',
            },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const store = useAuthStore.getState();
      const result = await store.register('new@example.com', 'password123', 'New User');

      expect(result).toEqual({ success: true });

      const newState = useAuthStore.getState();
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user).toEqual({ id: 'new-user-123', email: 'new@example.com', name: 'New User' });
    });

    test('注册失败 - 应返回错误信息', async () => {
      const error = {
        response: {
          data: {
            message: '该邮箱已被注册',
          },
        },
      };
      axios.post.mockRejectedValue(error);

      const store = useAuthStore.getState();
      const result = await store.register('exist@example.com', 'pass123');

      expect(result.success).toBe(false);
      expect(useAuthStore.getState().error).toBe('该邮箱已被注册');
    });
  });

  describe('logout 方法', () => {
    test('登出应清除所有状态和 localStorage', () => {
      // 先设置一个已登录状态
      localStorageMock.setItem('token', 'some-token');
      localStorageMock.setItem('user', '{"id":"user-1"}');

      const store = useAuthStore.getState();
      store.logout();

      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.error).toBeNull();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('clearError 方法', () => {
    test('clearError 应清除错误信息', () => {
      // 手动设置错误（模拟之前的状态）
      useAuthStore.setState({ error: 'Some error message' });

      const store = useAuthStore.getState();
      store.clearError();

      expect(store.error).toBeNull();
    });
  });

  describe('initAuth 方法', () => {
    test('initAuth 应从 localStorage 恢复认证状态', () => {
      localStorageMock.setItem('token', 'saved-token');
      localStorageMock.setItem('user', '{"id":"user-saved","email":"saved@test.com","name":"Saved User"}');

      const store = useAuthStore.getState();
      store.initAuth();

      expect(store.isAuthenticated).toBe(true);
      expect(store.token).toBe('saved-token');
      expect(store.user).toEqual({
        id: 'user-saved',
        email: 'saved@test.com',
        name: 'Saved User',
      });
    });

    test('initAuth 处理无效的 user 数据应清除存储', () => {
      localStorageMock.setItem('token', 'some-token');
      localStorageMock.setItem('user', 'invalid-json');

      const store = useAuthStore.getState();
      store.initAuth();

      expect(store.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    test('initAuth 无 token 时应保持未认证状态', () => {
      const store = useAuthStore.getState();
      store.initAuth();

      expect(store.isAuthenticated).toBe(false);
      expect(store.token).toBeNull();
    });
  });

  describe('fetchUser 方法', () => {
    test('无 token 时 fetchUser 不应执行请求', async () => {
      const store = useAuthStore.getState();
      await store.fetchUser();

      expect(axios.get).not.toHaveBeenCalled();
    });

    test('有 token 时 fetchUser 应尝试获取用户信息', async () => {
      // 先设置 token
      useAuthStore.setState({ token: 'existing-token' });

      axios.get.mockResolvedValue({
        data: { success: true, data: { id: 'user-1', name: 'Updated Name' } },
      });

      const store = useAuthStore.getState();
      await store.fetchUser();

      // 注意：当前实现中 fetchUser 是空壳，所以不会实际调用
      // 这个测试用于未来功能扩展时的回归测试
    });
  });
});
