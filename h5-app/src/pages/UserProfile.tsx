import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, BookOpen, Eye, Heart, Calendar } from 'lucide-react';
import { api, isLoggedIn, getUserInfo } from '../api/request';

export default function UserProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [partnerStatus, setPartnerStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const currentUser = useMemo(() => getUserInfo(), []);
  const isSelf = currentUser?.id && Number(id) === currentUser.id;

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, notesRes, statusRes] = await Promise.allSettled([
        api.get(`/user/profile/${id}`),
        api.get(`/user/user_notes/${id}`),
        api.post('/partner/batch_status', { userIds: [Number(id)] }),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value);
      }

      if (notesRes.status === 'fulfilled') {
        const data = notesRes.value as any;
        setNotes(Array.isArray(data) ? data : data?.list || []);
      }

      if (statusRes.status === 'fulfilled') {
        const data = statusRes.value as any;
        if (Array.isArray(data) && data.length > 0) {
          setPartnerStatus(data[0].status || 'none');
        } else if (data && typeof data === 'object') {
          const val = data[Number(id)] || data[String(id)];
          if (val) setPartnerStatus(typeof val === 'string' ? val : val.status || 'none');
        }
      }
    } catch {}
    setLoading(false);
  };

  const handleInvite = async () => {
    setInviting(true);
    try {
      await api.post('/partner/invite', { targetId: Number(id) });
      setPartnerStatus('pending');
    } catch {}
    setInviting(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">用户主页</span>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">用户主页</span>
        </div>
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">用户不存在</p>
        </div>
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
        <span className="ml-3 text-sm font-medium text-slate-700">用户主页</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Profile Card */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-indigo-500 to-blue-500" />
          <div className="px-5 pb-5 -mt-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-500">{(profile.nickname || profile.user_name || '?')[0]}</span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-800">{profile.nickname || profile.user_name || '未知用户'}</h2>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">{profile.bio || '这个人很懒，什么都没写~'}</p>
            {profile.created_at && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar size={13} />
                <span>加入于 {formatDate(profile.created_at)}</span>
              </div>
            )}

            {/* Action Button — hide for own profile */}
            {!isSelf && <div className="mt-4">
              {partnerStatus === 'accepted' ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 text-sm font-medium rounded-full">
                  已是学伴 ✓
                </span>
              ) : partnerStatus === 'pending' ? (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-full cursor-not-allowed"
                >
                  已发送邀请
                </button>
              ) : (
                <button
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-medium rounded-full hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? <Loader2 size={16} className="animate-spin inline mr-1" /> : null}
                  添加学伴
                </button>
              )}
            </div>}
          </div>
        </div>

        {/* Notes Section */}
        <div className="mx-4 mt-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <BookOpen size={15} className="text-indigo-500" />
            TA的笔记
          </h3>

          {notes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <BookOpen size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">暂无公开笔记</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note: any) => (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                  onClick={() => navigate(`/note/${note.id}`)}
                >
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{note.title || '无标题'}</h4>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye size={13} />
                      {note.view_cnt || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={13} />
                      {note.like_cnt || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
