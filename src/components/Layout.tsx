import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, PiggyBank, BarChart3, Bot, Bell, LogOut, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const tabs = [
  { path: '/', label: '首页', icon: LayoutDashboard },
  { path: '/record', label: '记账', icon: PlusCircle },
  { path: '/budget', label: '预算', icon: PiggyBank },
  { path: '/stats', label: '统计', icon: BarChart3 },
  { path: '/ai', label: 'AI助手', icon: Bot },
];

export default function Layout() {
  const { state, markAlertRead } = useApp();
  const { user: authUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadAlerts = state.alerts.filter(a => !a.read);
  const hideNav = location.pathname === '/onboarding';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      {!hideNav && (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <h1 className="text-lg font-bold text-slate-800">MoneyMate</h1>
            </div>
            <div className="flex items-center gap-1">
              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                  <User className="w-5 h-5 text-slate-500" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-800 truncate">{authUser?.email}</p>
                      <p className="text-xs text-slate-400">已登录</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full p-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-xl flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                  </div>
                )}
              </div>

              {/* Alerts */}
              <div className="relative">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadAlerts.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadAlerts.length}
                    </span>
                  )}
                </button>

              {/* Alert dropdown */}
              {showAlerts && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">消息中心</h3>
                  </div>
                  {state.alerts.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm">暂无消息</div>
                  ) : (
                    state.alerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!alert.read ? 'bg-amber-50/50' : ''}`}
                        onClick={() => markAlertRead(alert.id)}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            alert.type === 'danger' ? 'bg-red-500' :
                            alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="text-sm text-slate-700">{alert.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(alert.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!alert.read && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
          <div className="max-w-lg mx-auto flex justify-around py-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
