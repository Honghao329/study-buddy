import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  FileText,
  Globe,
  Heart,
  Loader2,
  Lock,
  Plus,
  MessageCircle,
  Users,
  Trash2,
  Edit3,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';
import MediaGrid from '../components/MediaGrid';
import TagPills from '../components/TagPills';

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
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-20 flex items-center border-b border-slate-100 bg-white px-4 py-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">我的笔记</span>
        </div>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-6">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/40 bg-white/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">我的笔记 ({notes.length})</span>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
          onClick={() => navigate('/note/add')}
        >
          <Plus size={18} />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="px-4 py-20 text-center">
          <FileText size={48} className="mx-auto text-slate-200" />
          <p className="mt-3 text-sm text-slate-400">还没有笔记</p>
          <button
            type="button"
            className="mt-4 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
            onClick={() => navigate('/note/add')}
          >
            写第一篇笔记
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3">
          {notes.map((note: any) => {
            const images = Array.isArray(note.images) ? note.images : [];
            return (
              <div key={note.id} className="overflow-hidden rounded-[1.7rem] border border-slate-100 bg-white shadow-sm">
                {images.length > 0 && (
                  <div className="border-b border-slate-100">
                    <MediaGrid images={images.slice(0, 3)} cover={images.length === 1} />
                  </div>
                )}

                <div className="p-4" onClick={() => navigate(`/note/${note.id}`)}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex-1 text-sm font-semibold text-slate-900 line-clamp-2">{note.title || '无标题'}</h3>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      note.visibility === 'public' ? 'bg-emerald-50 text-emerald-600' : note.visibility === 'partner' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {note.visibility === 'public' ? <Globe size={10} /> : note.visibility === 'partner' ? <Users size={10} /> : <Lock size={10} />}
                      {note.visibility === 'public' ? '公开' : note.visibility === 'partner' ? '学伴' : '私密'}
                    </span>
                  </div>

                  {note.content && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{note.content}</p>
                  )}

                  {Array.isArray(note.tags) && note.tags.length > 0 && (
                    <TagPills tags={note.tags.slice(0, 4)} compact className="mt-3" />
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Heart size={12} /> {note.like_cnt || 0}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {note.comment_cnt || 0}</span>
                      <span className="inline-flex items-center gap-1"><Eye size={12} /> {note.view_cnt || 0}</span>
                    </div>
                    <span>{String(note.created_at || '').slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex border-t border-slate-50">
                  <button
                    type="button"
                    className="flex-1 py-2.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                    onClick={() => navigate(`/note/add?edit=1&id=${note.id}`)}
                  >
                    <Edit3 size={12} className="mr-1 inline" />
                    编辑
                  </button>
                  <div className="w-px bg-slate-50" />
                  <button
                    type="button"
                    className="flex-1 py-2.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-50"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 size={12} className="mr-1 inline" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
