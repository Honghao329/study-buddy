import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  CalendarCheck,
  ChevronRight,
  FileText,
  Loader2,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react';
import { api, clearToken, getUserInfo, isLoggedIn } from '../api/request';
import { resolveMediaUrl } from '../utils/media';

export default function My() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(getUserInfo());
  const [currentPartner, setCurrentPartner] = useState<any>(null);
  const [stats, setStats] = useState({ noteCount: 0, checkinCount: 0, signDays: 0, partnerCount: 0 });
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [userR, statsR, unreadR, partnerR] = await Promise.allSettled([
      api.get('/user/info'),
      api.get('/user/my_stats'),
      api.get('/message/unread_count'),
      api.get('/partner/current'),
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
    if (partnerR.status === 'fulfilled') setCurrentPartner((partnerR.value as any)?.partner || null);
    setLoading(false);
  };

  const handleLogout = () => {
    if (!confirm('确定退出登录？')) return;
    clearToken();
    navigate('/login');
  };

  const menus = [
    { icon: FileText, label: '我的笔记', path: '/my/notes', color: 'text-blue-500 bg-blue-50' },
    { icon: Bookmark, label: '我的收藏', path: '/favorite', color: 'text-purple-500 bg-purple-50' },
    { icon: Bell, label: '消息通知', path: '/messages', color: 'text-orange-500 bg-orange-50', badge: unread > 0 ? unread : undefined },
    { icon: CalendarCheck, label: '签到日历', path: '/sign', color: 'text-emerald-500 bg-emerald-50' },
    { icon: Users, label: '学伴', path: '/partner', color: 'text-pink-500 bg-pink-50' },
    ...(currentPartner ? [{ icon: Sparkles, label: '伙伴空间', path: '/partner/room', color: 'text-cyan-500 bg-cyan-50' }] : []),
  ];

  const statItems = [
    { label: '笔记', value: stats.noteCount },
    { label: '打卡', value: stats.checkinCount },
    { label: '签到', value: stats.signDays },
    { label: '学伴', value: stats.partnerCount },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-24">
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 px-6 pb-20 pt-14 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -left-8 bottom-8 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white/35 bg-white/20">
            {user?.avatar ? (
              <img src={resolveMediaUrl(user.avatar)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold">
                {(user?.nickname || '?')[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold">{user?.nickname || '未登录'}</h2>
            <p className="mt-1 line-clamp-1 text-sm text-blue-100">{user?.bio || '这个人很懒，什么都没写~'}</p>
          </div>
        </div>
      </div>

      {currentPartner ? (
        <div className="-mt-10 mx-5 overflow-hidden rounded-[1.8rem] border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-14 w-14 overflow-hidden rounded-[1.2rem] bg-slate-100"
              onClick={() => navigate(`/user/${currentPartner.id}`)}
            >
              {currentPartner.avatar ? (
                <img src={resolveMediaUrl(currentPartner.avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-indigo-500">
                  {(currentPartner.nickname || '?')[0]}
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-900">当前伙伴：{currentPartner.nickname || '伙伴'}</h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">一对一</span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-slate-400">{currentPartner.bio || 'TA 还没有写简介'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-full bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-600"
              onClick={() => navigate(`/user/${currentPartner.id}`)}
            >
              查看主页
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white"
              onClick={() => navigate('/partner/room')}
            >
              进入伙伴空间
            </button>
          </div>
        </div>
      ) : (
        <div className="-mt-10 mx-5 rounded-[1.8rem] border border-dashed border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-indigo-50 text-indigo-500">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-900">还没有当前伙伴</h3>
              <p className="mt-1 text-xs text-slate-400">先去发现列表建立关系，再进入专属伙伴空间。</p>
            </div>
          </div>
        </div>
      )}

      <div className="-mt-8 mx-5 rounded-[1.8rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex justify-between gap-2">
          {statItems.map((item) => (
            <div key={item.label} className="flex-1 text-center">
              <div className="text-2xl font-bold text-slate-900">{item.value}</div>
              <p className="mt-0.5 text-[11px] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-5 overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white shadow-sm">
        {menus.map((menu, index) => {
          const Icon = menu.icon;
          return (
            <div
              key={menu.label}
              className={`flex items-center px-5 py-4 transition-colors active:bg-slate-50 ${
                index < menus.length - 1 ? 'border-b border-slate-50' : ''
              }`}
              onClick={() => navigate(menu.path)}
            >
              <div className={`mr-3 flex h-10 w-10 items-center justify-center rounded-[1rem] ${menu.color}`}>
                <Icon size={18} />
              </div>
              <span className="flex-1 text-[15px] font-medium text-slate-700">{menu.label}</span>
              {menu.badge && (
                <span className="mr-2 min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                  {menu.badge > 99 ? '99+' : menu.badge}
                </span>
              )}
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          );
        })}
      </div>

      <div className="mx-4 mt-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[1.6rem] border border-rose-100 bg-white py-3.5 text-[15px] font-medium text-rose-500 shadow-sm active:bg-rose-50"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
