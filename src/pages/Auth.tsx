import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, name);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (!isLogin) {
      // After signup, show success and switch to login
      setError('');
      setIsLogin(true);
      setLoading(false);
      setEmail('');
      setPassword('');
      setName('');
      // Show success message
      setError('注册成功！请检查邮箱确认链接（或直接登录）');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">💰</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">MoneyMate</h1>
          <p className="text-sm text-slate-400 mt-1">你的 AI 财务助手</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {isLogin ? '登录' : '注册'}
          </h2>

          {!isLogin && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">昵称</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="你的名字"
                required={!isLogin}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 mb-1 block">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">密码</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 位"
                required
                minLength={6}
                className="w-full px-3 py-2.5 pr-10 bg-slate-50 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className={`text-xs p-2 rounded-lg ${error.includes('成功') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLogin ? '登录' : '注册'}
          </button>

          <p className="text-center text-xs text-slate-400">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-indigo-600 font-medium ml-1 hover:text-indigo-800"
            >
              {isLogin ? '注册' : '登录'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
