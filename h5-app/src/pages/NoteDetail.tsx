import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Eye,
  FileX,
  Globe,
  Loader2,
  Lock,
  MessageCircle,
  Send,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import { api, getUserInfo, isLoggedIn } from '../api/request';
import { resolveMediaUrl } from '../utils/media';
import EngagementBar from '../components/EngagementBar';
import MediaGrid from '../components/MediaGrid';
import TagPills from '../components/TagPills';

function formatDateTime(value?: string) {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 19);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatCommentTime(value?: string) {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function visibilityMeta(visibility?: string) {
  if (visibility === 'private') return { icon: Lock, label: '仅自己', className: 'bg-slate-100 text-slate-500' };
  if (visibility === 'partner') return { icon: Users, label: '学伴可见', className: 'bg-blue-50 text-blue-600' };
  return { icon: Globe, label: '公开', className: 'bg-emerald-50 text-emerald-600' };
}

export default function NoteDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = getUserInfo();
  const commentsAnchorRef = useRef<HTMLDivElement | null>(null);
  const [note, setNote] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isSelf = useMemo(() => currentUser?.id && Number(id) === Number(currentUser.id), [currentUser?.id, id]);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!id) return;
    loadDetail();
    loadComments(1, true);
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/note/detail/${id}`);
      setNote(res || null);
      setLiked(!!res?.is_liked);
      setLikeCount(Number(res?.like_cnt || 0));
      setFavorited(!!res?.is_faved);
      setCommentCount(Number(res?.comment_cnt || 0));
    } catch {
      setNote(null);
    }
    setLoading(false);
  };

  const loadComments = async (page: number, reset = false) => {
    setLoadingComments(true);
    try {
      const res: any = await api.get('/comment/list', { noteId: id, page, size: 10 });
      const list = res?.list || [];
      setComments((prev) => (reset ? list : [...prev, ...list]));
      setHasMoreComments(list.length >= 10);
      setCommentPage(page);
      if (typeof res?.total === 'number') setCommentCount(res.total);
    } catch {
      if (reset) setComments([]);
      setHasMoreComments(false);
    }
    setLoadingComments(false);
  };

  const scrollToComments = () => {
    commentsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleLike = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res: any = await api.post('/like/toggle', { targetId: Number(id), targetType: 'note' });
      const nowLiked = !!res?.isLiked;
      setLiked(nowLiked);
      setLikeCount((prev) => Math.max(0, prev + (nowLiked ? 1 : -1)));
    } catch {}
    setToggling(false);
  };

  const toggleFavorite = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res: any = await api.post('/fav/toggle', {
        targetId: Number(id),
        targetType: 'note',
        title: note?.title || '',
      });
      setFavorited(!!res?.isFav);
    } catch {}
    setToggling(false);
  };

  const submitComment = async () => {
    if (!commentText.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/comment/create', { noteId: Number(id), content: commentText.trim() });
      setCommentText('');
      await loadDetail();
      await loadComments(1, true);
      commentsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
    setSending(false);
  };

  const handleDelete = async () => {
    if (!note || !isSelf) return;
    if (!confirm('确定删除这篇笔记？')) return;
    try {
      await api.del(`/note/delete/${note.id}`);
      navigate(-1);
    } catch {}
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/note/${note?.id || id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('链接已复制');
    } catch {
      window.prompt('复制链接', url);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <FileX size={48} className="mb-3 text-slate-200" />
        <p className="text-sm text-slate-400">笔记不存在或已删除</p>
        <button className="mt-4 text-sm font-medium text-indigo-600" onClick={() => navigate(-1)}>
          返回
        </button>
      </div>
    );
  }

  const vis = visibilityMeta(note.visibility);
  const VisIcon = vis.icon;
  const imageCount = Array.isArray(note.images) ? note.images.length : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-28">
      <div className="sticky top-0 z-30 border-b border-white/40 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[430px] items-center justify-between px-4 py-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-medium text-slate-700">笔记详情</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            onClick={handleShare}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-[1.9rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="h-12 w-12 shrink-0 overflow-hidden rounded-[1.2rem] bg-slate-100"
              onClick={() => navigate(`/user/${note.user_id}`)}
            >
              {note.user_pic ? (
                <img src={resolveMediaUrl(note.user_pic)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-indigo-500">
                  {(note.user_name || '?')[0]}
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{note.user_name || '匿名'}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(note.created_at)}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${vis.className}`}>
                  <VisIcon size={12} />
                  <span>{vis.label}</span>
                </span>
              </div>

              <div className="mt-4">
                <h1 className="text-[22px] font-bold leading-tight text-slate-900">{note.title}</h1>
                {Array.isArray(note.tags) && note.tags.length > 0 && (
                  <TagPills tags={note.tags} className="mt-3" />
                )}
              </div>
            </div>
          </div>

          {note.content && (
            <div className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
              {note.content}
            </div>
          )}

          {imageCount > 0 && (
            <div className="mt-5">
              <MediaGrid images={note.images} cover={imageCount === 1} />
            </div>
          )}

          <div className="mt-5 rounded-[1.4rem] bg-slate-50 px-4 py-3">
            <EngagementBar
              liked={liked}
              favorited={favorited}
              likeCount={likeCount}
              commentCount={commentCount}
              viewCount={Number(note.view_cnt || 0)}
              onLike={toggleLike}
              onFavorite={toggleFavorite}
              onComment={scrollToComments}
              showViewCount
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {isSelf ? (
              <>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600"
                  onClick={() => navigate(`/note/add?edit=1&id=${note.id}`)}
                >
                  <Edit3 size={13} />
                  编辑
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600"
                  onClick={handleDelete}
                >
                  <Trash2 size={13} />
                  删除
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                <Eye size={13} />
                {Number(note.view_cnt || 0)} 次浏览
              </span>
            )}
          </div>
        </div>
      </div>

      <div ref={commentsAnchorRef} className="px-4 pt-4">
        <div className="rounded-[1.9rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Comments</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">评论 {commentCount}</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
              onClick={scrollToComments}
            >
              <MessageCircle size={13} />
              跳转
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {loadingComments && comments.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={22} className="animate-spin text-indigo-400" />
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                暂无评论，先说点什么吧
              </div>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100"
                    onClick={() => navigate(`/user/${comment.user_id}`)}
                  >
                    {comment.user_pic ? (
                      <img src={resolveMediaUrl(comment.user_pic)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-indigo-500">
                        {(comment.user_name || '?')[0]}
                      </div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1 rounded-[1.2rem] bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">{comment.user_name || '匿名'}</span>
                      <span className="text-[10px] text-slate-400">{formatCommentTime(comment.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{comment.content}</p>
                  </div>
                </div>
              ))
            )}

            {hasMoreComments && comments.length > 0 && (
              <button
                type="button"
                className="w-full rounded-full bg-slate-50 py-2.5 text-xs font-medium text-slate-500"
                onClick={() => loadComments(commentPage + 1)}
              >
                {loadingComments ? '加载中...' : '加载更多评论'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-end gap-3">
          <textarea
            className="min-h-[48px] flex-1 resize-none rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300"
            placeholder="写下你的评论..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                submitComment();
              }
            }}
          />
          <button
            type="button"
            className="inline-flex h-[48px] min-w-[48px] items-center justify-center rounded-[1.2rem] bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200 disabled:opacity-60"
            onClick={submitComment}
            disabled={!commentText.trim() || sending}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
