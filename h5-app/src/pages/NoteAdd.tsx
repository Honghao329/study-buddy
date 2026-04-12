import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, Users, Send, Loader2 } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function NoteAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1';
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'partner'>('public');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (isEdit && editId) {
      loadNote();
    }
  }, []);

  const loadNote = async () => {
    setInitLoading(true);
    try {
      const res: any = await api.get(`/note/detail/${editId}`);
      if (res) {
        setTitle(res.title || '');
        setContent(res.content || '');
        setVisibility(res.visibility || 'public');
      }
    } catch {}
    setInitLoading(false);
  };

  const handlePublish = async () => {
    if (!title.trim()) { alert('请输入标题'); return; }
    if (!content.trim()) { alert('请输入内容'); return; }

    setLoading(true);
    try {
      if (isEdit && editId) {
        await api.put(`/note/update/${editId}`, { title: title.trim(), content: content.trim(), visibility });
      } else {
        await api.post('/note/create', { title: title.trim(), content: content.trim(), visibility });
      }
      navigate(-1);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
    setLoading(false);
  };

  const visibilityOptions = [
    { key: 'public', icon: Globe, label: '公开', desc: '所有人可见' },
    { key: 'private', icon: Lock, label: '仅自己', desc: '仅自己可见' },
    { key: 'partner', icon: Users, label: '学伴', desc: '学伴可见' },
  ] as const;

  if (initLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="text-sm font-medium text-slate-700">{isEdit ? '编辑笔记' : '发布笔记'}</span>
        <button
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
            title.trim() && content.trim()
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
              : 'bg-gray-200 text-gray-400'
          }`}
          onClick={handlePublish}
          disabled={loading || !title.trim() || !content.trim()}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span>{loading ? '发布中...' : '发布'}</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <input
            className="w-full px-5 pt-5 pb-3 text-lg font-semibold outline-none placeholder-gray-300"
            placeholder="输入标题..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
          />
          <div className="h-px bg-gray-100 mx-5" />
          <textarea
            className="w-full px-5 pt-3 pb-4 text-[15px] leading-relaxed outline-none placeholder-gray-300 resize-none"
            placeholder="分享你的学习笔记..."
            rows={12}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {/* Visibility Toggle */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-3 font-medium">可见范围</p>
          <div className="flex space-x-2.5">
            {visibilityOptions.map((opt) => {
              const Icon = opt.icon;
              const active = visibility === opt.key;
              return (
                <button
                  key={opt.key}
                  className={`flex-1 flex flex-col items-center py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                    active
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                  onClick={() => setVisibility(opt.key)}
                >
                  <Icon size={18} className="mb-1" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Character count */}
        <div className="flex justify-between items-center mt-3 px-1 pb-6">
          <span className="text-xs text-gray-400">
            {title.length}/100
          </span>
          <span className="text-xs text-gray-400">{content.length} 字</span>
        </div>
      </div>
    </div>
  );
}
