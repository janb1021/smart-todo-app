import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Flag,
  Pencil,
  Trash2,
} from 'lucide-react';

// 优先级配置
const priorityConfig = {
  high: {
    label: '高优先级',
    color: 'bg-red-100 text-red-700 border-red-300',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500',
  },
  medium: {
    label: '中优先级',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
  },
  low: {
    label: '低优先级',
    color: 'bg-green-100 text-green-700 border-green-300',
    iconColor: 'text-green-500',
    bgColor: 'bg-green-500',
  },
};

export default function TodoCard({ todo, onToggle, onEdit, onDelete }) {
  const priority = priorityConfig[todo.priority] || priorityConfig.medium;

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MM月dd日', { locale: zhCN });
    } catch {
      return null;
    }
  };

  const dueDate = formatDate(todo.dueDate);
  const isOverdue =
    todo.dueDate &&
    !todo.completed &&
    new Date(todo.dueDate) < new Date().setHours(0, 0, 0, 0);

  return (
    <div
      className={`group relative bg-white rounded-xl border-2 transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 ${
        todo.completed
          ? 'border-gray-200 bg-gray-50'
          : 'border-gray-200 hover:border-indigo-400 hover:shadow-indigo-100'
      }`}
    >
      {/* 优先级指示条 */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${priority.bgColor}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 完成状态勾选 */}
          <button
            onClick={() => onToggle(todo.id, !todo.completed)}
            className={`mt-0.5 flex-shrink-0 transition-colors ${
              todo.completed
                ? 'text-green-500 hover:text-green-600'
                : 'text-gray-400 hover:text-indigo-500'
            }`}
          >
            {todo.completed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            {/* 标题 */}
            <h3
              className={`font-medium text-base mb-1 ${
                todo.completed
                  ? 'text-gray-500 line-through'
                  : 'text-gray-900'
              }`}
            >
              {todo.title}
            </h3>

            {/* 描述 */}
            {todo.description && (
              <p
                className={`text-sm mb-2 line-clamp-2 ${
                  todo.completed ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {todo.description}
              </p>
            )}

            {/* 标签区域 */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* 优先级徽章 */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${priority.color} shadow-sm`}
              >
                <span className={`w-2 h-2 rounded-full ${priority.bgColor}`} />
                {priority.label}
              </span>

              {/* 截止日期 */}
              {dueDate && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isOverdue
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {isOverdue ? `逾期: ${dueDate}` : dueDate}
                </span>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
            <button
              onClick={() => onEdit(todo)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="编辑"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
