import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox } from 'lucide-react';

export default function Messages() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">消息通知</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <Inbox size={56} className="text-indigo-200 mb-4" />
        <h2 className="text-lg font-bold text-slate-700 mb-2">消息列表</h2>
        <p className="text-sm text-gray-400 text-center">功能开发中，敬请期待...</p>
      </div>
    </div>
  );
}
