import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle, UserPlus, Clock, Loader2, ClipboardCheck,
  Shield, MessageSquare, Send, X, ArrowRightLeft,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

const MAX_RECORDS = 20;

export default function CheckinDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [joined, setJoined] = useState(false);
  const [todayDone, setTodayDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Picker modal state: 'supervisor' | 'invite' | null
  const [pickerMode, setPickerMode] = useState<'supervisor' | 'invite' | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Supervisor comment state
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
      if (detailR.status === 'fulfilled') {
        const t: any = detailR.value;
        setTask(t);
        setJoined(!!t.is_joined);
        setTodayDone(!!t.is_joined);
      }
      if (recordsR.status === 'fulfilled') {
        const val: any = recordsR.value;
        setRecords(Array.isArray(val) ? val : val?.list || []);
        setTotalRecords(val?.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await api.post('/checkin/join', { checkinId: Number(id) });
      setJoined(true);
      setTodayDone(true);
      loadData();
    } catch {}
    setActionLoading(false);
  };

  const handleCheckin = async () => {
    setActionLoading(true);
    try {
      await api.post('/checkin/join', { checkinId: Number(id) });
      setTodayDone(true);
      loadData();
    } catch {}
    setActionLoading(false);
  };

  const openPicker = async (mode: 'supervisor' | 'invite') => {
    setPickerMode(mode);
    setPartnersLoading(true);
    try {
      const res: any = await api.get('/partner/my_list');
      setPartners(Array.isArray(res) ? res : res?.list || []);
    } catch {
      setPartners([]);
    }
    setPartnersLoading(false);
  };

  const getPartnerUserId = (p: any): number => {
    // my_list returns both sides; pick the one that isn't me
    if (p.user_id === currentUser.id) return p.target_id;
    if (p.target_id === currentUser.id) return p.user_id;
    return p.user_id || p.id;
  };

  const getPartnerName = (p: any): string => {
    if (p.user_id === currentUser.id) return p.target_name || p.nickname || '学伴';
    if (p.target_id === currentUser.id) return p.user_name || p.nickname || '学伴';
    return p.nickname || p.user_name || p.target_name || '学伴';
  };

  const getPartnerAvatar = (p: any): string => {
    if (p.user_id === currentUser.id) return p.target_pic || '';
    if (p.target_id === currentUser.id) return p.user_pic || '';
    return p.avatar || p.user_pic || p.target_pic || '';
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

  const isCreator = task && currentUser?.id && task.creator_id === currentUser.id;
  const isSupervisor = task && currentUser?.id && task.supervisor_id === currentUser.id;
  // Only creator and supervisor can see the supervision relationship
  const canSeeSupervisor = isCreator || isSupervisor;

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

  const creatorAvatar = task.creator_avatar;
  const supervisorAvatar = task.supervisor_avatar;
  const displayRecords = records.slice(0, MAX_RECORDS);

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
            <span>我的打卡 {task.my_total || 0} 次</span>
          </div>
        </div>

        {/* Supervisor Relationship - ONLY visible to creator and supervisor */}
        {canSeeSupervisor && (
          <div className="mx-4 mt-3">
            {task.supervisor_id ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-center space-x-4">
                  {/* Creator side */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border-[3px] border-blue-200 cursor-pointer"
                      onClick={() => task.creator_id && navigate(`/user/${task.creator_id}`)}
                    >
                      {creatorAvatar ? (
                        <img src={creatorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-blue-500">{(task.creator_name || '?')[0]}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-1.5 truncate max-w-[80px] text-center">{task.creator_name || '创建者'}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full mt-0.5">被监督</span>
                  </div>

                  {/* Relationship indicator */}
                  <div className="flex flex-col items-center px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center border border-amber-200">
                      <Shield size={18} className="text-amber-500" />
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <ArrowRightLeft size={12} className="text-gray-300" />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5">监督关系</span>
                  </div>

                  {/* Supervisor side */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden border-[3px] border-amber-200 cursor-pointer"
                      onClick={() => task.supervisor_id && navigate(`/user/${task.supervisor_id}`)}
                    >
                      {supervisorAvatar ? (
                        <img src={supervisorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-amber-500">{(task.supervisor_display_name || task.supervisor_name || '?')[0]}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-1.5 truncate max-w-[80px] text-center">{task.supervisor_display_name || task.supervisor_name || '监督人'}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full mt-0.5">监督人</span>
                  </div>
                </div>
              </div>
            ) : isCreator ? (
              <button
                className="w-full bg-white rounded-2xl shadow-sm border border-dashed border-indigo-200 px-4 py-4 flex items-center justify-center space-x-2 text-indigo-600 hover:bg-indigo-50 transition-colors active:scale-[0.98]"
                onClick={() => openPicker('supervisor')}
              >
                <Shield size={16} />
                <span className="text-sm font-medium">邀请学伴来监督</span>
              </button>
            ) : null}
          </div>
        )}

        {/* Invite Friends - via partner picker */}
        {joined && (
          <div className="mx-4 mt-3">
            <button
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-center space-x-2 text-indigo-600 hover:bg-indigo-50 transition-colors active:scale-[0.98]"
              onClick={() => openPicker('invite')}
            >
              <UserPlus size={16} />
              <span className="text-sm font-medium">邀请学伴一起打卡</span>
            </button>
          </div>
        )}

        {/* Records Timeline */}
        <div className="mx-4 mt-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 text-sm">打卡记录</h3>
            <span className="text-[11px] text-gray-400">
              最近 {displayRecords.length} 条 / 共 {totalRecords} 条
            </span>
          </div>
          {displayRecords.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <ClipboardCheck size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">暂无打卡记录，快来第一个打卡吧</p>
            </div>
          ) : (
            <div className="space-y-0">
              {displayRecords.map((r: any, i: number) => (
                <div key={r.id || i} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                      onClick={() => r.user_id && navigate(`/user/${r.user_id}`)}
                    >
                      {r.user_avatar ? (
                        <img src={r.user_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-500">{(r.user_name || '?')[0]}</span>
                      )}
                    </div>
                    {i < displayRecords.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600"
                          onClick={() => r.user_id && navigate(`/user/${r.user_id}`)}
                        >{r.user_name || '匿名'}</span>
                        <span className="text-[10px] text-gray-400 flex items-center">
                          <Clock size={10} className="mr-0.5" />
                          {r.created_at?.slice(0, 16)?.replace('T', ' ')}
                        </span>
                      </div>
                      {r.content && <p className="text-xs text-gray-500">{r.content}</p>}

                      {/* Supervisor comment display - only for creator & supervisor */}
                      {canSeeSupervisor && r.comment && (
                        <div className="mt-2 pt-2 border-t border-gray-50 flex items-start space-x-2">
                          <Shield size={12} className="text-amber-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-amber-600 font-medium">监督人点评</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
                          </div>
                        </div>
                      )}

                      {/* Supervisor comment button - only supervisor can comment */}
                      {isSupervisor && !r.comment && (
                        <>
                          {commentingRecordId === r.id ? (
                            <div className="mt-2 pt-2 border-t border-gray-50">
                              <div className="flex items-center space-x-2">
                                <input
                                  className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder-gray-400"
                                  placeholder="输入点评内容..."
                                  value={supervisorComment}
                                  onChange={e => setSupervisorComment(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && submitSupervisorComment()}
                                  autoFocus
                                />
                                <button
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                    supervisorComment.trim() ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                                  }`}
                                  onClick={submitSupervisorComment}
                                  disabled={!supervisorComment.trim() || commentSending}
                                >
                                  {commentSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                </button>
                                <button
                                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                                  onClick={() => { setCommentingRecordId(null); setSupervisorComment(''); }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="mt-2 pt-2 border-t border-gray-50 w-full flex items-center justify-center space-x-1 text-xs text-indigo-500 hover:text-indigo-600 transition-colors py-1"
                              onClick={() => { setCommentingRecordId(r.id); setSupervisorComment(''); }}
                            >
                              <MessageSquare size={12} />
                              <span>点评</span>
                            </button>
                          )}
                        </>
                      )}
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
        {todayDone ? (
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
            onClick={joined ? handleCheckin : handleJoin}
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : joined ? <CheckCircle size={18} /> : <UserPlus size={18} />}
            <span>{actionLoading ? '处理中...' : joined ? '立即打卡' : '加入并打卡'}</span>
          </button>
        )}
      </div>

      {/* Partner Picker Modal (for supervisor or invite) */}
      {pickerMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPickerMode(null)} />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-2xl max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-slate-800">
                {pickerMode === 'supervisor' ? '选择监督人' : '邀请学伴打卡'}
              </h3>
              <button
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                onClick={() => setPickerMode(null)}
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {partnersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                </div>
              ) : partners.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={36} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm mb-3">暂无学伴，先去添加学伴吧</p>
                  <button className="text-indigo-600 text-sm font-medium" onClick={() => navigate('/partner')}>去添加</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {partners.map((p: any) => {
                    const pUserId = getPartnerUserId(p);
                    const pName = getPartnerName(p);
                    const pAvatar = getPartnerAvatar(p);
                    return (
                      <button
                        key={p.id}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-indigo-50 transition-colors active:scale-[0.98] disabled:opacity-50"
                        onClick={() => pickerMode === 'supervisor' ? inviteSupervisor(pUserId) : inviteJoin(pUserId)}
                        disabled={inviting}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                          {pAvatar ? (
                            <img src={pAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-indigo-500">{(pName || '?')[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{pName}</p>
                        </div>
                        {pickerMode === 'supervisor' ? (
                          <Shield size={16} className="text-gray-300" />
                        ) : (
                          <UserPlus size={16} className="text-gray-300" />
                        )}
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
