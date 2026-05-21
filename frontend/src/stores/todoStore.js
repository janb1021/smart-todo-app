import { create } from 'zustand';
import { api } from './authStore';

export const useTodoStore = create((set, get) => ({
  // 状态
  todos: [],
  isLoading: false,
  error: null,
  filter: 'all', // all, active, completed
  currentTodo: null, // 当前编辑的待办
  isModalOpen: false, // 弹窗开关
  modalMode: 'create', // create 或 edit

  // 设置筛选条件
  setFilter: (filter) => set({ filter }),

  // 打开弹窗
  openModal: (mode = 'create', todo = null) => {
    set({
      isModalOpen: true,
      modalMode: mode,
      currentTodo: todo,
    });
  },

  // 关闭弹窗
  closeModal: () => {
    set({
      isModalOpen: false,
      currentTodo: null,
      modalMode: 'create',
    });
  },

  // 清除错误
  clearError: () => set({ error: null }),

  // 获取待办列表
  fetchTodos: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      console.log('fetchTodos - token:', token ? '存在' : '不存在');
      
      const response = await api.get('/todos', { params });
      console.log('fetchTodos - 响应:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        console.log('fetchTodos - 返回数据:', data);
        // 后端返回的是 { list: [...], pagination: {...} }
        // 需要正确解析 list 字段
        let todos = [];
        if (Array.isArray(data)) {
          todos = data;
        } else if (data.list && Array.isArray(data.list)) {
          todos = data.list;
        } else if (data.todos && Array.isArray(data.todos)) {
          todos = data.todos;
        }
        console.log('fetchTodos - 解析后的todos:', todos);
        set({
          todos,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('fetchTodos - 错误:', error);
      const message = error.response?.data?.message || '获取待办列表失败';
      set({ isLoading: false, error: message });
    }
  },

  // 创建待办
  createTodo: async (todoData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/todos', todoData);
      console.log('创建响应:', response.data);
      if (response.data.success) {
        const newTodo = response.data.data;
        console.log('新待办:', newTodo);
        set((state) => {
          const currentTodos = Array.isArray(state.todos) ? state.todos : [];
          console.log('当前待办数量:', currentTodos.length);
          const newTodos = [newTodo, ...currentTodos];
          console.log('更新后待办数量:', newTodos.length);
          return {
            todos: newTodos,
            isLoading: false,
            isModalOpen: false,
          };
        });
        return { success: true };
      }
    } catch (error) {
      console.error('创建错误:', error);
      const message = error.response?.data?.message || '创建待办失败';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // 更新待办
  updateTodo: async (id, todoData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/todos/${id}`, todoData);
      if (response.data.success) {
        const updatedTodo = response.data.data;
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? updatedTodo : todo
          ),
          isLoading: false,
          isModalOpen: false,
          currentTodo: null,
        }));
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || '更新待办失败';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // 删除待办
  deleteTodo: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/todos/${id}`);
      if (response.data.success) {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
          isLoading: false,
        }));
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || '删除待办失败';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // 切换完成状态（乐观更新）
  toggleComplete: async (id, completed) => {
    const { todos } = get();
    // 保存原始状态用于回滚
    const originalTodo = todos.find((todo) => todo.id === id);
    if (!originalTodo) return { success: false, message: '待办不存在' };

    // 乐观更新：立即更新 UI
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed } : todo
      ),
    }));

    try {
      const response = await api.put(`/todos/${id}`, { completed });
      if (response.data.success) {
        const updatedTodo = response.data.data;
        // 用服务器返回的数据更新（确保数据一致性）
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? updatedTodo : todo
          ),
        }));
        return { success: true };
      }
    } catch (error) {
      // 请求失败，回滚到原始状态
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? originalTodo : todo
        ),
        error: error.response?.data?.message || '更新状态失败',
      }));
      return { success: false, message: error.response?.data?.message || '更新状态失败' };
    }
  },

  // 删除待办（乐观更新）
  deleteTodoOptimistic: async (id) => {
    const { todos } = get();
    // 保存原始列表用于回滚
    const originalTodos = [...todos];

    // 乐观更新：立即从 UI 移除
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));

    try {
      const response = await api.delete(`/todos/${id}`);
      if (response.data.success) {
        return { success: true };
      }
    } catch (error) {
      // 请求失败，回滚到原始列表
      set({ todos: originalTodos, error: error.response?.data?.message || '删除失败' });
      return { success: false, message: error.response?.data?.message || '删除失败' };
    }
  },

  // 获取筛选后的待办列表
  getFilteredTodos: () => {
    const { todos, filter } = get();
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  },

  // 获取统计信息
  getStats: () => {
    const { todos } = get();
    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
    };
  },
}));
