import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Heart, Bookmark, MessageCircle, Send, Eye, Share2, Globe,
  Lock, Users, Loader2, FileX,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function NoteDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [note, setNote] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadDetail();
    loadComments(1, true);
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/note/detail/${id}`);
      setNote(res);
      setLiked(!!res?.liked);
      setLikeCount(res?.like_cnt || 0);
      setFavorited(!!res?.favorited);
    } catch {}
    setLoading(false);
  };

  const loadComments = async (page: number, reset = false) => {
    try {
      const res: any = await api.get('/comment/list', { noteId: id, page, size: 20 });
      const list = res?.list || [];
      setComments(prev => reset ? list : [...prev, ...list]);
      setHasMoreComments(list.length >= 20);
      setCommentPage(page);
    } catch {}
  };

  const toggleLike = async () => {
    try {
      await api.post('/like/toggle', { targetId: Number(id), targetType: 'note' });
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch {}
  };

  const toggleFav = async () => {
    try {
      await api.post('/favorite/toggle', { targetId: Number(id), targetType: 'note' });
      setFavorited(!favorited);
    } catch {}
  };

  const submitComment = async () => {
    if (!commentText.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/comment/create', { noteId: Number(id), content: commentText.trim() });
      setCommentText('');
      loadComments(1, true);
      if (note) setNote({ ...note, comment_cnt: (note.comment_cnt || 0) + 1 });
    } catch {}
    setSending(false);
  };

  const visibilityInfo: Record<string, { icon: any; label: string; color: string }> = {
    public: { icon: Globe, label: '公开', color: 'bg-green-50 text-green-600' },
    private: { icon: Lock, label: '仅自己', color: 'bg-gray-100 text-gray-500' },
    partner: { icon: Users, label: '学伴可见', color: 'bg-blue-50 text-blue-600' },
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <FileX size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm mb-4">笔记不存在或已删除</p>
        <button className="text-indigo-600 text-sm font-medium" onClick={() => navigate(-1)}>返回</button>
      </div>
    );
  }

  const vis = visibilityInfo[note.visibility] || visibilityInfo.public;
  const VisIcon = vis.icon;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="text-sm font-medium text-slate-700">笔记详情</span>
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <Share2 size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="bg-white px-5 pt-5 pb-4">
          {/* Author */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden">
              {note.user_avatar ? (
                <img src={note.user_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-indigo-500">{(note.user_name || '?')[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{note.user_name || '匿名'}</p>
              <p className="text-[11px] text-gray-400">{note.created_at?.slice(0, 16)?.replace('T', ' ')}</p>
            </div>
            <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${vis.color}`}>
              <VisIcon size={12} />
              <span>{vis.label}</span>
            </span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{note.title}</h1>
          <div className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</div>

          {/* Stats */}
          <div className="flex items-center space-x-5 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <span className="flex items-center space-x-1"><Eye size={14} /><span>{note.view_cnt || 0} 浏览</span></span>
            <span className="flex items-center space-x-1"><Heart size={14} /><span>{likeCount} 赞</span></span>
            <span className="flex items-center space-x-1"><MessageCircle size={14} /><span>{note.comment_cnt || 0} 评论</span></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around bg-white mt-2 py-3 border-y border-gray-100">
          <button
            className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
              liked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
            onClick={toggleLike}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span>{liked ? '已赞' : '点赞'}</span>
          </button>
          <button
            className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
              favorited ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
            onClick={toggleFav}
          >
            <Bookmark size={16} fill={favorited ? 'currentColor' : 'none'} />
            <span>{favorited ? '已收藏' : '收藏'}</span>
          </button>
        </div>

        {/* Comments */}
        <div className="px-5 pt-4 pb-4">
          <h3 className="font-semibold text-slate-800 mb-4">评论 ({note.comment_cnt || 0})</h3>
          {comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">暂无评论，快来抢沙发~</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((c: any) => (
                <div key={c.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                    {c.user_avatar ? (
                      <img src={c.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-500">{(c.user_name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{c.user_name || '匿名'}</span>
                      <span className="text-[10px] text-gray-400">{c.created_at?.slice(0, 16)?.replace('T', ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              {hasMoreComments && (
                <button
                  className="w-full py-2 text-xs text-gray-400 hover:text-indigo-500 transition-colors"
                  onClick={() => loadComments(commentPage + 1)}
                >
                  加载更多评论
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Comment Input */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 flex items-center space-x-3 z-30">
        <input
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder-gray-400"
          placeholder="写评论..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitComment()}
        />
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            commentText.trim() ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
          }`}
          onClick={submitComment}
          disabled={!commentText.trim() || sending}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
