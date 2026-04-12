import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api/request';

export default function Login() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}>
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">📖</div>
        <h1 className="text-2xl font-bold text-white mb-1">学习伴侣</h1>
        <p className="text-blue-200 text-sm">记录学习，结伴成长</p>
      </div>

      <div className="w-full bg-white rounded-2xl px-6 py-8 shadow-xl">
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}
        <div className="mb-4">
          <label className="text-sm text-gray-500 mb-1.5 block">昵称</label>
          <input className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base outline-none focus:ring-2 focus:ring-indigo-200 transition"
            placeholder="请输入昵称" value={nickname} onChange={e => setNickname(e.target.value)} />
        </div>
        <div className="mb-6">
          <label className="text-sm text-gray-500 mb-1.5 block">密码</label>
          <input className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base outline-none focus:ring-2 focus:ring-indigo-200 transition"
            type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <button className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 transition disabled:opacity-50"
          disabled={loading} onClick={handleLogin}>
          {loading ? '登录中...' : '登 录'}
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-blue-200/60 text-xs">测试账号：user1 / 123456</p>
        <p className="text-blue-200/60 text-xs mt-1">测试账号：user2 / 123456</p>
      </div>
    </div>
  );
}
