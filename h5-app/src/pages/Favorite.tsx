import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Bookmark, Heart, Eye, MessageCircle } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function Favorite() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/fav/my_list');
      setItems(Array.isArray(res) ? res : res?.list || []);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">我的收藏 ({items.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">暂无收藏</p>
            <p className="text-gray-300 text-xs mt-1">收藏的笔记将在这里显示</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => {
              const title = item.note_title || item.title || '未命名笔记';
              const content = item.note_content || '';
              const author = item.author_name || '';
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all"
                  onClick={() => navigate(`/note/${item.target_id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-800 truncate flex-1 mr-2">{title}</h3>
                    <Bookmark size={14} className="text-yellow-500 shrink-0" fill="currentColor" />
                  </div>
                  {content && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">{content}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-3">
                      {author && <span className="text-indigo-500 font-medium">{author}</span>}
                      <span className="flex items-center gap-0.5"><Heart size={11} /> {item.like_cnt || 0}</span>
                      <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {item.comment_cnt || 0}</span>
                      <span className="flex items-center gap-0.5"><Eye size={11} /> {item.view_cnt || 0}</span>
                    </div>
                    <span>{item.created_at?.slice(0, 10)}</span>
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
