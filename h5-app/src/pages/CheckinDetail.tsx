import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle, UserPlus, Clock, Loader2, ClipboardCheck,
  Shield, MessageSquare, Send, X, ArrowRightLeft, Bell,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

const MAX_RECORDS = 20;

export default function CheckinDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [pickerMode, setPickerMode] = useState<'supervisor' | 'invite' | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [commentingRecordId, setCommentingRecordId] = useState<number | null>(null);
  const [supervisorComment, setSupervisorComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detailR, recordsR] = await Promise.allSettled([
        api.get(`/checkin/detail/${id}`),
        api.get(`/checkin/records/${id}`, { page: 1, size: MAX_RECORDS }),
      ]);
      if (detailR.status === 'fulfilled') setTask(detailR.value);
      if (recordsR.status === 'fulfilled') {
        const val: any = recordsR.value;
        setRecords(Array.isArray(val) ? val : val?.list || []);
        setTotalRecords(val?.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  // 打卡（加入+打卡一体）
  const handleCheckin = async () => {
    setActionLoading(true);
    try {
      await api.post('/checkin/join', { checkinId: Number(id) });
      loadData();
    } catch {}
    setActionLoading(false);
  };

  // 打开学伴选择弹窗
  const openPicker = async (mode: 'supervisor' | 'invite') => {
    setPickerMode(mode);
    setPartnersLoading(true);
    try {
      const res: any = await api.get('/partner/my_list');
      setPartners(Array.isArray(res) ? res : res?.list || []);
    } catch { setPartners([]); }
    setPartnersLoading(false);
  };

  const getPartnerUserId = (p: any): number => {
    if (p.user_id === currentUser.id) return p.target_id;
    if (p.target_id === currentUser.id) return p.user_id;
    return p.user_id || p.id;
  };
  const getPartnerName = (p: any): string => {
    if (p.user_id === currentUser.id) return p.target_name || '学伴';
    if (p.target_id === currentUser.id) return p.user_name || '学伴';
    return p.user_name || p.target_name || '学伴';
  };
  const getPartnerAvatar = (p: any): string => {
    if (p.user_id === currentUser.id) return p.target_pic || '';
    if (p.target_id === currentUser.id) return p.user_pic || '';
    return p.user_pic || p.target_pic || '';
  };

  const inviteSupervisor = async (userId: number) => {
    setInviting(true);
    try {
      await api.post('/checkin/invite_supervisor', { checkinId: Number(id), supervisorId: userId });
      setPickerMode(null);
      loadData();
    } catch {}
    setInviting(false);
  };

  const inviteJoin = async (userId: number) => {
    setInviting(true);
    try {
      await api.post('/checkin/invite_join', { checkinId: Number(id), targetUserId: userId });
      setPickerMode(null);
    } catch {}
    setInviting(false);
  };

  // 监督者催打卡
  const handleRemind = async () => {
    try {
      await api.post('/checkin/remind', { checkinId: Number(id) });
    } catch {}
  };

  const submitSupervisorComment = async () => {
    if (!supervisorComment.trim() || !commentingRecordId || commentSending) return;
    setCommentSending(true);
    try {
      await api.post('/checkin/comment_record', { recordId: commentingRecordId, comment: supervisorComment.trim() });
      setSupervisorComment('');
      setCommentingRecordId(null);
      loadData();
    } catch {}
    setCommentSending(false);
  };

  // 身份判断
  const isCreator = task && currentUser?.id && task.creator_id === currentUser.id;
  const isSupervisor = task && currentUser?.id && task.supervisor_id === currentUser.id;
  const canSeeSupervisor = isCreator || isSupervisor;
  const todayDone = !!task?.today_done;
  const hasParticipated = !!task?.has_participated;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <ClipboardCheck size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm mb-4">任务不存在或已删除</p>
        <button className="text-blue-600 text-sm font-medium" onClick={() => navigate(-1)}>返回</button>
      </div>
    );
  }

  const displayRecords = records.slice(0, MAX_RECORDS);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">打卡详情</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Task Info */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h1 className="text-lg font-bold text-slate-800 mb-2">{task.title}</h1>
          {task.description && <p className="text-sm text-gray-500 leading-relaxed mb-4">{task.description}</p>}
          <div className="flex items-center space-x-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
            <span className="flex items-center space-x-1"><Users size={13} /><span>{task.join_cnt || 0} 人参与</span></span>
            {hasParticipated && <span>我的打卡 {task.my_total || 0} 次</span>}
          </div>
        </div>

        {/* === 监督关系区 === 只有创建者和监督人能看 */}
        {canSeeSupervisor && (
          <div className="mx-4 mt-3">
            {task.supervisor_id ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden border-[3px] border-blue-200 cursor-pointer"
                      onClick={() => navigate(`/user/${task.creator_id}`)}>
                      {task.creator_avatar
                        ? <img src={task.creator_avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-lg font-bold text-blue-500">{(task.creator_name || '?')[0]}</span>}
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-1.5 truncate max-w-[80px] text-center">{task.creator_name || '创建者'}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full mt-0.5">被监督</span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                      <Shield size={18} className="text-amber-500" />
                    </div>
                    <ArrowRightLeft size={12} className="text-gray-300 mt-1" />
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center overflow-hidden border-[3px] border-amber-200 cursor-pointer"
                      onClick={() => navigate(`/user/${task.supervisor_id}`)}>
                      {task.supervisor_avatar
                        ? <img src={task.supervisor_avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-lg font-bold text-amber-500">{(task.supervisor_display_name || '?')[0]}</span>}
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-1.5 truncate max-w-[80px] text-center">{task.supervisor_display_name || task.supervisor_name || '监督人'}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full mt-0.5">监督人</span>
                  </div>
                </div>
                {/* 监督人专属：催打卡按钮 */}
                {isSupervisor && !todayDone && (
                  <button
                    className="w-full mt-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm font-medium flex items-center justify-center space-x-1.5 hover:bg-amber-100 active:scale-[0.98] transition-all"
                    onClick={handleRemind}
                  >
                    <Bell size={15} />
                    <span>催 TA 打卡</span>
                  </button>
                )}
              </div>
            ) : isCreator ? (
              <button
                className="w-full bg-white rounded-2xl shadow-sm border border-dashed border-blue-200 px-4 py-4 flex items-center justify-center space-x-2 text-blue-600 hover:bg-blue-50 transition-colors active:scale-[0.98]"
                onClick={() => openPicker('supervisor')}
              >
                <Shield size={16} />
                <span className="text-sm font-medium">邀请学伴来监督我</span>
              </button>
            ) : null}
          </div>
        )}

        {/* === 邀请学伴打卡 === 任何参与者都能邀请 */}
        {hasParticipated && (
          <div className="mx-4 mt-3">
            <button
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-center space-x-2 text-blue-600 hover:bg-blue-50 transition-colors active:scale-[0.98]"
              onClick={() => openPicker('invite')}
            >
              <UserPlus size={16} />
              <span className="text-sm font-medium">邀请学伴一起打卡</span>
            </button>
          </div>
        )}

        {/* === 打卡记录 === */}
        <div className="mx-4 mt-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 text-sm">打卡记录</h3>
            <span className="text-[11px] text-gray-400">最近 {displayRecords.length} 条 / 共 {totalRecords} 条</span>
          </div>
          {displayRecords.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <ClipboardCheck size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">暂无打卡记录</p>
            </div>
          ) : (
            <div className="space-y-0">
              {displayRecords.map((r: any, i: number) => (
                <div key={r.id || i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                      onClick={() => r.user_id && navigate(`/user/${r.user_id}`)}>
                      {r.user_avatar
                        ? <img src={r.user_avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-blue-500">{(r.user_name || '?')[0]}</span>}
                    </div>
                    {i < displayRecords.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{r.user_name || '匿名'}</span>
                        <span className="text-[10px] text-gray-400 flex items-center">
                          <Clock size={10} className="mr-0.5" />{r.created_at?.slice(0, 16)?.replace('T', ' ')}
                        </span>
                      </div>
                      {r.content && <p className="text-xs text-gray-500">{r.content}</p>}

                      {/* 监督人点评 - 仅当事人可见 */}
                      {canSeeSupervisor && r.comment && (
                        <div className="mt-2 pt-2 border-t border-gray-50 flex items-start space-x-2">
                          <Shield size={12} className="text-amber-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-amber-600 font-medium">监督人点评</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
                          </div>
                        </div>
                      )}

                      {/* 监督人点评输入 */}
                      {isSupervisor && !r.comment && (
                        commentingRecordId === r.id ? (
                          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center space-x-2">
                            <input className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
                              placeholder="输入点评..." value={supervisorComment}
                              onChange={e => setSupervisorComment(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && submitSupervisorComment()} autoFocus />
                            <button className={`w-8 h-8 rounded-full flex items-center justify-center ${supervisorComment.trim() ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                              onClick={submitSupervisorComment} disabled={!supervisorComment.trim() || commentSending}>
                              {commentSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            </button>
                            <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center"
                              onClick={() => { setCommentingRecordId(null); setSupervisorComment(''); }}><X size={12} /></button>
                          </div>
                        ) : (
                          <button className="mt-2 pt-2 border-t border-gray-50 w-full flex items-center justify-center space-x-1 text-xs text-blue-500 py-1"
                            onClick={() => { setCommentingRecordId(r.id); setSupervisorComment(''); }}>
                            <MessageSquare size={12} /><span>点评</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-5 py-4 z-30">
        {todayDone ? (
          <button className="w-full py-3.5 bg-green-50 text-green-600 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 border border-green-100" disabled>
            <CheckCircle size={18} /><span>今日已打卡</span>
          </button>
        ) : (
          <button className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-base flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-60"
            onClick={handleCheckin} disabled={actionLoading}>
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            <span>{actionLoading ? '处理中...' : hasParticipated ? '今日打卡' : '加入并打卡'}</span>
          </button>
        )}
      </div>

      {/* 学伴选择弹窗 */}
      {pickerMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPickerMode(null)} />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-2xl max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-slate-800">
                {pickerMode === 'supervisor' ? '选择监督人' : '邀请学伴打卡'}
              </h3>
              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => setPickerMode(null)}>
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {partnersLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin text-blue-400" /></div>
              ) : partners.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={36} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm mb-3">暂无学伴</p>
                  <button className="text-blue-600 text-sm font-medium" onClick={() => navigate('/partner')}>去添加</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {partners.map((p: any) => {
                    const uid = getPartnerUserId(p);
                    const name = getPartnerName(p);
                    const avatar = getPartnerAvatar(p);
                    return (
                      <button key={p.id} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors active:scale-[0.98] disabled:opacity-50"
                        onClick={() => pickerMode === 'supervisor' ? inviteSupervisor(uid) : inviteJoin(uid)} disabled={inviting}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden shrink-0">
                          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-sm font-bold text-blue-500">{(name || '?')[0]}</span>}
                        </div>
                        <p className="flex-1 text-left text-sm font-medium text-slate-700 truncate">{name}</p>
                        {pickerMode === 'supervisor' ? <Shield size={16} className="text-gray-300" /> : <UserPlus size={16} className="text-gray-300" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
