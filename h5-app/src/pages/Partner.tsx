import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2, Users, UserPlus, Search, Eye, Compass } from 'lucide-react';
import { api, isLoggedIn } from '../api/request';

export default function Partner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'my' | 'pending' | 'discover'>('my');
  const [partners, setPartners] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Discover tab state
  const [keyword, setKeyword] = useState('');
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});
  const [discoverPage, setDiscoverPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadData();
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, []);

  useEffect(() => {
    if (tab === 'discover') {
      loadDiscover(1, keyword);
    }
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myR, pendR] = await Promise.allSettled([
        api.get('/partner/my_list'),
        api.get('/partner/pending_list'),
      ]);
      if (myR.status === 'fulfilled') setPartners(Array.isArray(myR.value) ? myR.value as any[] : (myR.value as any)?.list || []);
      if (pendR.status === 'fulfilled') setPending(Array.isArray(pendR.value) ? pendR.value as any[] : (pendR.value as any)?.list || []);
    } catch {}
    setLoading(false);
  };

  const loadDiscover = async (page: number, kw: string) => {
    setDiscoverLoading(true);
    try {
      const res: any = await api.get('/user/list', { page, size: 20, keyword: kw });
      const users = Array.isArray(res) ? res : res?.list || [];
      if (page === 1) {
        setDiscoverUsers(users);
      } else {
        setDiscoverUsers(prev => [...prev, ...users]);
      }
      setDiscoverPage(page);
      setHasMore(users.length >= 20);

      // Batch check relationship status
      if (users.length > 0) {
        const ids = users.map((u: any) => u.id);
        try {
          const statusRes: any = await api.post('/partner/batch_status', { userIds: ids });
          const map: Record<number, string> = {};
          if (Array.isArray(statusRes)) {
            statusRes.forEach((s: any) => { map[s.user_id] = s.status; });
          } else if (statusRes && typeof statusRes === 'object') {
            Object.assign(map, statusRes);
          }
          setStatusMap(prev => ({ ...prev, ...map }));
        } catch {}
      }
    } catch {}
    setDiscoverLoading(false);
  };

  const handleSearch = useCallback((value: string) => {
    setKeyword(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadDiscover(1, value);
    }, 400);
  }, []);

  const handleInvite = async (userId: number) => {
    setInvitingId(userId);
    try {
      await api.post('/partner/invite', { targetId: userId });
      setStatusMap(prev => ({ ...prev, [userId]: 'pending' }));
    } catch {}
    setInvitingId(null);
  };

  const handleAccept = async (id: number) => {
    try {
      await api.post('/partner/accept', { id });
      loadData();
    } catch {}
  };

  const handleReject = async (id: number) => {
    try {
      await api.post('/partner/reject', { id });
      loadData();
    } catch {}
  };

  const list = tab === 'my' ? partners : pending;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Nav Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-gray-100">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="ml-3 text-sm font-medium text-slate-700">学伴</span>
      </div>

      {/* Tabs */}
      <div className="bg-white px-5 pb-3 pt-2 shadow-sm">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            className={`flex-1 flex items-center justify-center space-x-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'my' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => setTab('my')}
          >
            <Users size={15} />
            <span>我的伙伴</span>
            {partners.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 rounded-full">{partners.length}</span>}
          </button>
          <button
            className={`flex-1 flex items-center justify-center space-x-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => setTab('pending')}
          >
            <UserPlus size={15} />
            <span>待处理</span>
            {pending.length > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-full">{pending.length}</span>}
          </button>
          <button
            className={`flex-1 flex items-center justify-center space-x-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'discover' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => setTab('discover')}
          >
            <Compass size={15} />
            <span>发现</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {tab === 'discover' ? (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => handleSearch(e.target.value)}
                placeholder="搜索用户昵称..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
              />
            </div>

            {/* Discover List */}
            {discoverLoading && discoverUsers.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : discoverUsers.length === 0 ? (
              <div className="text-center py-20">
                <Search size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">搜索并发现新的学伴</p>
              </div>
            ) : (
              <div className="space-y-3">
                {discoverUsers.map((u: any) => {
                  const status = statusMap[u.id];
                  return (
                    <div
                      key={u.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/user/${u.id}`)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-indigo-500">{(u.nickname || u.user_name || '?')[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">{u.nickname || u.user_name || '未知用户'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{u.bio || '这个人很懒，什么都没写'}</p>
                      </div>
                      <div className="shrink-0" onClick={e => e.stopPropagation()}>
                        {status === 'accepted' ? (
                          <span className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-full">已是学伴</span>
                        ) : status === 'pending' ? (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-full">已发送邀请</span>
                        ) : (
                          <button
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs font-medium rounded-full hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
                            disabled={invitingId === u.id}
                            onClick={() => handleInvite(u.id)}
                          >
                            {invitingId === u.id ? <Loader2 size={14} className="animate-spin" /> : '添加学伴'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <button
                    className="w-full py-3 text-sm text-indigo-500 font-medium hover:text-indigo-600 transition-colors"
                    onClick={() => loadDiscover(discoverPage + 1, keyword)}
                    disabled={discoverLoading}
                  >
                    {discoverLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : '加载更多'}
                  </button>
                )}
              </div>
            )}
          </>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              {tab === 'my' ? '还没有学伴，快去交个朋友吧' : '暂无待处理的请求'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-indigo-500">{(p.nickname || p.user_name || '?')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{p.nickname || p.user_name || '未知用户'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tab === 'my' ? (p.bio || '学伴') : '请求成为你的学伴'}
                  </p>
                </div>
                {tab === 'my' ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">已结伴</span>
                    <button
                      className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 active:scale-90 transition-all"
                      onClick={() => navigate(`/user/${p.user_id || p.id}`)}
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2 shrink-0">
                    <button
                      className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 active:scale-90 transition-all"
                      onClick={(e) => { e.stopPropagation(); handleAccept(p.id); }}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all"
                      onClick={(e) => { e.stopPropagation(); handleReject(p.id); }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
