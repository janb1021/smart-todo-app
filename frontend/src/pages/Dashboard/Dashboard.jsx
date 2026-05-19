import { useState, useEffect } from 'react';
import { ListTodo, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { dashboardAPI } from '../../api';
import TrendChart from './TrendChart';
import CategoryChart from './CategoryChart';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendRes, categoryRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getTrend(),
          dashboardAPI.getCategories(),
        ]);
        
        setStats(statsRes.data);
        setTrendData(trendRes.data);
        setCategoryData(categoryRes.data);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: '总任务数',
      value: stats.total,
      icon: ListTodo,
      color: 'bg-gradient-to-r from-primary-500 to-purple-600',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
    },
    {
      title: '待完成',
      value: stats.pending,
      icon: Clock,
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: '已完成',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'bg-gradient-to-r from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: '已逾期',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'bg-gradient-to-r from-red-400 to-rose-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-white">数据看板</h2>
        <p className="text-white/80 text-sm mt-1">查看您的任务完成情况和统计数据</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`${card.bgColor} rounded-2xl p-6 shadow-lg transition-transform hover:scale-105`}
            >
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className={`text-3xl font-bold ${card.textColor} mb-1`}>
                {card.value}
              </div>
              <div className="text-gray-600 text-sm">{card.title}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">任务完成趋势（近7天）</h3>
        <TrendChart data={trendData} />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">任务分类统计</h3>
        <CategoryChart data={categoryData} />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">完成率统计</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${stats.completionRate * 4.4} 440`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
                  {stats.completionRate}%
                </div>
                <div className="text-sm text-gray-500">完成率</div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700">已完成任务</span>
              <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <span className="text-gray-700">待完成任务</span>
              <span className="text-2xl font-bold text-yellow-600">{stats.pending}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <span className="text-gray-700">已逾期任务</span>
              <span className="text-2xl font-bold text-red-600">{stats.overdue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
