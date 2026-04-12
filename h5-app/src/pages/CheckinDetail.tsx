import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, UserPlus, Clock, Loader2, ClipboardCheck } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function CheckinDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [todayDone, setTodayDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detailR, recordsR, joinedR, doneR] = await Promise.allSettled([
        api.get(`/checkin/detail/${id}`),
        api.get(`/checkin/records/${id}`),
        api.get('/checkin/my_joined_ids'),
        api.get('/checkin/today_done_ids'),
      ]);
      if (detailR.status === 'fulfilled') setTask(detailR.value);
      if (recordsR.status === 'fulfilled') setRecords(Array.isArray(recordsR.value) ? recordsR.value as any[] : (recordsR.value as any)?.list || []);
      if (joinedR.status === 'fulfilled') {
        const ids = Array.isArray(joinedR.value) ? joinedR.value as number[] : [];
        setJoined(ids.includes(Number(id)));
      }
      if (doneR.status === 'fulfilled') {
        const ids = Array.isArray(doneR.value) ? doneR.value as number[] : [];
        setTodayDone(ids.includes(Number(id)));
      }
    } catch {}
    setLoading(false);
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await api.post('/checkin/join', { checkinId: Number(id) });
      setJoined(true);
      loadData();
    } catch {}
    setActionLoading(false);
  };

  const handleCheckin = async () => {
    setActionLoading(true);
    try {
      await api.post('/checkin/do', { checkinId: Number(id) });
      setTodayDone(true);
      loadData();
    } catch {}
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <ClipboardCheck size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm mb-4">任务不存在或已删除</p>
        <button className="text-indigo-600 text-sm font-medium" onClick={() => navigate(-1)}>返回</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">打卡详情</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Task Info Card */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h1 className="text-lg font-bold text-slate-800 mb-2">{task.title}</h1>
          {task.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{task.description}</p>
          )}
          <div className="flex items-center space-x-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
            <span className="flex items-center space-x-1">
              <Users size={13} />
              <span>{task.join_cnt || 0} 人参与</span>
            </span>
            {task.creator_name && (
              <span className="flex items-center space-x-1">
                <span>创建者: {task.creator_name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Records Timeline */}
        <div className="mx-4 mt-4">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">打卡记录</h3>
          {records.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <ClipboardCheck size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">暂无打卡记录，快来第一个打卡吧</p>
            </div>
          ) : (
            <div className="space-y-0">
              {records.map((r: any, i: number) => (
                <div key={r.id || i} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                      {r.user_avatar ? (
                        <img src={r.user_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-500">{(r.user_name || '?')[0]}</span>
                      )}
                    </div>
                    {i < records.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{r.user_name || '匿名'}</span>
                        <span className="text-[10px] text-gray-400 flex items-center">
                          <Clock size={10} className="mr-0.5" />
                          {r.created_at?.slice(0, 16)?.replace('T', ' ')}
                        </span>
                      </div>
                      {r.content && <p className="text-xs text-gray-500">{r.content}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-5 py-4 z-30">
        {!joined ? (
          <button
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all disabled:opacity-60"
            onClick={handleJoin}
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            <span>{actionLoading ? '处理中...' : '加入任务'}</span>
          </button>
        ) : todayDone ? (
          <button
            className="w-full py-3.5 bg-green-50 text-green-600 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 border border-green-100"
            disabled
          >
            <CheckCircle size={18} />
            <span>今日已打卡</span>
          </button>
        ) : (
          <button
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all disabled:opacity-60"
            onClick={handleCheckin}
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            <span>{actionLoading ? '处理中...' : '立即打卡'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
