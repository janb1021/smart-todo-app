import { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  Calendar,
  Flag,
  Edit3,
  Save,
  Repeat,
  Bell,
} from 'lucide-react';

const priorityConfig = {
  high: { label: '高', color: 'bg-red-100 text-red-700', icon: '🔴' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  low: { label: '低', color: 'bg-green-100 text-green-700', icon: '🟢' },
};

const recurrenceConfig = {
  daily: { label: '每天', icon: '🔄' },
  weekly: { label: '每周', icon: '📅' },
  monthly: { label: '每月', icon: '🗓️' },
  yearly: { label: '每年', icon: '🎯' },
};

const reminderConfig = {
  0: { label: '准时提醒', icon: '⏰' },
  5: { label: '提前5分钟', icon: '⏱️' },
  15: { label: '提前15分钟', icon: '⏱️' },
  30: { label: '提前30分钟', icon: '⏲️' },
  60: { label: '提前1小时', icon: '🕐' },
};

export default function ParseConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  parsedData = {},
  isLoading = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    title: '',
    dueDate: '',
    priority: 'medium',
    recurrence: null,
    reminderOffset: null,
  });

  useEffect(() => {
    if (parsedData) {
      setEditedData({
        title: parsedData.title || '',
        dueDate: parsedData.dueDate || '',
        priority: parsedData.priority || 'medium',
        recurrence: parsedData.recurrence || null,
        reminderOffset: parsedData.reminderOffset ?? null,
      });
    }
  }, [parsedData]);

  if (!isOpen) return null;

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    onConfirm(editedData);
  };

  const currentPriority = priorityConfig[editedData.priority] || priorityConfig.medium;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 对话框头部 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI 解析结果</h3>
                <p className="text-sm text-white/80">请确认以下待办信息</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 对话框内容 */}
        <div className="p-6 space-y-4">
          {/* 标题字段 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              待办标题
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="输入待办标题"
              />
            ) : (
              <div className="text-base font-semibold text-gray-900 min-h-[2.5rem] flex items-center">
                {editedData.title || '-'}
              </div>
            )}
          </div>

          {/* 截止日期和优先级 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 截止日期 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                截止日期
              </label>
              {isEditing ? (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={editedData.dueDate}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 h-[2.5rem] px-0">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {editedData.dueDate ? (
                    <span className="font-medium text-gray-900">{editedData.dueDate}</span>
                  ) : (
                    <span className="text-gray-400">未设置</span>
                  )}
                </div>
              )}
            </div>

            {/* 优先级 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                优先级
              </label>
              {isEditing ? (
                <select
                  value={editedData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="high">🔴 高优先级</option>
                  <option value="medium">🟡 中优先级</option>
                  <option value="low">🟢 低优先级</option>
                </select>
              ) : (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${currentPriority.color} h-[2.5rem]`}>
                  <Flag className="w-3.5 h-3.5" />
                  {currentPriority.label}优先级
                </div>
              )}
            </div>
          </div>

          {/* 重复规则和提醒时间 */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            {/* 重复规则 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                重复规则
              </label>
              {isEditing ? (
                <select
                  value={editedData.recurrence || ''}
                  onChange={(e) => handleFieldChange('recurrence', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">不重复</option>
                  <option value="daily">🔄 每天</option>
                  <option value="weekly">📅 每周</option>
                  <option value="monthly">🗓️ 每月</option>
                  <option value="yearly">🎯 每年</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 h-[2.5rem] px-0">
                  <Repeat className="w-4 h-4 text-gray-400" />
                  {editedData.recurrence ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium`}>
                      {recurrenceConfig[editedData.recurrence]?.icon} {recurrenceConfig[editedData.recurrence]?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">不重复</span>
                  )}
                </div>
              )}
            </div>

            {/* 提醒时间 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                提醒时间
              </label>
              {isEditing ? (
                <select
                  value={editedData.reminderOffset ?? ''}
                  onChange={(e) => handleFieldChange('reminderOffset', e.target.value !== '' ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">不提醒</option>
                  <option value="0">⏰ 准时提醒</option>
                  <option value="5">⏱️ 提前5分钟</option>
                  <option value="15">⏱️ 提前15分钟</option>
                  <option value="30">⏲️ 提前30分钟</option>
                  <option value="60">🕐 提前1小时</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 h-[2.5rem] px-0">
                  <Bell className="w-4 h-4 text-gray-400" />
                  {editedData.reminderOffset !== null && editedData.reminderOffset !== undefined ? (
                    <span className="text-sm font-medium text-gray-900">
                      {reminderConfig[editedData.reminderOffset]?.icon} {reminderConfig[editedData.reminderOffset]?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">不提醒</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 编辑按钮提示 */}
          {!isEditing && (
            <div className="pt-2">
              <button
                onClick={handleEditToggle}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                点击编辑解析结果（防止 AI 解析偏差）
              </button>
            </div>
          )}

          {/* 保存编辑按钮 */}
          {isEditing && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleEditToggle}
                className="text-sm text-green-600 hover:text-green-800 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Save className="w-4 h-4" />
                完成编辑
              </button>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !editedData.title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                确认创建
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
