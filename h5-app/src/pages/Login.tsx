import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { api, setToken } from '../api/request';

export default function Login() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!nickname.trim() || !password) { setError('请输入昵称和密码'); return; }
    setLoading(true); setError('');
    try {
      const res: any = await api.post('/user/login', { nickname: nickname.trim(), password });
      setToken(res.token);
      localStorage.setItem('userInfo', JSON.stringify(res.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full" />
        <div className="absolute top-1/4 -right-16 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-20 -left-10 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-40 right-10 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      {/* Logo area */}
      <div className="text-center mb-10 relative z-10">
        <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-5 border border-white/20 shadow-lg">
          <BookOpen size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">学习伴侣</h1>
        <p className="text-blue-200 text-sm">记录学习，结伴成长</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-3xl px-7 py-8 shadow-2xl relative z-10">
        <h2 className="text-xl font-bold text-slate-800 mb-1">欢迎回来</h2>
        <p className="text-sm text-gray-400 mb-6">登录你的账号继续学习之旅</p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm text-center py-2.5 px-4 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm text-gray-500 mb-1.5 block font-medium">昵称</label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl text-base outline-none border-2 border-transparent focus:border-indigo-200 focus:bg-white transition-all"
              placeholder="请输入昵称"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-500 mb-1.5 block font-medium">密码</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-11 pr-12 py-3.5 bg-gray-50 rounded-xl text-base outline-none border-2 border-transparent focus:border-indigo-200 focus:bg-white transition-all"
              type={showPwd ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPwd(!showPwd)}
              type="button"
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2"
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>登录中...</span>
            </>
          ) : (
            <span>登 录</span>
          )}
        </button>
      </div>

      {/* Test accounts hint */}
      <div className="mt-8 text-center relative z-10">
        <p className="text-blue-200/70 text-xs">测试账号：user1 / 123456</p>
        <p className="text-blue-200/70 text-xs mt-1">测试账号：user2 / 123456</p>
      </div>
    </div>
  );
}
