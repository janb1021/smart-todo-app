import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Sidebar from './components/Layout/Sidebar';
import TodoList from './pages/Todos/TodoList';
import Dashboard from './pages/Dashboard/Dashboard';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen">
      {isLogin ? (
        <Login onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
};

const MainApp = () => {
  const [currentView, setCurrentView] = useState('todos');
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex gap-4 h-[calc(100vh-2rem)]">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        {currentView === 'todos' ? <TodoList /> : <Dashboard />}
      </div>
    </div>
  );
};

function App() {
  const { user } = useApp();

  if (!user) {
    return <AuthPage />;
  }

  return <MainApp />;
}

export default function WrappedApp() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
