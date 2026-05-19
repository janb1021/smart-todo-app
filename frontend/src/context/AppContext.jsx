import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, todoAPI } from '../api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchTodos();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTodos = useCallback(async (params = {}) => {
    try {
      const response = await todoAPI.getAll({ filter, ...params });
      setTodos(response.data);
    } catch (error) {
      console.error('获取待办列表失败:', error);
    }
    setLoading(false);
  }, [filter]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      await fetchTodos();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '登录失败' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password });
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      await fetchTodos();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '注册失败' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTodos([]);
  };

  const addTodo = async (data) => {
    try {
      const response = await todoAPI.create(data);
      setTodos(prev => [response.data, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '创建失败' };
    }
  };

  const updateTodo = async (id, data) => {
    try {
      const response = await todoAPI.update(id, data);
      setTodos(prev => prev.map(todo => todo.id === id ? response.data : todo));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '更新失败' };
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoAPI.delete(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '删除失败' };
    }
  };

  const toggleTodo = async (id, completed) => {
    return updateTodo(id, { completed });
  };

  const value = {
    user,
    todos,
    loading,
    filter,
    setFilter,
    login,
    register,
    logout,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    fetchTodos,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
