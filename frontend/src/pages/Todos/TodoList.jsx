import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Bot } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TodoModal from './TodoModal';

const TodoList = () => {
  const { todos, filter, setFilter, addTodo, toggleTodo, deleteTodo, loading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'pending', label: '待办' },
    { id: 'completed', label: '已完成' },
    { id: 'overdue', label: '已逾期' },
  ];

  const priorities = ['', 'high', 'medium', 'low'];
  const categories = ['', '工作', '生活', '学习', '娱乐', '健康'];

  const getPriorityLabel = (priority) => {
    const labels = { high: '高', medium: '中', low: '低' };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-600',
      medium: 'bg-yellow-100 text-yellow-600',
      low: 'bg-blue-100 text-blue-600',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  const handleAddTodo = (data) => {
    addTodo(data);
    setShowModal(false);
  };

  const handleUpdateTodo = (id, data) => {
    addTodo(id, data);
    setShowModal(false);
    setEditingTodo(null);
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTodo(id);
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedPriority && todo.priority !== selectedPriority) {
      return false;
    }
    if (selectedCategory && todo.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 overflow-hidden flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">待办任务</h2>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">智能解析</h4>
            <p className="text-sm text-gray-500">支持自然语言输入，如"明天下午3点开会"，系统会自动识别时间和任务内容</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索任务..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
        />
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
        >
          {priorities.map(p => (
            <option key={p} value={p}>{p ? getPriorityLabel(p) : '优先级'}</option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c || '分类'}</option>
          ))}
        </select>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加任务
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="w-16 h-16 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full opacity-50">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.99-1.61L23 6H6"></path>
              </svg>
            </div>
            <p>暂无任务，开始添加吧！</p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                todo.completed
                  ? 'bg-green-50 border border-green-100'
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-primary-200'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id, !todo.completed)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  todo.completed
                    ? 'bg-gradient-to-r from-primary-500 to-purple-600 border-transparent text-white'
                    : 'border-gray-300 hover:border-primary-500'
                }`}
              >
                {todo.completed && <Check className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {todo.title}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                    {getPriorityLabel(todo.priority)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {todo.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('zh-CN') : '无截止日期'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(todo)}
                  className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TodoModal
          todo={editingTodo}
          onClose={() => {
            setShowModal(false);
            setEditingTodo(null);
          }}
          onSave={editingTodo ? handleUpdateTodo : handleAddTodo}
        />
      )}
    </div>
  );
};

export default TodoList;
