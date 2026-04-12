import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, Send } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function NoteAdd() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) { alert('请输入标题'); return; }
    if (!content.trim()) { alert('请输入内容'); return; }
    if (!isLoggedIn()) { navigate('/login'); return; }

    setLoading(true);
    try {
      await api.post('/note/create', { title: title.trim(), content: content.trim(), visibility });
      navigate(-1);
    } catch (err: any) {
      alert(err.message || '发布失败');
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="text-sm font-medium text-slate-700">发布笔记</span>
        <button
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
            title.trim() && content.trim()
              ? 'bg-indigo-600 text-white active:bg-indigo-700'
              : 'bg-gray-200 text-gray-400'
          }`}
          onClick={handlePublish}
          disabled={loading}
        >
          <Send size={14} />
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
          <div className="flex space-x-3">
            <button
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-medium transition border-2 ${
                visibility === 'public'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                  : 'border-gray-100 bg-gray-50 text-gray-500'
              }`}
              onClick={() => setVisibility('public')}
            >
              <Globe size={16} />
              <span>公开</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-medium transition border-2 ${
                visibility === 'private'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                  : 'border-gray-100 bg-gray-50 text-gray-500'
              }`}
              onClick={() => setVisibility('private')}
            >
              <Lock size={16} />
              <span>仅自己可见</span>
            </button>
          </div>
        </div>

        {/* Character count */}
        <div className="flex justify-end mt-3 px-1">
          <span className="text-xs text-gray-400">{content.length} 字</span>
        </div>
      </div>
    </div>
  );
}
