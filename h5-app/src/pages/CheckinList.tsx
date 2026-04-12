import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function CheckinList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [joinedIds, setJoinedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, idsRes] = await Promise.allSettled([
        api.get('/checkin/list', { page: 1, size: 50 }),
        api.get('/checkin/my_joined_ids'),
      ]);
      if (listRes.status === 'fulfilled') setTasks((listRes.value as any)?.list || []);
      if (idsRes.status === 'fulfilled') setJoinedIds(Array.isArray(idsRes.value) ? idsRes.value as any : []);
    } catch {}
    setLoading(false);
  };

  const tagColors = [
    'bg-blue-50 text-blue-600',
    'bg-purple-50 text-purple-600',
    'bg-emerald-50 text-emerald-600',
    'bg-amber-50 text-amber-600',
    'bg-rose-50 text-rose-600',
  ];

  const joinedCount = tasks.filter(t => joinedIds.includes(t.id)).length;

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-12 pb-16 rounded-b-[2rem] text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-4 -left-6 w-24 h-24 bg-white/5 rounded-full" />
        <h1 className="text-xl font-bold mb-1 relative z-10">打卡任务</h1>
        <p className="text-blue-200 text-sm relative z-10">坚持每日打卡，养成好习惯</p>
      </div>

      {/* Summary Card */}
      <div className="-mt-8 mx-5 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between relative z-10 border border-gray-100 hover:shadow-md transition-shadow mb-5">
        <div className="text-center flex-1">
          <div className="text-2xl font-bold text-slate-800">{tasks.length}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">全部任务</p>
        </div>
        <div className="w-px h-10 bg-gray-100" />
        <div className="text-center flex-1">
          <div className="text-2xl font-bold text-indigo-600">{joinedCount}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">已加入</p>
        </div>
      </div>

      {/* Summary text */}
      <div className="px-5 mb-3">
        <p className="text-xs text-gray-400">共 {tasks.length} 个任务 · 已加入 {joinedCount} 个</p>
      </div>

      {/* Task List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">暂无打卡任务</p>
          </div>
        ) : (
          tasks.map((t: any, i: number) => {
            const joined = joinedIds.includes(t.id);
            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all"
                onClick={() => navigate(`/checkin/${t.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-slate-800 text-[15px] truncate">{t.title}</h3>
                      {joined && (
                        <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full shrink-0">
                          <CheckCircle2 size={10} />
                          <span>已加入</span>
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">{t.description}</p>
                    )}
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users size={12} />
                        <span>{t.join_cnt || 0} 人参与</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${tagColors[i % tagColors.length]}`}>
                        {t.category || '日常'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1 ml-2" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
