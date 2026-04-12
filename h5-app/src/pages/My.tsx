import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Bookmark, Bell, CalendarCheck, Users, UserCog, KeyRound,
  LogOut, ChevronRight, Loader2,
} from 'lucide-react';
import { api, isLoggedIn, getUserInfo, clearToken } from '../api/request';

export default function My() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(getUserInfo());
  const [stats, setStats] = useState({ noteCount: 0, checkinCount: 0, signDays: 0, partnerCount: 0 });
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [userR, statsR, unreadR] = await Promise.allSettled([
      api.get('/user/info'),
      api.get('/user/my_stats'),
      api.get('/message/unread_count'),
    ]);
    if (userR.status === 'fulfilled' && userR.value) {
      setUser(userR.value);
      localStorage.setItem('userInfo', JSON.stringify(userR.value));
    }
    if (statsR.status === 'fulfilled' && statsR.value) {
      const s: any = statsR.value;
      setStats({
        noteCount: s.noteCount || 0,
        checkinCount: s.checkinCount || 0,
        signDays: s.signDays || 0,
        partnerCount: s.partnerCount || 0,
      });
    }
    if (unreadR.status === 'fulfilled') setUnread(Number(unreadR.value) || 0);
    setLoading(false);
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const menus = [
    { icon: FileText, label: '我的笔记', path: '/my/notes', color: 'text-blue-500 bg-blue-50' },
    { icon: Bookmark, label: '我的收藏', path: '/favorite', color: 'text-purple-500 bg-purple-50' },
    { icon: Bell, label: '消息通知', path: '/messages', color: 'text-orange-500 bg-orange-50', badge: unread > 0 ? unread : undefined },
    { icon: CalendarCheck, label: '签到日历', path: '/sign', color: 'text-emerald-500 bg-emerald-50' },
    { icon: Users, label: '学伴', path: '/partner', color: 'text-pink-500 bg-pink-50' },
  ];

  const statItems = [
    { label: '笔记', value: stats.noteCount },
    { label: '打卡', value: stats.checkinCount },
    { label: '签到', value: stats.signDays },
    { label: '学伴', value: stats.partnerCount },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-14 pb-20 rounded-b-[2.5rem] text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-[72px] h-[72px] rounded-full bg-white/20 border-[3px] border-white/40 flex items-center justify-center overflow-hidden backdrop-blur-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold">{(user?.nickname || '?')[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{user?.nickname || '未登录'}</h2>
            <p className="text-blue-200 text-sm mt-0.5 line-clamp-1">{user?.bio || '这个人很懒，什么都没写~'}</p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="-mt-10 mx-5 bg-white rounded-2xl shadow-sm p-5 relative z-10 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between">
          {statItems.map((s) => (
            <div key={s.label} className="text-center flex-1">
              <div className="text-2xl font-bold text-slate-800">{s.value}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="mx-4 mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {menus.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`flex items-center px-5 py-4 active:bg-gray-50 transition-colors ${
                i < menus.length - 1 ? 'border-b border-gray-50' : ''
              }`}
              onClick={() => navigate(m.path)}
            >
              <div className={`w-9 h-9 rounded-xl ${m.color} flex items-center justify-center mr-3`}>
                <Icon size={18} />
              </div>
              <span className="flex-1 text-[15px] font-medium text-slate-700">{m.label}</span>
              {m.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 min-w-[18px] text-center">
                  {m.badge > 99 ? '99+' : m.badge}
                </span>
              )}
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4 mb-6">
        <button
          className="w-full flex items-center justify-center space-x-2 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-red-500 font-medium text-[15px] active:bg-red-50 transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
