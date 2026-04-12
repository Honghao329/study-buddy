import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, PenLine, MessageCircle, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/checkin', icon: BookOpen, label: '打卡' },
  { path: '/community', icon: MessageCircle, label: '社区' },
  { path: '/my', icon: User, label: '我的' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // 只在主页面显示 tabbar
  const showPaths = ['/', '/checkin', '/community', '/my'];
  if (!showPaths.includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex justify-around items-center px-2 py-2 pb-[env(safe-area-inset-bottom,8px)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)] z-50">
      {tabs.map((tab, i) => {
        const isActive = location.pathname === tab.path;
        if (i === 2) {
          // 中间凸起的发布按钮
          return (
            <div key="pen" className="relative -top-5">
              <button className="w-13 h-13 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 border-4 border-white hover:scale-105 transition-transform"
                onClick={() => navigate('/note/add')}>
                <PenLine size={22} />
              </button>
            </div>
          );
        }
        const Icon = tab.icon;
        const actualI = i > 2 ? i : i; // adjust for the pen button
        return (
          <button key={tab.path}
            className={`flex flex-col items-center justify-center w-16 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
            onClick={() => navigate(tab.path)}>
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
