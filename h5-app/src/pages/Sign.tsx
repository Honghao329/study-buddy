import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Loader2,
  Meh,
  Send,
  Users,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const STATUS_OPTIONS = [
  {
    key: 'efficient',
    label: '高效',
    desc: '专注度高，产出明显',
    icon: Flame,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    cellClassName: 'bg-amber-500 text-white',
  },
  {
    key: 'normal',
    label: '平稳',
    desc: '节奏稳定，按计划推进',
    icon: BadgeCheck,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    cellClassName: 'bg-blue-500 text-white',
  },
  {
    key: 'tired',
    label: '疲惫',
    desc: '状态一般，但仍在坚持',
    icon: Meh,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    cellClassName: 'bg-slate-400 text-white',
  },
] as const;

function formatDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function Sign() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [stats, setStats] = useState({ streak: 0, totalDays: 0, totalDuration: 0, todaySigned: false });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState('60');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'efficient' | 'normal' | 'tired'>('normal');

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadStats();
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [year, month]);

  const todayKey = useMemo(() => formatDay(now), [now]);
  const todayRecord = useMemo(() => records.find((item) => item.day === todayKey), [records, todayKey]);
  const todaySigned = !!todayRecord || stats.todaySigned;

  const loadStats = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/sign/stats');
      setStats({
        streak: Number(res?.streak || 0),
        totalDays: Number(res?.totalDays || 0),
        totalDuration: Number(res?.totalDuration || 0),
        todaySigned: !!res?.todaySigned,
      });
    } catch {}
    setLoading(false);
  };

  const loadCalendar = async () => {
    try {
      const res: any = await api.get('/sign/calendar', { year, month });
      setRecords(Array.isArray(res) ? res : res?.list || []);
    } catch {
      setRecords([]);
    }
  };

  const handleSign = async () => {
    if (todaySigned || saving) return;
    const safeDuration = Math.max(0, Number(duration) || 0);
    if (safeDuration <= 0) {
      alert('请先填写学习时长');
      return;
    }
    setSaving(true);
    try {
      await api.post('/sign/do', { duration: safeDuration, status, content: content.trim() });
      await loadStats();
      await loadCalendar();
    } catch {}
    setSaving(false);
  };

  const changeMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) { nextMonth = 12; nextYear -= 1; }
    if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i += 1) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) calendarCells.push(d);

  const getRecord = (day: number) => records.find((item) => String(item.day).slice(-2) === String(day).padStart(2, '0'));
  const getStatusMeta = (signStatus?: string) => STATUS_OPTIONS.find((item) => item.key === signStatus) || STATUS_OPTIONS[1];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-8">
      <div className="relative overflow-hidden rounded-b-[2.25rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 px-5 pb-6 pt-12 text-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-4 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Daily Sign</p>
            <h1 className="mt-1 text-lg font-semibold">签到日历</h1>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
            onClick={() => navigate('/partner/room')}
          >
            <Users size={18} />
          </button>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
          {[
            { label: '连续', value: stats.streak, icon: Flame, color: 'text-orange-200' },
            { label: '累计', value: stats.totalDays, icon: CalendarDays, color: 'text-blue-200' },
            { label: '总时长', value: stats.totalDuration, icon: Clock3, color: 'text-cyan-200' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-white/80">
                  <Icon size={14} className={item.color} />
                  <span className="text-[11px]">{item.label}</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="-mt-5 px-4">
        <div className="rounded-[1.8rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Today</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">填写今天的学习记录</h2>
            </div>
            {todaySigned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 size={13} />
                今日已提交
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                <BookOpen size={13} />
                每日自填
              </span>
            )}
          </div>

          {todayRecord && (
            <div className="mt-4 rounded-[1.4rem] bg-emerald-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${getStatusMeta(todayRecord.status).cellClassName}`}>
                    {(() => {
                      const Meta = getStatusMeta(todayRecord.status).icon;
                      return <Meta size={14} />;
                    })()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{todayRecord.duration || 0} 分钟</p>
                    <p className="text-[11px] text-slate-500">{todayRecord.content || '今天还没有写内容'}</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-emerald-600">{todayRecord.day}</span>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">学习时长</p>
                <span className="text-xs text-slate-400">分钟</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-28 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-800 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60, 90, 120].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
                      onClick={() => setDuration(String(item))}
                    >
                      {item} 分
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">状态自评</p>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {STATUS_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const active = status === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`rounded-[1.25rem] border px-3 py-3 text-left transition-all ${
                        active ? `${item.className} shadow-sm` : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                      onClick={() => setStatus(item.key)}
                    >
                      <Icon size={18} className="mb-2" />
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="mt-1 text-[10px] leading-tight opacity-80">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">学习内容</p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="今天学了什么、做了什么、有哪些收获..."
                className="min-h-32 w-full resize-none rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] leading-7 text-slate-700 outline-none placeholder:text-slate-300"
              />
            </div>

            <button
              type="button"
              onClick={handleSign}
              disabled={todaySigned || saving}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-[1.3rem] py-3.5 text-sm font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.99] disabled:opacity-60 ${
                todaySigned
                  ? 'bg-emerald-50 text-emerald-600 shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
              }`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : todaySigned ? <CheckCircle2 size={16} /> : <Send size={16} />}
              <span>{todaySigned ? '今日已提交' : saving ? '提交中...' : '提交今日打卡'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-[1.8rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500"
            onClick={() => changeMonth(-1)}
          >
            <span className="text-sm font-bold">&lt;</span>
          </button>
          <span className="text-sm font-semibold text-slate-800">
            {year}年{month}月
          </span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500"
            onClick={() => changeMonth(1)}
          >
            <span className="text-sm font-bold">&gt;</span>
          </button>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAYS.map((week) => (
            <div key={week} className="py-1 text-center text-[11px] font-medium text-slate-400">
              {week}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {calendarCells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="h-10" />;
            const record = getRecord(day);
            const meta = record ? getStatusMeta(record.status) : null;
            const MetaIcon = meta?.icon || BadgeCheck;
            const isToday = currentMonth && day === now.getDate();

            return (
              <div key={day} className="flex items-center justify-center py-1.5">
                <div
                  className={`flex h-10 w-10 flex-col items-center justify-center rounded-2xl text-sm font-medium transition-colors ${
                    record
                      ? `${meta?.cellClassName || 'bg-indigo-500 text-white'}`
                    : isToday
                        ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200'
                        : 'text-slate-600'
                  }`}
                >
                  {record ? <MetaIcon size={14} /> : day}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-[1.8rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">本月记录</h3>
          <span className="text-[11px] text-slate-400">{records.length} 条</span>
        </div>

        {records.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
            本月还没有签到记录
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const meta = getStatusMeta(record.status);
              const MetaIcon = meta.icon;
              return (
                <div key={record.day} className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${meta.cellClassName}`}>
                      <MetaIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{record.day}</p>
                        <span className="text-xs text-slate-400">{record.duration || 0} 分钟</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {record.content || '今天没有填写学习内容'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
