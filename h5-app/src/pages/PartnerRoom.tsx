import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Send,
  Users,
  Sparkles,
  CalendarDays,
  Clock3,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';
import { resolveMediaUrl } from '../utils/media';
import MediaGrid from '../components/MediaGrid';
import TagPills from '../components/TagPills';
import ImagePicker from '../components/ImagePicker';
import EngagementBar from '../components/EngagementBar';

function formatDateLabel(dateStr?: string) {
  if (!dateStr) return '未知日期';
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay) return '今天';
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatTimeLabel(dateStr?: string) {
  if (!dateStr) return '--:--';
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getItemDate(item: any) {
  return item.day || (item.created_at || '').slice(0, 10) || '';
}

export default function PartnerRoom() {
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [summary, setSummary] = useState({ recordTotal: 0, postTotal: 0, likeTotal: 0, commentTotal: 0 });
  const [feed, setFeed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [posting, setPosting] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadRoom(1, true);
  }, []);

  const loadRoom = async (nextPage = 1, reset = false) => {
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const res: any = await api.get('/partner/room', { page: nextPage, size: 12 });
      const list = res?.list || [];
      setRoom({
        relation: res?.relation || null,
        partner: res?.partner || null,
        roomKey: res?.roomKey || '',
        total: res?.total || 0,
      });
      setSummary({
        recordTotal: Number(res?.summary?.recordTotal || 0),
        postTotal: Number(res?.summary?.postTotal || 0),
        likeTotal: Number(res?.summary?.likeTotal || 0),
        commentTotal: Number(res?.summary?.commentTotal || 0),
      });
      setFeed((prev) => (reset ? list : [...prev, ...list]));
      setPage(nextPage);
      setHasMore(list.length >= 12);
    } catch {
      if (reset) {
        setRoom(null);
        setFeed([]);
      }
    }
    reset ? setLoading(false) : setLoadingMore(false);
  };

  const reloadRoom = async () => {
    await loadRoom(1, true);
  };

  const groupedFeed = useMemo(() => {
    const groups: Array<{ dateKey: string; items: any[] }> = [];
    feed.forEach((item) => {
      const dateKey = getItemDate(item);
      if (!groups.length || groups[groups.length - 1].dateKey !== dateKey) {
        groups.push({ dateKey, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    });
    return groups;
  }, [feed]);

  const openComments = async (item: any) => {
    setActiveItem(item);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res: any = await api.get('/partner/room/comments', {
        itemType: item.item_type,
        itemId: item.source_id,
      });
      setComments(Array.isArray(res) ? res : res || []);
    } catch {
      setComments([]);
    }
    setCommentsLoading(false);
  };

  const submitPost = async () => {
    if (posting) return;
    if (!composerContent.trim() && composerImages.length === 0) return;
    setPosting(true);
    try {
      await api.post('/partner/room/post', {
        content: composerContent.trim(),
        images: composerImages,
      });
      setComposerContent('');
      setComposerImages([]);
      setShowComposer(false);
      await reloadRoom();
    } catch {}
    setPosting(false);
  };

  const toggleLike = async (item: any) => {
    try {
      await api.post('/partner/room/like', { itemType: item.item_type, itemId: item.source_id });
      await reloadRoom();
      if (activeItem && activeItem.item_type === item.item_type && activeItem.source_id === item.source_id) {
        await openComments(item);
      }
    } catch {}
  };

  const submitComment = async () => {
    if (!activeItem || commentSending || !commentText.trim()) return;
    setCommentSending(true);
    try {
      await api.post('/partner/room/comment', {
        itemType: activeItem.item_type,
        itemId: activeItem.source_id,
        content: commentText.trim(),
      });
      setCommentText('');
      await reloadRoom();
      await openComments(activeItem);
    } catch {}
    setCommentSending(false);
  };

  const partner = room?.partner;
  const total = room?.total || 0;
  const postCount = summary.postTotal || feed.filter((item) => item.item_type === 'post').length;
  const recordCount = summary.recordTotal || feed.filter((item) => item.item_type === 'record').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={34} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="sticky top-0 z-20 flex items-center border-b border-slate-100 bg-white px-4 py-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">伙伴空间</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-100">
            <Users size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">还没有伙伴空间</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            先去建立一对一伙伴关系，之后这里会沉淀你们两个人的打卡记录、图片动态和互动记录。
          </p>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
            onClick={() => navigate('/partner')}
          >
            去找伙伴
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-28">
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-[2.25rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 px-5 pb-6 pt-12 text-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-4 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Partner Room</p>
            <h1 className="mt-1 text-lg font-semibold">伙伴空间</h1>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
            onClick={() => setShowComposer(true)}
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="relative z-10 mt-6 rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-[1.4rem] border border-white/20 bg-white/10">
              {partner.avatar ? (
                <img src={resolveMediaUrl(partner.avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {(partner.nickname || '?')[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-bold">{partner.nickname || '伙伴'}</h2>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                  一对一
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-white/72">{partner.bio || 'TA 还没有写个人签名'}</p>
              <TagPills tags={partner.tags || []} className="mt-2" compact />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: '记录', value: total },
              { label: '打卡', value: recordCount },
              { label: '动态', value: postCount },
              { label: '笔记', value: partner.note_cnt || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.2rem] bg-white/10 px-3 py-2 text-center">
                <div className="text-lg font-bold">{item.value}</div>
                <div className="text-[10px] text-white/55">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="-mt-5 px-4">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">空间概览</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">你们两个人的时间线</h3>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600"
              onClick={() => navigate('/partner')}
            >
              管理伙伴
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: '总记录', value: total, color: 'text-indigo-600 bg-indigo-50' },
              { label: '双方打卡', value: recordCount, color: 'text-emerald-600 bg-emerald-50' },
              { label: '互动', value: (summary.likeTotal || 0) + (summary.commentTotal || 0), color: 'text-amber-700 bg-amber-50' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.2rem] border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full ${item.color}`}>
                  <Sparkles size={15} />
                </div>
                <div className="text-lg font-bold text-slate-900">{item.value}</div>
                <div className="text-[11px] text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {groupedFeed.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/80 p-8 text-center shadow-sm">
            <Clock3 size={42} className="mx-auto text-slate-200" />
            <h3 className="mt-3 text-sm font-semibold text-slate-800">还没有伙伴记录</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              你们的打卡记录、图片动态和评论都会出现在这里。
            </p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              onClick={() => setShowComposer(true)}
            >
              <Plus size={16} />
              发第一条动态
            </button>
          </div>
        ) : (
          groupedFeed.map((group) => (
            <div key={group.dateKey} className="mb-5">
              <div className="mb-3 flex items-center gap-2 px-1">
                <CalendarDays size={14} className="text-indigo-500" />
                <span className="text-sm font-semibold text-slate-800">{formatDateLabel(group.dateKey)}</span>
                <span className="text-[11px] text-slate-400">{group.dateKey}</span>
              </div>

              <div className="space-y-4">
                {group.items.map((item: any) => {
                  const isRecord = item.item_type === 'record';
                  const iconBg = item.user_id === room.relation.user_id ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600';
                  const timeLabel = formatTimeLabel(item.created_at);
                  return (
                    <div key={`${item.item_key}-${item.created_at}`} className="relative pl-12">
                      <div className="absolute left-[15px] top-0 h-full w-px bg-slate-200" />
                      <div className="absolute left-[7px] top-5 h-4 w-4 rounded-full border-4 border-white bg-indigo-400 shadow-sm" />
                      <div className="absolute left-0 top-4 w-10 pr-2 text-right text-[10px] font-medium text-slate-400">
                        {timeLabel}
                      </div>

                      <div className="overflow-hidden rounded-[1.6rem] border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] ${iconBg}`}>
                            {item.user_avatar ? (
                              <img src={resolveMediaUrl(item.user_avatar)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold">{(item.user_name || '?')[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900">{item.user_name || '匿名'}</h4>
                                <p className="text-[11px] text-slate-400">
                                  {isRecord ? item.checkin_title || '打卡记录' : '伙伴动态'}
                                </p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                                isRecord ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {isRecord ? '打卡' : '分享'}
                              </span>
                            </div>

                            {item.content && (
                              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
                                {item.content}
                              </p>
                            )}

                            {item.supervisor_comment && (
                              <div className="mt-3 rounded-[1.2rem] border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                <span className="mr-2 font-semibold">点评</span>
                                {item.supervisor_comment}
                              </div>
                            )}

                            {Array.isArray(item.images) && item.images.length > 0 && (
                              <div className="mt-3">
                                <MediaGrid images={item.images} cover={item.images.length === 1} />
                              </div>
                            )}

                            <div className="mt-4">
                              <EngagementBar
                                liked={!!item.is_liked}
                                likeCount={Number(item.like_cnt || 0)}
                                commentCount={Number(item.comment_cnt || 0)}
                                onLike={() => toggleLike(item)}
                                onComment={() => openComments(item)}
                                compact
                                showViewCount={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {hasMore && feed.length > 0 && (
          <button
            className="mx-auto mt-2 flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-500 shadow-sm"
            onClick={() => loadRoom(page + 1, false)}
            disabled={loadingMore}
          >
            {loadingMore ? <Loader2 size={15} className="animate-spin" /> : <Clock3 size={15} />}
            <span>{loadingMore ? '加载中...' : '加载更多'}</span>
          </button>
        )}
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setShowComposer(false)} />
          <div className="relative w-full max-w-[430px] rounded-t-[2rem] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-4 shadow-[0_-12px_36px_rgba(15,23,42,0.14)]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">伙伴空间发布</p>
                <h3 className="text-base font-semibold text-slate-900">发一条文字或图片动态</h3>
              </div>
              <button
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500"
                onClick={() => setShowComposer(false)}
              >
                关闭
              </button>
            </div>

            <textarea
              className="mt-4 min-h-32 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300"
              placeholder="今天有什么学习状态、想法或者图片，发给你的伙伴看看"
              value={composerContent}
              onChange={(e) => setComposerContent(e.target.value)}
            />

            <div className="mt-4">
              <ImagePicker images={composerImages} onChange={setComposerImages} maxCount={6} hint="支持最多 6 张图片，像朋友圈一样记录" />
            </div>

            <button
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 disabled:opacity-60"
              onClick={submitPost}
              disabled={posting || (!composerContent.trim() && composerImages.length === 0)}
            >
              {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>{posting ? '发布中...' : '发布动态'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => { setActiveItem(null); setCommentText(''); }} />
          <div className="relative w-full max-w-[430px] rounded-t-[2rem] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] pt-4 shadow-[0_-12px_36px_rgba(15,23,42,0.14)]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">互动详情</p>
                <h3 className="text-base font-semibold text-slate-900">
                  {activeItem.item_type === 'record' ? '打卡记录' : '伙伴动态'}
                </h3>
              </div>
              <button
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500"
                onClick={() => { setActiveItem(null); setCommentText(''); }}
              >
                关闭
              </button>
            </div>

            <div className="mt-4 max-h-[48vh] overflow-y-auto">
              <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-3">
                {activeItem.content && <p className="text-sm leading-relaxed text-slate-700">{activeItem.content}</p>}
                {Array.isArray(activeItem.images) && activeItem.images.length > 0 && (
                  <div className="mt-3">
                    <MediaGrid images={activeItem.images} cover={activeItem.images.length === 1} />
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={22} className="animate-spin text-indigo-400" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    暂无评论，先说点什么吧
                  </div>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {comment.user_avatar ? (
                          <img src={resolveMediaUrl(comment.user_avatar)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-indigo-500">
                            {(comment.user_name || '?')[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 rounded-[1.2rem] bg-slate-50 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">{comment.user_name || '匿名'}</span>
                          <span className="text-[10px] text-slate-400">{formatTimeLabel(comment.created_at)}</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的想法..."
                className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-300"
              />
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200 disabled:opacity-60"
                onClick={submitComment}
                disabled={commentSending || !commentText.trim()}
              >
                {commentSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
