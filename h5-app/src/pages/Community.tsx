import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, MessageCircle, Plus, Flame, Clock, Loader2, FileText } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function Community() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [notes, setNotes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
  }, []);

  const loadingRef = React.useRef(false);
  const loadNotes = async (p: number, s: string, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res: any = await api.get('/note/public_list', { page: p, size: 10, sort: s });
      const list = res?.list || [];
      setNotes(prev => reset ? list : [...prev, ...list]);
      setHasMore(list.length >= 10);
    } catch {}
    loadingRef.current = false;
    setLoading(false);
    setInitialLoad(false);
  };

  useEffect(() => {
    setPage(1);
    setNotes([]);
    setInitialLoad(true);
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
    'border-l-emerald-400',
    'border-l-amber-400',
    'border-l-rose-400',
    'border-l-cyan-400',
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50">
      {/* Sticky Header + Tabs */}
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-5 pt-12 pb-3">
          <h1 className="text-xl font-bold text-slate-800">社区</h1>
        </div>
        <div className="px-5 pb-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                sort === 'hot' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setSort('hot')}
            >
              <Flame size={15} />
              <span>热门</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                sort === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setSort('new')}
            >
              <Clock size={15} />
              <span>最新</span>
            </button>
          </div>
        </div>
      </div>

      {/* Note List */}
      <div className="px-4 pt-4 space-y-3">
        {initialLoad ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">暂无笔记，快来发布第一篇吧</p>
          </div>
        ) : (
          <>
            {notes.map((n: any, i: number) => (
              <div
                key={`${n.id}-${i}`}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 ${cardColors[i % cardColors.length]} hover:shadow-md active:scale-[0.98] transition-all`}
                onClick={() => navigate(`/note/${n.id}`)}
              >
                {/* Author row */}
                <div className="flex items-center space-x-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                    {n.user_avatar ? (
                      <img src={n.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-indigo-500">{(n.user_name || '?')[0]}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{n.user_name || '匿名'}</span>
                  <span className="text-[10px] text-gray-300 ml-auto">{n.created_at?.slice(0, 10)}</span>
                </div>

                {/* Title + Content */}
                <h3 className="font-semibold text-slate-800 text-[15px] mb-1.5 line-clamp-2">{n.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{n.content}</p>

                {/* Stats */}
                <div className="flex items-center space-x-4 mt-3 pt-2.5 border-t border-gray-50 text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Heart size={13} />
                    <span>{n.like_cnt || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Eye size={13} />
                    <span>{n.view_cnt || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageCircle size={13} />
                    <span>{n.comment_cnt || 0}</span>
                  </span>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                className="w-full py-3 text-sm text-gray-400 hover:text-indigo-500 transition-colors"
                onClick={loadMore}
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>加载中...</span>
                  </span>
                ) : '加载更多'}
              </button>
            )}

            {!hasMore && notes.length > 0 && (
              <div className="text-center py-4 text-xs text-gray-300">-- 没有更多了 --</div>
            )}
          </>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all z-30"
        onClick={() => navigate('/note/add')}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
