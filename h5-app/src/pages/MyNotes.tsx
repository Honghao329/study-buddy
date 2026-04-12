import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Eye, MessageCircle, Plus, Loader2, FileText, Globe, Lock } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function MyNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/note/my_list', { page: 1, size: 50 });
      setNotes(res?.list || (Array.isArray(res) ? res : []));
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这篇笔记？')) return;
    try {
      await api.del(`/note/delete/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => navigate(-1)}><ArrowLeft size={18} className="text-gray-600" /></button>
          <span className="ml-3 text-sm font-medium text-slate-700">我的笔记</span>
        </div>
        <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-indigo-400" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => navigate(-1)}><ArrowLeft size={18} className="text-gray-600" /></button>
          <span className="ml-3 text-sm font-medium text-slate-700">我的笔记 ({notes.length})</span>
        </div>
        <button className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center" onClick={() => navigate('/note/add')}>
          <Plus size={18} className="text-indigo-600" />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">还没有笔记</p>
          <button className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium" onClick={() => navigate('/note/add')}>
            写第一篇笔记
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3">
          {notes.map((n: any) => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4" onClick={() => navigate(`/note/${n.id}`)}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 flex-1 mr-2">{n.title}</h3>
                  <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                    n.visibility === 'public' || n.is_public ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {n.visibility === 'public' || n.is_public ? <><Globe size={10} /> 公开</> : <><Lock size={10} /> 私密</>}
                  </span>
                </div>
                {n.content && <p className="text-gray-400 text-xs line-clamp-2 mb-3">{n.content}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Heart size={12} /> {n.like_cnt || 0}</span>
                    <span className="flex items-center gap-1"><Eye size={12} /> {n.view_cnt || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {n.comment_cnt || 0}</span>
                  </div>
                  <span>{n.created_at?.slice(0, 10)}</span>
                </div>
              </div>
              <div className="flex border-t border-gray-50">
                <button className="flex-1 py-2.5 text-xs text-indigo-600 font-medium hover:bg-indigo-50 transition-colors" onClick={() => navigate(`/note/add?edit=1&id=${n.id}`)}>
                  编辑
                </button>
                <div className="w-px bg-gray-50" />
                <button className="flex-1 py-2.5 text-xs text-red-500 font-medium hover:bg-red-50 transition-colors" onClick={() => handleDelete(n.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
