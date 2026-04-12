import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, MessageCircle, Plus, Flame, Clock } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function Community() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [notes, setNotes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
  }, []);

  const loadNotes = useCallback(async (p: number, s: string, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res: any = await api.get('/note/public_list', { page: p, size: 10, sort: s });
      const list = res?.list || [];
      setNotes(prev => reset ? list : [...prev, ...list]);
      setHasMore(list.length >= 10);
    } catch {}
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    setPage(1);
    setNotes([]);
    loadNotes(1, sort, true);
  }, [sort]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    loadNotes(next, sort, false);
  };

  const cardColors = [
    'border-l-blue-400',
    'border-l-purple-400',
    'border-l-green-400',
    'border-l-orange-400',
    'border-l-rose-400',
    'border-l-cyan-400',
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-gray-100">
        <div className="px-6 pt-12 pb-3">
          <h1 className="text-xl font-bold text-slate-800">社区</h1>
        </div>
        <div className="px-6 pb-3 flex space-x-1 bg-gray-100 mx-6 rounded-xl p-1 mb-3">
          <button
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              sort === 'hot' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => setSort('hot')}
          >
            <Flame size={15} />
            <span>热门</span>
          </button>
          <button
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              sort === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => setSort('new')}
          >
            <Clock size={15} />
            <span>最新</span>
          </button>
        </div>
      </div>

      {/* Note List */}
      <div className="px-4 pt-4 space-y-3">
        {notes.map((n: any, i: number) => (
          <div
            key={n.id}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 ${cardColors[i % cardColors.length]} active:scale-[0.98] transition-transform`}
            onClick={() => navigate(`/note/${n.id}`)}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                {n.user_avatar ? (
                  <img src={n.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-indigo-500">👤</span>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600">{n.user_name || '匿名'}</span>
              <span className="text-[10px] text-gray-300 ml-auto">{n.created_at?.slice(0, 10)}</span>
            </div>
            <h3 className="font-semibold text-slate-800 text-[15px] mb-1 line-clamp-1">{n.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{n.content}</p>
            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <Eye size={13} />
                <span>{n.view_cnt || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Heart size={13} />
                <span>{n.like_cnt || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle size={13} />
                <span>{n.comment_cnt || 0}</span>
              </span>
            </div>
          </div>
        ))}

        {notes.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400 text-sm">暂无笔记，快来发布第一篇吧</div>
        )}

        {hasMore && notes.length > 0 && (
          <button
            className="w-full py-3 text-sm text-gray-400 hover:text-indigo-500 transition"
            onClick={loadMore}
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        )}

        {!hasMore && notes.length > 0 && (
          <div className="text-center py-4 text-xs text-gray-300">-- 没有更多了 --</div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
        onClick={() => navigate('/note/add')}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
