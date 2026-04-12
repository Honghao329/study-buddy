import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, PenLine, MessageCircle, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/checkin', icon: BookOpen, label: '打卡' },
  { key: 'add', icon: PenLine, label: '发布' },
  { path: '/community', icon: MessageCircle, label: '社区' },
  { path: '/my', icon: User, label: '我的' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const showPaths = ['/', '/checkin', '/community', '/my'];
  if (!showPaths.includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-lg border-t border-gray-100/80 flex justify-around items-end px-2 pt-1 pb-[env(safe-area-inset-bottom,8px)] shadow-[0_-2px_16px_rgba(0,0,0,0.04)] z-50">
      {tabs.map((tab) => {
        // Center raised button
        if (tab.key === 'add') {
          return (
            <div key="add" className="relative flex flex-col items-center -mt-5">
              <button
                className="w-[52px] h-[52px] bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border-4 border-white hover:scale-105 active:scale-95 transition-transform"
                onClick={() => navigate('/note/add')}
              >
                <PenLine size={22} />
              </button>
              <span className="text-[10px] text-gray-400 mt-1">发布</span>
            </div>
          );
        }

        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            className={`flex flex-col items-center justify-center w-14 py-1.5 transition-colors ${
              isActive ? 'text-indigo-600' : 'text-gray-400'
            }`}
            onClick={() => navigate(tab.path!)}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
            {isActive && <div className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />}
          </button>
        );
      })}
    </div>
  );
}
