import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CalendarCheck, CheckCircle2, Flame, ChevronRight,
  Heart, PenLine, Calendar, Users, BarChart3, Loader2, Trophy, Award,
} from 'lucide-react';
import { api, isLoggedIn, getUserInfo } from '../api/request';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export default function Home() {
  const navigate = useNavigate();
  const [signStats, setSignStats] = useState({ streak: 0, totalDays: 0, totalDuration: 0, todaySigned: false });
  const [tasks, setTasks] = useState<any[]>([]);
  const [todayDone, setTodayDone] = useState(0);
  const [notes, setNotes] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myPartners, setMyPartners] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const userInfo = getUserInfo();

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [signR, checkinR, noteR, leaderR, partnerR, unreadR] = await Promise.allSettled([
      api.get('/sign/stats'),
      api.get('/checkin/list', { page: 1, size: 10 }),
      api.get('/note/public_list', { page: 1, size: 6, sort: 'hot' }),
      api.get('/sign/leaderboard', { limit: 5 }),
      api.get('/partner/my_list'),
      api.get('/message/unread_count'),
    ]);
    if (signR.status === 'fulfilled') {
      const s: any = signR.value || {};
      setSignStats({ streak: s.streak || 0, totalDays: s.totalDays || 0, totalDuration: s.totalDuration || 0, todaySigned: !!s.todaySigned });
    }
    if (checkinR.status === 'fulfilled') {
      const list = (checkinR.value as any)?.list || [];
      let doneIds: number[] = [];
      if (list.length) { try { doneIds = await api.get('/checkin/today_done_ids') as any; } catch {} }
      const mapped = list.map((t: any) => ({ ...t, _joined: (doneIds || []).includes(t.id) }));
      setTasks(mapped);
      setTodayDone(mapped.filter((t: any) => t._joined).length);
    }
    if (noteR.status === 'fulfilled') setNotes((noteR.value as any)?.list || []);
    if (leaderR.status === 'fulfilled') setLeaderboard(Array.isArray(leaderR.value) ? leaderR.value as any[] : []);
    if (partnerR.status === 'fulfilled') setMyPartners(Array.isArray(partnerR.value) ? (partnerR.value as any[]).slice(0, 4) : ((partnerR.value as any)?.list || []).slice(0, 4));
    if (unreadR.status === 'fulfilled') setUnread(Number(unreadR.value) || 0);
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (signStats.todaySigned) { navigate('/sign'); return; }
    try {
      await api.post('/sign/do', { duration: 30, status: 'normal', content: '' });
      loadAll();
    } catch {}
  };

  const noteColors = [
    { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', tag: 'bg-blue-100 text-blue-700' },
    { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', tag: 'bg-purple-100 text-purple-700' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', tag: 'bg-emerald-100 text-emerald-700' },
    { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', tag: 'bg-amber-100 text-amber-700' },
    { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600', tag: 'bg-rose-100 text-rose-700' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600', tag: 'bg-cyan-100 text-cyan-700' },
  ];

  const quickActions = [
    { icon: PenLine, label: '写笔记', desc: '记录灵感', color: 'from-blue-500 to-blue-600', path: '/note/add' },
    { icon: Calendar, label: '签到日历', desc: '查看记录', color: 'from-emerald-500 to-emerald-600', path: '/sign' },
    { icon: Users, label: '学伴', desc: '结伴学习', color: 'from-purple-500 to-purple-600', path: '/partner' },
    { icon: BarChart3, label: '我的统计', desc: '学习数据', color: 'from-amber-500 to-amber-600', path: '/my' },
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
      {/* ===== Gradient Header ===== */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-b-[2.5rem] px-6 pt-12 pb-20 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-20 -left-8 w-24 h-24 bg-white/5 rounded-full" />

        {/* Top row: avatar + greeting + bell */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 overflow-hidden backdrop-blur-sm">
              {userInfo?.avatar ? (
                <img src={userInfo.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold">{(userInfo?.nickname || '?')[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{getGreeting()}，{userInfo?.nickname || '同学'}</h1>
              <p className="text-blue-200 text-sm">今天也要元气满满哦</p>
            </div>
          </div>
          <button
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm relative"
            onClick={() => navigate('/messages')}
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center px-1 border-2 border-indigo-600">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        </div>

        {/* Glass-morphism checkin card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm text-blue-100 mb-1">今日学习目标</p>
            <p className="text-lg font-semibold">保持专注，突破自我</p>
          </div>
          <button
            onClick={handleCheckIn}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95 ${
              signStats.todaySigned
                ? 'bg-green-400/90 text-white shadow-[0_0_20px_rgba(74,222,128,0.4)]'
                : 'bg-white text-indigo-600 hover:shadow-lg shadow-md'
            }`}
          >
            {signStats.todaySigned ? <CheckCircle2 size={18} /> : <CalendarCheck size={18} />}
            <span>{signStats.todaySigned ? '已打卡' : '立即打卡'}</span>
          </button>
        </div>
      </div>

      {/* ===== Floating Stats Card ===== */}
      <div className="-mt-8 mx-5 bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center relative z-10 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="text-center flex-1 border-r border-gray-100">
          <div className="flex items-center justify-center space-x-1 text-orange-500 mb-1">
            <Flame size={18} />
            <span className="text-2xl font-bold text-slate-800">{signStats.streak}</span>
          </div>
          <p className="text-[11px] text-gray-500">连续打卡(天)</p>
        </div>
        <div className="text-center flex-1 border-r border-gray-100">
          <div className="text-2xl font-bold text-slate-800 mb-1">{signStats.totalDuration || 0}</div>
          <p className="text-[11px] text-gray-500">今日学习(分)</p>
        </div>
        <div className="text-center flex-1">
          <div className="text-2xl font-bold text-slate-800 mb-1">{todayDone}</div>
          <p className="text-[11px] text-gray-500">完成任务</p>
        </div>
      </div>

      {/* ===== Quick Actions 2x2 Grid ===== */}
      <div className="mt-6 px-5">
        <h2 className="text-base font-bold text-slate-800 mb-3">快捷功能</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                className="flex flex-col items-center py-3 group"
                onClick={() => navigate(a.path)}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-2 shadow-sm group-active:scale-95 transition-transform`}>
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-xs font-medium text-slate-700">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Horizontal Scrolling Note Cards ===== */}
      {notes.length > 0 && (
        <div className="mt-6">
          <div className="px-5 flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-800">精选笔记</h2>
            <button className="text-sm text-gray-400 flex items-center hover:text-indigo-500 transition-colors" onClick={() => navigate('/community')}>
              更多 <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex overflow-x-auto px-5 pb-2 space-x-3 scrollbar-hide" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {notes.map((n: any, i: number) => {
              const c = noteColors[i % noteColors.length];
              return (
                <div
                  key={n.id}
                  className="min-w-[180px] max-w-[180px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-shrink-0 relative overflow-hidden hover:shadow-md transition-shadow active:scale-[0.97]"
                  onClick={() => navigate(`/note/${n.id}`)}
                >
                  {/* Colored corner accent */}
                  <div className={`absolute top-0 right-0 w-14 h-14 ${c.light} rounded-bl-[2rem]`} />
                  <div className={`absolute top-0 right-0 w-3 h-3 ${c.bg} rounded-bl-lg`} />

                  <div className="relative z-10">
                    <span className={`inline-block px-2 py-0.5 ${c.tag} text-[10px] font-bold rounded-md mb-2`}>
                      {n.user_name || '匿名'}
                    </span>
                    <h3 className="font-semibold text-slate-800 mb-1.5 line-clamp-2 text-sm leading-snug">{n.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">{n.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="flex items-center"><Heart size={11} className="mr-0.5" /> {n.like_cnt || 0}</span>
                      <span className="flex items-center">💬 {n.comment_cnt || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Today's Checkin Tasks ===== */}
      {tasks.length > 0 && (
        <div className="mt-6 px-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-800">今日打卡</h2>
            <button className="text-sm text-gray-400 flex items-center hover:text-indigo-500 transition-colors" onClick={() => navigate('/checkin')}>
              全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 4).map((t: any) => (
              <div
                key={t.id}
                className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center gap-3 hover:shadow-sm transition-shadow active:scale-[0.98]"
                onClick={() => navigate(`/checkin/${t.id}`)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  t._joined ? 'bg-green-500' : 'border-2 border-gray-300'
                }`}>
                  {t._joined && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className={`flex-1 text-sm truncate ${t._joined ? 'text-gray-400 line-through' : 'font-medium text-slate-800'}`}>{t.title}</span>
                <span className="text-[11px] text-gray-400 shrink-0">{t.join_cnt || 0}人</span>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Study Leaderboard ===== */}
      {leaderboard.length > 0 && (
        <div className="mt-6 px-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Trophy size={18} className="text-amber-500" /> 签到排行
            </h2>
            <button className="text-sm text-gray-400 flex items-center hover:text-indigo-500 transition-colors" onClick={() => navigate('/sign')}>
              更多 <ChevronRight size={16} />
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {leaderboard.map((u: any, i: number) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div
                  key={u.id || i}
                  className={`flex items-center px-4 py-3 ${i < leaderboard.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}
                  onClick={() => u.id && navigate(`/user/${u.id}`)}
                >
                  <span className="w-7 text-center shrink-0">
                    {i < 3 ? <span className="text-lg">{medals[i]}</span> : <span className="text-xs text-gray-400 font-bold">{i + 1}</span>}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0 ml-2">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-indigo-500">{(u.nickname || '?')[0]}</span>
                    )}
                  </div>
                  <span className="ml-3 flex-1 text-sm font-medium text-slate-700 truncate">{u.nickname || '匿名'}</span>
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Flame size={13} />
                    <span className="font-bold">{u.total_days || u.streak || 0}</span>
                    <span className="text-gray-400">天</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== My Study Partners ===== */}
      {myPartners.length > 0 && (
        <div className="mt-6 px-5 mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Award size={18} className="text-purple-500" /> 我的学伴
            </h2>
            <button className="text-sm text-gray-400 flex items-center hover:text-indigo-500 transition-colors" onClick={() => navigate('/partner')}>
              全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {myPartners.map((p: any) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.97]"
                onClick={() => navigate(`/user/${p.user_id || p.id}`)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden shrink-0">
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-purple-500">{(p.nickname || p.user_name || '?')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.nickname || p.user_name || '学伴'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.bio || '一起学习吧'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spacer for empty states */}
      {leaderboard.length === 0 && myPartners.length === 0 && <div className="h-8" />}
    </div>
  );
}
