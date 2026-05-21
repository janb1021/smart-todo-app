import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Flag, AlignLeft, Type } from 'lucide-react';
import { todoAPI } from '../api';

// 优先级选项
const priorityOptions = [
  { value: 'high', label: '高优先级', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'medium', label: '中优先级', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'low', label: '低优先级', color: 'text-green-600 bg-green-50 border-green-200' },
];

export default function TodoForm({
  onClose,
  onSuccess,
  initialData = null,
}) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
      });
    }
    setErrors({});
  }, [isEditMode, initialData]);

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入待办标题';
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '描述不能超过500个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const submitData = {
      ...formData,
      dueDate: formData.dueDate || null,
    };

    try {
      let response;
      if (isEditMode) {
        response = await todoAPI.updateTodo(initialData.id, submitData);
      } else {
        response = await todoAPI.createTodo(submitData);
      }

      if (response.data.success) {
        // 成功后调用 onSuccess 并关闭模态框
        onSuccess?.(response.data.data);
        onClose();
      }
    } catch (error) {
      const message = error.response?.data?.message || (isEditMode ? '更新失败' : '创建失败');
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? '编辑待办' : '新建待办'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* 提交错误提示 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* 标题输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Type className="inline w-4 h-4 mr-1" />
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="输入待办事项标题"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.title
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-400'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* 描述输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <AlignLeft className="inline w-4 h-4 mr-1" />
                描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="添加详细描述（可选）"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
                  errors.description
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-400'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 text-right">
                {formData.description.length}/500
              </p>
            </div>

            {/* 优先级选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="inline w-4 h-4 mr-1" />
                优先级
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, priority: option.value }))
                    }
                    className={`flex-1 px-3 py-2 text-sm font-medium border rounded-lg transition-all ${
                      formData.priority === option.value
                        ? `${option.color} ring-2 ring-offset-1 ring-indigo-500`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 截止日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                截止日期
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? '保存中...' : '创建中...'}
                  </span>
                ) : isEditMode ? (
                  '保存修改'
                ) : (
                  '创建待办'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
