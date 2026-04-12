import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Bookmark, FileText, Heart } from 'lucide-react';
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
      const res: any = await api.get('/fav/my_list', { page: 1, size: 50 });
      setItems(res?.list || (Array.isArray(res) ? res : []));
    } catch {}
    setLoading(false);
  };

  const typeBadge: Record<string, { label: string; color: string; icon: any }> = {
    note: { label: '笔记', color: 'bg-blue-50 text-blue-600', icon: FileText },
    default: { label: '收藏', color: 'bg-gray-100 text-gray-500', icon: Bookmark },
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">我的收藏</span>
      </div>

      {/* List */}
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
              const badge = typeBadge[item.target_type || item.type] || typeBadge.default;
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all"
                  onClick={() => {
                    if (item.target_type === 'note' || item.type === 'note') {
                      navigate(`/note/${item.target_id || item.note_id}`);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Heart size={20} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-800 truncate flex-1">{item.title || item.target_title || '未命名'}</h3>
                        <span className={`flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${badge.color}`}>
                          <BadgeIcon size={10} />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                      {(item.content || item.target_content) && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.content || item.target_content}</p>
                      )}
                      <span className="text-[10px] text-gray-400 mt-1.5 block">{item.created_at?.slice(0, 10)}</span>
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
