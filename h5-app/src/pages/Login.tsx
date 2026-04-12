import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { api, setToken } from '../api/request';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password) { setError('请输入账号和密码'); return; }
    setLoading(true); setError('');
    try {
      const res: any = await api.post('/user/login', { username: username.trim(), password });
      setToken(res.token);
      localStorage.setItem('userInfo', JSON.stringify(res.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Top decorative wave */}
      <div className="h-56 bg-gradient-to-br from-blue-500 to-blue-600 rounded-b-[3rem] relative shrink-0">
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-400/30 rounded-full" />
        <div className="absolute top-10 -right-8 w-32 h-32 bg-blue-400/20 rounded-full" />
        <div className="flex flex-col items-center justify-center h-full relative z-10 pt-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 border border-white/30">
            <BookOpen size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">学习伴侣</h1>
          <p className="text-blue-100 text-sm mt-1">记录学习，结伴成长</p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex flex-col px-7 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-7">
          <h2 className="text-lg font-bold text-slate-800 mb-1">登录账号</h2>
          <p className="text-xs text-gray-400 mb-5">新账号输入即注册，密码至少4位</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm text-center py-2.5 px-4 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">账号</label>
            <div className="relative">
              <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                placeholder="请输入账号"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">密码</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-10 pr-11 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                type={showPwd ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPwd(!showPwd)}
                type="button"
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2 shadow-sm"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>登录中...</span>
              </>
            ) : (
              <span>登录 / 注册</span>
            )}
          </button>
        </div>

        {/* Test accounts */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-[11px]">测试账号：zhangsan / 123456</p>
        </div>
      </div>
    </div>
  );
}
