import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Lock, Loader2, Eye, EyeOff, SmilePlus } from 'lucide-react';
import { api, setToken } from '../api/request';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
  };

  const handleSubmit = async () => {
    if (!username.trim()) { setError('请输入账号'); return; }
    if (!password || password.length < 4) { setError('密码至少4位'); return; }
    if (isRegister && !nickname.trim()) { setError('请输入昵称'); return; }
    if (isRegister && password !== confirmPwd) { setError('两次密码不一致'); return; }
    setLoading(true); setError('');
    try {
      const url = isRegister ? '/user/register' : '/user/login';
      const body: any = { username: username.trim(), password };
      if (isRegister) body.nickname = nickname.trim();
      const res: any = await api.post(url, body);
      setToken(res.token);
      localStorage.setItem('userInfo', JSON.stringify(res.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message || (isRegister ? '注册失败' : '登录失败'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Top header */}
      <div className="h-52 bg-gradient-to-br from-blue-500 to-blue-600 rounded-b-[3rem] relative shrink-0">
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-400/30 rounded-full" />
        <div className="absolute top-10 -right-8 w-32 h-32 bg-blue-400/20 rounded-full" />
        <div className="flex flex-col items-center justify-center h-full relative z-10 pt-2">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2.5 border border-white/30">
            <BookOpen size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">学习伴侣</h1>
          <p className="text-blue-100 text-xs mt-1">记录学习，结伴成长</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col px-7 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-6">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              onClick={() => switchMode('login')}
            >登录</button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              onClick={() => switchMode('register')}
            >注册</button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm text-center py-2.5 px-4 rounded-xl mb-4">{error}</div>
          )}

          {/* 账号 */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block font-medium">账号</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                placeholder="请输入账号"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* 昵称（仅注册） */}
          {isRegister && (
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block font-medium">昵称</label>
              <div className="relative">
                <SmilePlus size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                  placeholder="给自己起个名字"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 密码 */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block font-medium">密码</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-10 pr-11 py-2.5 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                type={showPwd ? 'text' : 'password'}
                placeholder={isRegister ? '设置密码（至少4位）' : '请输入密码'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isRegister && handleSubmit()}
              />
              <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowPwd(!showPwd)} type="button">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 确认密码（仅注册） */}
          {isRegister && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block font-medium">确认密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="再次输入密码"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>
          )}

          <button
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2 shadow-sm"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /><span>{isRegister ? '注册中...' : '登录中...'}</span></>
            ) : (
              <span>{isRegister ? '注 册' : '登 录'}</span>
            )}
          </button>
        </div>

        <div className="mt-5 text-center">
          <p className="text-gray-400 text-[11px]">测试账号：zhangsan / 123456</p>
        </div>
      </div>
    </div>
  );
}
