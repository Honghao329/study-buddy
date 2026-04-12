import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarCheck, CheckCircle2, Flame, ChevronRight, Clock, Heart, MessageCircle } from 'lucide-react';
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
  const [activities, setActivities] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const userInfo = getUserInfo();

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    const [signR, checkinR, noteR, actR, unreadR] = await Promise.allSettled([
      api.get('/sign/stats'),
      api.get('/checkin/list', { page: 1, size: 10 }),
      api.get('/note/public_list', { page: 1, size: 6, sort: 'hot' }),
      api.get('/home/activity'),
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
    if (actR.status === 'fulfilled') setActivities(Array.isArray(actR.value) ? actR.value as any[] : []);
    if (unreadR.status === 'fulfilled') setUnread(Number(unreadR.value) || 0);
  };

  const handleCheckIn = async () => {
    if (signStats.todaySigned) { navigate('/sign'); return; }
    try {
      await api.post('/sign/do', { duration: 30, status: 'normal', content: '' });
      loadAll();
    } catch {}
  };

  const noteColors = [
    { bg: 'bg-blue-50', tag: 'bg-blue-100 text-blue-600' },
    { bg: 'bg-purple-50', tag: 'bg-purple-100 text-purple-600' },
    { bg: 'bg-green-50', tag: 'bg-green-100 text-green-600' },
    { bg: 'bg-orange-50', tag: 'bg-orange-100 text-orange-600' },
    { bg: 'bg-rose-50', tag: 'bg-rose-100 text-rose-600' },
    { bg: 'bg-cyan-50', tag: 'bg-cyan-100 text-cyan-600' },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* 1. 顶部区域：渐变背景 + 问候语 + 打卡 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-b-[2.5rem] px-6 pt-10 pb-16 text-white relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 overflow-hidden">
              {userInfo?.avatar ? (
                <img src={userInfo.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold">{getGreeting()}，{userInfo?.nickname || '同学'} 👋</h1>
              <p className="text-blue-100 text-sm">今天也要元气满满哦！</p>
            </div>
          </div>
          <button
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-sm relative"
            onClick={() => navigate('/messages')}
          >
            <Bell size={20} />
            {unread > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full" />}
          </button>
        </div>

        <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div>
            <p className="text-sm text-blue-100 mb-1">今日学习目标</p>
            <p className="text-xl font-semibold">保持专注，突破自我</p>
          </div>
          <button
            onClick={handleCheckIn}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all ${
              signStats.todaySigned
                ? 'bg-green-400 text-white shadow-[0_0_15px_rgba(74,222,128,0.5)]'
                : 'bg-white text-indigo-600 hover:scale-105 shadow-lg'
            }`}
          >
            {signStats.todaySigned ? <CheckCircle2 size={18} /> : <CalendarCheck size={18} />}
            <span>{signStats.todaySigned ? '已打卡' : '立即打卡'}</span>
          </button>
        </div>
      </div>

      {/* 2. 数据悬浮卡片 */}
      <div className="-mt-8 mx-6 bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center relative z-10 border border-gray-100">
        <div className="text-center flex-1 border-r border-gray-100">
          <div className="flex items-center justify-center space-x-1 text-orange-500 mb-1">
            <Flame size={18} />
            <span className="text-xl font-bold text-slate-800">{signStats.streak}</span>
          </div>
          <p className="text-xs text-gray-500">连续打卡(天)</p>
        </div>
        <div className="text-center flex-1 border-r border-gray-100">
          <div className="text-xl font-bold text-slate-800 mb-1">{signStats.totalDuration || 0}</div>
          <p className="text-xs text-gray-500">今日学习(分)</p>
        </div>
        <div className="text-center flex-1">
          <div className="text-xl font-bold text-slate-800 mb-1">{todayDone}</div>
          <p className="text-xs text-gray-500">完成任务</p>
        </div>
      </div>

      {/* 3. 精选笔记 (横向滑动) */}
      {notes.length > 0 && (
        <div className="mt-8">
          <div className="px-6 flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">精选笔记</h2>
            <button className="text-sm text-gray-400 flex items-center hover:text-blue-600" onClick={() => navigate('/community')}>
              查看更多 <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex overflow-x-auto px-6 pb-4 space-x-4" style={{ scrollbarWidth: 'none' }}>
            {notes.map((n: any, i: number) => {
              const c = noteColors[i % noteColors.length];
              return (
                <div key={n.id} className="min-w-[200px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-shrink-0 relative overflow-hidden"
                  onClick={() => navigate(`/note/${n.id}`)}>
                  <div className={`absolute top-0 right-0 w-16 h-16 ${c.bg} rounded-bl-full`} />
                  <div className="relative z-10">
                    <span className={`inline-block px-2 py-1 ${c.tag} text-[10px] font-bold rounded-md mb-2`}>{n.user_name || '匿名'}</span>
                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 text-sm">{n.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-4">
                      <span className="flex items-center"><Heart size={12} className="mr-1" /> {n.like_cnt || 0}</span>
                      <span>💬 {n.comment_cnt || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 今日打卡 */}
      {tasks.length > 0 && (
        <div className="mt-4 px-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-slate-800">今日打卡</h2>
            <button className="text-sm text-gray-400 flex items-center" onClick={() => navigate('/checkin')}>
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          {tasks.slice(0, 4).map((t: any) => (
            <div key={t.id} className="bg-white p-3.5 rounded-xl border border-gray-100 mb-2 flex items-center gap-3"
              onClick={() => navigate(`/checkin/${t.id}`)}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                t._joined ? 'bg-green-500' : 'border-2 border-gray-300'
              }`}>
                {t._joined && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className={`flex-1 text-sm truncate ${t._joined ? 'text-gray-400 line-through' : 'font-medium text-slate-800'}`}>{t.title}</span>
              <span className="text-xs text-gray-400">{t.join_cnt || 0}人</span>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          ))}
        </div>
      )}

      {/* 5. 学习动态 */}
      {activities.length > 0 && (
        <div className="mt-6 px-6 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">学习动态</h2>
          <div className="space-y-3">
            {activities.map((a: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex gap-3">
                {a.avatar ? (
                  <img src={a.avatar} alt="" className="w-10 h-10 rounded-full shrink-0 bg-blue-100 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full shrink-0 bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-500 text-sm">👤</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{a.text}</p>
                  <span className="text-[11px] text-gray-400 flex items-center mt-1"><Clock size={12} className="mr-1" />{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
