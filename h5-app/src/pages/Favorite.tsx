import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';
import MediaGrid from '../components/MediaGrid';
import TagPills from '../components/TagPills';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-6">
      <div className="sticky top-0 z-20 flex items-center border-b border-white/40 bg-white/85 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">我的收藏 ({items.length})</span>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <Bookmark size={48} className="mx-auto text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">暂无收藏</p>
            <p className="mt-1 text-xs text-slate-300">收藏的笔记会在这里统一展示</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => {
              const images = Array.isArray(item.images) ? item.images : [];
              const noteId = item.target_id || item.id;
              const title = item.note_title || item.title || '未命名笔记';
              const content = item.note_content || '';
              const author = item.author_name || '';
              return (
                <div
                  key={item.favorite_id || item.id || noteId}
                  className="overflow-hidden rounded-[1.7rem] border border-slate-100 bg-white shadow-sm"
                  onClick={() => navigate(`/note/${noteId}`)}
                >
                  {images.length > 0 && (
                    <div className="border-b border-slate-100">
                      <MediaGrid images={images.slice(0, 3)} cover={images.length === 1} />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="flex-1 text-sm font-semibold text-slate-900 line-clamp-2">{title}</h3>
                      <Bookmark size={14} className="shrink-0 text-amber-500" fill="currentColor" />
                    </div>

                    {content && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{content}</p>}

                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <TagPills tags={item.tags.slice(0, 4)} compact className="mt-3" />
                    )}

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        {author && <span className="text-indigo-500 font-medium">{author}</span>}
                        <span className="inline-flex items-center gap-1"><Heart size={11} /> {item.like_cnt || 0}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle size={11} /> {item.comment_cnt || 0}</span>
                        <span className="inline-flex items-center gap-1"><Eye size={11} /> {item.view_cnt || 0}</span>
                      </div>
                      <span>{String(item.favorite_created_at || item.created_at || '').slice(0, 10)}</span>
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
