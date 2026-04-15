import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, Loader2, Send, Users, Sparkles } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';
import ImagePicker from '../components/ImagePicker';
import TagEditor from '../components/TagEditor';
import TagPills from '../components/TagPills';
import { suggestTags } from '../utils/tags';

export default function NoteAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1';
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'partner'>('public');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (isEdit && editId) loadNote();
  }, []);

  const loadNote = async () => {
    setInitLoading(true);
    try {
      const res: any = await api.get(`/note/detail/${editId}`);
      if (res) {
        setTitle(res.title || '');
        setContent(res.content || '');
        setVisibility(res.visibility || 'public');
        setImages(Array.isArray(res.images) ? res.images : []);
        setTags(Array.isArray(res.tags) ? res.tags : []);
      }
    } catch {}
    setInitLoading(false);
  };

  const smartTags = useMemo(() => {
    const list = suggestTags(title, content, tags);
    return list.filter((tag) => !tags.includes(tag)).slice(0, 5);
  }, [title, content, tags]);

  const handlePublish = async () => {
    if (!title.trim()) { alert('请输入标题'); return; }
    if (!content.trim() && images.length === 0) { alert('请输入内容或上传图片'); return; }

    setLoading(true);
    try {
      const payload = { title: title.trim(), content: content.trim(), visibility, images, tags };
      if (isEdit && editId) {
        await api.put(`/note/update/${editId}`, payload);
      } else {
        await api.post('/note/create', payload);
      }
      navigate(-1);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
    setLoading(false);
  };

  const visibilityOptions = [
    { key: 'public', icon: Globe, label: '公开', desc: '所有人可见' },
    { key: 'partner', icon: Users, label: '学伴', desc: '一对一伙伴可见' },
    { key: 'private', icon: Lock, label: '仅自己', desc: '仅自己可见' },
  ] as const;

  if (initLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-8">
      <div className="relative overflow-hidden rounded-b-[2.25rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 px-5 pb-5 pt-12 text-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-6 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Note Composer</p>
            <h1 className="mt-1 text-lg font-semibold">{isEdit ? '编辑笔记' : '发布笔记'}</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-lg shadow-black/10 disabled:opacity-50"
            onClick={handlePublish}
            disabled={loading || !title.trim()}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            <span>{loading ? '发布中...' : '发布'}</span>
          </button>
        </div>

        <div className="relative z-10 mt-6 rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-white/10 text-white">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">让笔记变成图文故事</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                支持图片上传、#标签自动识别和手动补充，让笔记更容易被社区推荐。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="space-y-4 rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">标题</p>
              <p className="text-xs text-slate-400">一句话概括今天最重要的想法</p>
            </div>
            <input
              className="w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-800 outline-none placeholder:text-slate-300"
              placeholder="输入标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">正文</p>
              <p className="text-xs text-slate-400">可以写学习过程、复盘、灵感或者总结</p>
            </div>
            <textarea
              className="min-h-56 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] leading-relaxed text-slate-700 outline-none placeholder:text-slate-300"
              placeholder="分享你的学习笔记..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <ImagePicker images={images} onChange={setImages} />

          <TagEditor title={title} content={content} tags={tags} onChange={setTags} />

          {smartTags.length > 0 && (
            <div className="space-y-2 rounded-[1.4rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <p className="text-xs font-semibold text-slate-600">社区推荐标签预览</p>
              </div>
              <TagPills tags={smartTags} compact />
            </div>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">可见范围</p>
              <p className="text-xs text-slate-400">一对一伙伴关系建立后，可以选择仅伙伴可见</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {visibilityOptions.map((opt) => {
                const Icon = opt.icon;
                const active = visibility === opt.key;
                return (
                  <button
                    key={opt.key}
                    className={`rounded-[1.25rem] border px-3 py-3 text-left transition-all ${
                      active
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                    onClick={() => setVisibility(opt.key)}
                  >
                    <Icon size={18} className="mb-2" />
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="mt-1 text-[10px] leading-tight text-slate-500">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <span>{title.length}/100</span>
            <span>{content.length} 字 · {images.length} 图 · {tags.length} 标签</span>
          </div>
        </div>
      </div>
    </div>
  );
}
