import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Sign() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [stats, setStats] = useState({ streak: 0, totalDays: 0, totalDuration: 0, todaySigned: false });
  const [signedDays, setSignedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadData();
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [year, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/sign/stats');
      if (res) {
        setStats({
          streak: res.streak || 0,
          totalDays: res.totalDays || 0,
          totalDuration: res.totalDuration || 0,
          todaySigned: !!res.todaySigned,
        });
      }
    } catch {}
    setLoading(false);
  };

  const loadCalendar = async () => {
    try {
      const res: any = await api.get('/sign/calendar', { year, month });
      setSignedDays(Array.isArray(res) ? res : res?.days || []);
    } catch {}
  };

  const handleSign = async () => {
    if (stats.todaySigned || signing) return;
    setSigning(true);
    try {
      await api.post('/sign/do', { duration: 30, status: 'normal', content: '' });
      setStats(prev => ({ ...prev, todaySigned: true, streak: prev.streak + 1, totalDays: prev.totalDays + 1 }));
      loadCalendar();
    } catch {}
    setSigning(false);
  };

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setYear(y);
    setMonth(m); // React 18 batches these, but setting year first avoids stale combo
  };

  // Calendar grid computation
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Gradient Header with Stats */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-12 pb-16 rounded-b-[2rem] text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-4 -left-6 w-24 h-24 bg-white/5 rounded-full" />

        {/* Back button */}
        <button
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-4 hover:bg-white/20 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-xl font-bold mb-4">签到日历</h1>

        {/* Stats row */}
        <div className="flex justify-between">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Flame size={16} className="text-orange-300" />
              <span className="text-2xl font-bold">{stats.streak}</span>
            </div>
            <p className="text-blue-200 text-[11px]">连续签到(天)</p>
          </div>
          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Calendar size={16} className="text-blue-200" />
              <span className="text-2xl font-bold">{stats.totalDays}</span>
            </div>
            <p className="text-blue-200 text-[11px]">累计签到(天)</p>
          </div>
          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock size={16} className="text-blue-200" />
              <span className="text-2xl font-bold">{stats.totalDuration}</span>
            </div>
            <p className="text-blue-200 text-[11px]">学习时长(分)</p>
          </div>
        </div>
      </div>

      {/* Sign Button */}
      <div className="-mt-8 mx-5 relative z-10">
        <button
          onClick={handleSign}
          disabled={stats.todaySigned || signing}
          className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-sm ${
            stats.todaySigned
              ? 'bg-green-50 text-green-600 border border-green-100'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/30'
          }`}
        >
          {signing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : stats.todaySigned ? (
            <CheckCircle size={20} />
          ) : (
            <Calendar size={20} />
          )}
          <span>{signing ? '签到中...' : stats.todaySigned ? '今日已签到' : '立即签到'}</span>
        </button>
      </div>

      {/* Calendar */}
      <div className="mx-4 mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => changeMonth(-1)}>
            <span className="text-sm font-bold">&lt;</span>
          </button>
          <span className="text-sm font-semibold text-slate-800">{year}年{month}月</span>
          <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => changeMonth(1)}>
            <span className="text-sm font-bold">&gt;</span>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-center text-[11px] text-gray-400 font-medium py-1">{w}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const isSigned = signedDays.includes(day);
            const isToday = isCurrentMonth && day === today;
            return (
              <div key={day} className="flex items-center justify-center py-1.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${
                  isSigned
                    ? 'bg-indigo-600 text-white'
                    : isToday
                      ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200'
                      : 'text-gray-600'
                }`}>
                  {isSigned ? <CheckCircle size={16} /> : day}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-indigo-600 rounded" />
            <span className="text-[11px] text-gray-500">已签到</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-indigo-50 rounded ring-1 ring-indigo-200" />
            <span className="text-[11px] text-gray-500">今天</span>
          </div>
        </div>
      </div>
    </div>
  );
}
