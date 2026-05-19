import { LayoutDashboard, ListTodo, LogOut, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Sidebar = ({ currentView, onViewChange }) => {
  const { user, logout } = useApp();

  const navItems = [
    { id: 'todos', icon: ListTodo, label: '待办管理' },
    { id: 'dashboard', icon: LayoutDashboard, label: '数据看板' },
  ];

  return (
    <aside className="w-64 bg-white rounded-2xl shadow-xl p-6 flex flex-col h-full">
      <div className="mb-6 pb-6 border-b border-gray-100">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
          智能代办助手
        </h1>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-purple-50 text-primary-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-sm text-gray-500 truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
