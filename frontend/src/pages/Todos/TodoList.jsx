import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../stores/authStore';
import TodoCard from '../../components/Todos/TodoCard';
import TodoModal from '../../components/Todos/TodoModal';
import TodoListSkeleton, { StatsCardSkeleton } from '../../components/Todos/TodoSkeleton';
import ParseConfirmModal from '../../components/ParseConfirmModal';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Circle,
  ListTodo,
  RefreshCw,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';

// 筛选按钮配置
const filterButtons = [
  { key: 'all', label: '全部', icon: ListTodo },
  { key: 'active', label: '未完成', icon: Circle },
  { key: 'completed', label: '已完成', icon: CheckCircle2 },
];

export default function TodoList() {
  const { logout } = useAuthStore();
  const {
    todos,
    isLoading,
    error,
    filter,
    isModalOpen,
    modalMode,
    currentTodo,
    setFilter,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodoOptimistic,
    toggleComplete,
    openModal,
    closeModal,
    clearError,
  } = useTodoStore();

  // 智能添加状态
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // 防抖相关
  const debounceTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const isCooldownRef = useRef(false);

  // 防抖延迟（毫秒）
  const DEBOUNCE_DELAY = 500;
  // 冷却时间（秒）- 防止连续点击
  const COOLDOWN_TIME = 3;

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // 处理 AI 解析（带防抖和冷却）
  const handleAIParse = useCallback(async () => {
    if (!aiInput.trim() || isParsing || isCooldownRef.current) return;

    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器
    debounceTimerRef.current = setTimeout(async () => {
      // 检查是否在冷却期
      if (isCooldownRef.current) return;

      setIsParsing(true);
      setAiError(null);
      setParsedResult(null);

      try {
        const response = await api.post('/ai/parse-todo', { text: aiInput.trim() });
        if (response.data.success) {
          setParsedResult(response.data.data);
          setShowConfirmDialog(true);

          // 触发冷却期
          startCooldown();
        }
      } catch (error) {
        console.error('AI 解析失败:', error);
        
        // 检查是否是限流错误
        if (error.response?.status === 429) {
          const retryAfter = error.response?.data?.retryAfter || COOLDOWN_TIME;
          setAiError(`请求过于频繁，请 ${retryAfter} 秒后重试`);
          startCooldown(retryAfter);
        } else {
          setAiError(error.response?.data?.message || 'AI 解析失败，请重试');
          startCooldown();
        }
      } finally {
        setIsParsing(false);
      }
    }, DEBOUNCE_DELAY);
  }, [aiInput, isParsing]);

  // 启动冷却倒计时
  const startCooldown = (seconds = COOLDOWN_TIME) => {
    isCooldownRef.current = true;
    let remaining = seconds;
    setCooldownRemaining(remaining);

    // 清除之前的冷却定时器
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCooldownRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(cooldownTimerRef.current);
        isCooldownRef.current = false;
        setCooldownRemaining(0);
      }
    }, 1000);
  };

  // 确认创建待办
  const handleConfirmCreate = async (editedData) => {
    if (!editedData) return;

    setShowConfirmDialog(false);
    setIsCreating(true);

    try {
      const result = await createTodo({
        title: editedData.title,
        description: aiInput,
        dueDate: editedData.dueDate || null,
        priority: editedData.priority || 'medium',
        recurrence: editedData.recurrence || null,
        reminderOffset: editedData.reminderOffset ?? null,
      });

      if (result.success) {
        setAiInput('');
        setParsedResult(null);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // 取消确认
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setParsedResult(null);
  };

  // 处理键盘事件（Enter 键触发解析）
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isParsing) {
      e.preventDefault();
      handleAIParse();
    }
  };

  // 加载待办列表
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // 计算筛选后的列表和统计
  const filteredTodos = useMemo(() => {
    console.log('计算 filteredTodos, todos:', todos, 'filter:', filter);
    if (!Array.isArray(todos)) return [];
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const stats = useMemo(() => {
    if (!Array.isArray(todos)) {
      return { total: 0, completed: 0, active: 0 };
    }
    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
    };
  }, [todos]);

  // 处理创建待办
  const handleCreate = async (data) => {
    await createTodo(data);
    // 创建成功后不需要 fetchTodos，因为 store 中已经更新了列表
  };

  // 处理更新待办
  const handleUpdate = async (data) => {
    if (!currentTodo) return;
    await updateTodo(currentTodo.id, data);
    // 更新成功后不需要 fetchTodos，因为 store 中已经更新了列表
  };

  // 处理删除待办（乐观更新）
  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个待办事项吗？')) {
      const result = await deleteTodoOptimistic(id);
      if (!result.success) {
        alert(result.message || '删除失败，请重试');
      }
    }
  };

  // 处理切换完成状态（乐观更新，失败时提示）
  const handleToggle = async (id, completed) => {
    const result = await toggleComplete(id, completed);
    if (!result.success) {
      alert(result.message || '更新失败，请重试');
    }
  };

  // 处理编辑
  const handleEdit = (todo) => {
    openModal('edit', todo);
  };

  // 处理新建
  const handleNew = () => {
    openModal('create');
  };

  // 处理弹窗提交
  const handleModalSubmit = (data) => {
    if (modalMode === 'create') {
      handleCreate(data);
    } else {
      handleUpdate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">我的待办</h1>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 统计卡片 - 加载时显示骨架屏 */}
        {isLoading && (!todos || todos.length === 0) ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">全部待办</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">未完成</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">已完成</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        )}

        {/* 智能添加区域 */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI 智能解析
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="用自然语言快速添加待办，如：明天下午3点开会"
                  disabled={isParsing || cooldownRemaining > 0}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
                />
                <button
                  onClick={handleAIParse}
                  disabled={isParsing || !aiInput.trim() || cooldownRemaining > 0}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px]"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      解析中
                    </>
                  ) : cooldownRemaining > 0 ? (
                    <>
                      <span className="text-xs">{cooldownRemaining}s</span>
                      冷却中
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      解析
                    </>
                  )}
                </button>
              </div>
              
              {/* AI 错误提示 */}
              {aiError && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{aiError}</span>
                  <button
                    onClick={() => setAiError(null)}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 确认对话框 - 使用独立组件 */}
        <ParseConfirmModal
          isOpen={showConfirmDialog}
          onClose={handleCancelConfirm}
          onConfirm={handleConfirmCreate}
          parsedData={parsedResult}
          isLoading={isCreating}
        />

        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* 筛选按钮 */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {filterButtons.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* 新建按钮 */}
          <button
            onClick={handleNew}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建待办
          </button>
        </div>

        {/* 错误提示 - 带重试按钮 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
            <div className="flex gap-3 mt-3 pl-8">
              <button
                onClick={() => fetchTodos()}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? '重试中...' : '重新加载'}
              </button>
              <button
                onClick={clearError}
                className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* 加载状态 - 骨架屏 */}
        {isLoading && (!todos || todos.length === 0) && <TodoListSkeleton count={5} />}

        {/* 待办列表 */}
        {!isLoading && filteredTodos.length > 0 && (
          <div className="space-y-3">
            {filteredTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && filteredTodos.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'completed'
                ? '还没有已完成的待办'
                : filter === 'active'
                ? '太棒了！所有待办都已完成'
                : '还没有待办事项'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? '点击上方按钮创建你的第一个待办'
                : '切换筛选条件查看其他待办'}
            </p>
            {filter === 'all' && (
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建待办
              </button>
            )}
          </div>
        )}
      </main>

      {/* 待办弹窗 */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialData={currentTodo}
        isLoading={isLoading}
      />
    </div>
  );
}