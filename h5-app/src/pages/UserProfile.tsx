import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Loader2,
  Heart,
  Eye,
  MessageCircle,
  Users,
  Sparkles,
  Check,
  Lock,
} from 'lucide-react';
import { api, getUserInfo, isLoggedIn } from '../api/request';
import { resolveMediaUrl } from '../utils/media';
import MediaGrid from '../components/MediaGrid';
import TagPills from '../components/TagPills';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [partnerStatus, setPartnerStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const currentUser = useMemo(() => getUserInfo(), []);
  const isSelf = currentUser?.id && Number(id) === Number(currentUser.id);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      setPartnerStatus('none');
      const requests: Promise<any>[] = [
        api.get(`/user/profile/${id}`),
        api.get(`/user/user_notes/${id}`),
      ];
      if (!isSelf) {
        requests.push(api.post('/partner/batch_status', { userIds: [Number(id)] }));
      }
      const [profileRes, notesRes, statusRes] = await Promise.allSettled(requests);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);

      if (notesRes.status === 'fulfilled') {
        const data = notesRes.value as any;
        setNotes(Array.isArray(data) ? data : data?.list || []);
      }

      if (!isSelf && statusRes && statusRes.status === 'fulfilled') {
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

  const partnerBadge = useMemo(() => {
    if (partnerStatus === 'accepted') return { label: '已是学伴', className: 'bg-emerald-50 text-emerald-600', icon: Check };
    if (partnerStatus === 'pending') return { label: '已发送邀请', className: 'bg-slate-100 text-slate-500', icon: Sparkles };
    if (partnerStatus === 'occupied') return { label: 'TA 已有伙伴', className: 'bg-amber-50 text-amber-700', icon: Lock };
    return { label: '可邀请', className: 'bg-indigo-50 text-indigo-600', icon: Users };
  }, [partnerStatus]);

  const displayBadge = isSelf
    ? { label: '我的主页', className: 'bg-slate-100 text-slate-500', icon: Users }
    : partnerBadge;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="sticky top-0 z-20 flex items-center border-b border-slate-100 bg-white px-4 py-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
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
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="sticky top-0 z-20 flex items-center border-b border-slate-100 bg-white px-4 py-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">用户主页</span>
        </div>
        <div className="flex flex-1 items-center justify-center text-center">
          <p className="text-sm text-slate-400">用户不存在</p>
        </div>
      </div>
    );
  }

  const canEnterRoom = partnerStatus === 'accepted' && profile.active_partner_id === profile.id;
  const BadgeIcon = displayBadge.icon;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-8">
      <div className="sticky top-0 z-20 border-b border-white/40 bg-white/85 backdrop-blur-xl">
        <div className="flex items-center px-4 py-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">用户主页</span>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="overflow-hidden rounded-[1.9rem] border border-slate-100 bg-white shadow-sm">
          <div className="h-20 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                {profile.avatar ? (
                  <img src={resolveMediaUrl(profile.avatar)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-indigo-500">
                    {(profile.nickname || profile.user_name || '?')[0]}
                  </div>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium ${displayBadge.className}`}>
                <BadgeIcon size={12} />
                {displayBadge.label}
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold text-slate-900">{profile.nickname || profile.user_name || '未知用户'}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{profile.bio || '这个人很懒，什么都没写~'}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {profile.created_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} />
                  加入于 {formatDate(profile.created_at)}
                </span>
              )}
              {Array.isArray(profile.tags) && profile.tags.length > 0 && (
                <TagPills tags={profile.tags} compact />
              )}
            </div>

            {!isSelf && (
              <div className="mt-4 flex gap-2">
                {canEnterRoom ? (
                  <>
                    <button
                      type="button"
                      className="flex-1 rounded-full bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-600"
                      onClick={() => navigate(`/user/${profile.id}`)}
                    >
                      访问主页
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white"
                      onClick={() => navigate('/partner/room')}
                    >
                      进入伙伴空间
                    </button>
                  </>
                ) : partnerStatus === 'pending' ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-full bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-400"
                  >
                    已发送邀请
                  </button>
                ) : partnerStatus === 'occupied' ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-full bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700"
                  >
                    对方已有伙伴
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                    onClick={handleInvite}
                    disabled={inviting}
                  >
                    {inviting ? '邀请中...' : '添加学伴'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-[1.8rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-indigo-50 text-indigo-600">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">TA 的公开笔记</h3>
            <p className="text-xs text-slate-400">图文、标签和内容都统一展示</p>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-10 text-center">
            <BookOpen size={40} className="mx-auto text-slate-200" />
            <p className="mt-2 text-sm text-slate-400">暂无公开笔记</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {notes.map((note: any) => {
              const images = Array.isArray(note.images) ? note.images : [];
              return (
                <div
                  key={note.id}
                  className="overflow-hidden rounded-[1.55rem] border border-slate-100 bg-white shadow-sm transition-all active:scale-[0.99]"
                  onClick={() => navigate(`/note/${note.id}`)}
                >
                  {images.length > 0 && (
                    <div className="border-b border-slate-100">
                      <MediaGrid images={images.slice(0, 3)} cover={images.length === 1} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{note.title || '无标题'}</h4>
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                        {note.visibility === 'partner' ? '学伴可见' : note.visibility === 'private' ? '仅自己' : '公开'}
                      </span>
                    </div>
                    {note.content && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{note.content}</p>}
                    {Array.isArray(note.tags) && note.tags.length > 0 && (
                      <TagPills tags={note.tags.slice(0, 4)} compact className="mt-3" />
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Heart size={13} />
                        {note.like_cnt || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle size={13} />
                        {note.comment_cnt || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye size={13} />
                        {note.view_cnt || 0}
                      </span>
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
