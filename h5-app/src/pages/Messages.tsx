import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Inbox } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/message/list', { page: 1, size: 50 });
      setMessages(res?.list || (Array.isArray(res) ? res : []));
    } catch {}
    setLoading(false);
  };

  const markRead = async (msg: any) => {
    if (msg.is_read) return;
    try {
      await api.post('/message/read', { id: msg.id });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: 1 } : m));
    } catch {}
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 172800000) return '昨天';
    return t.slice(0, 10);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">消息通知</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <Inbox size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">暂无消息</p>
            <p className="text-gray-300 text-xs mt-1">所有通知将在这里显示</p>
          </div>
        ) : (
          <div className="px-4 pt-3 space-y-2 pb-6">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 hover:shadow-md transition-shadow active:scale-[0.98] ${
                  !msg.is_read ? 'border-l-4 border-l-indigo-400' : ''
                }`}
                onClick={() => markRead(msg)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                  {msg.from_avatar ? (
                    <img src={msg.from_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-indigo-500">{(msg.from_name || '系')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700 truncate">{msg.from_name || '系统通知'}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {!msg.is_read && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
