import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Compass,
  Eye,
  Loader2,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';
import { resolveMediaUrl } from '../utils/media';
import TagPills from '../components/TagPills';

type PartnerStatus = 'none' | 'pending' | 'accepted' | 'occupied';

export default function Partner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'my' | 'pending' | 'discover'>('my');
  const [currentPartner, setCurrentPartner] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<number, PartnerStatus>>({});
  const [discoverPage, setDiscoverPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const [currentR, pendR] = await Promise.allSettled([
        api.get('/partner/current'),
        api.get('/partner/pending_list'),
      ]);

      if (currentR.status === 'fulfilled') {
        const data: any = currentR.value || {};
        setCurrentPartner(data?.partner || null);
      }
      if (pendR.status === 'fulfilled') setPending(Array.isArray(pendR.value) ? (pendR.value as any[]) : (pendR.value as any)?.list || []);
    } catch {}
    setLoading(false);
  };

  const loadDiscover = async (page: number, kw: string) => {
    setDiscoverLoading(true);
    try {
      const res: any = await api.get('/user/list', { page, size: 20, keyword: kw });
      const users = Array.isArray(res) ? res : res?.list || [];
      if (page === 1) setDiscoverUsers(users);
      else setDiscoverUsers((prev) => [...prev, ...users]);
      setDiscoverPage(page);
      setHasMore(users.length >= 20);

      if (users.length > 0) {
        const ids = users.map((u: any) => u.id);
        try {
          const statusRes: any = await api.post('/partner/batch_status', { userIds: ids });
          const map: Record<number, PartnerStatus> = {};
          if (statusRes && typeof statusRes === 'object' && !Array.isArray(statusRes)) {
            Object.keys(statusRes).forEach((key) => {
              map[Number(key)] = statusRes[key] as PartnerStatus;
            });
          }
          setStatusMap((prev) => ({ ...prev, ...map }));
        } catch {}
      }
    } catch {}
    setDiscoverLoading(false);
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadDiscover(1, value);
    }, 300);
  };

  const handleInvite = async (userId: number) => {
    setInvitingId(userId);
    try {
      await api.post('/partner/invite', { targetId: userId });
      setStatusMap((prev) => ({ ...prev, [userId]: 'pending' }));
    } catch {}
    setInvitingId(null);
  };

  const handleAccept = async (id: number) => {
    try {
      await api.post('/partner/accept', { id });
      await loadData();
    } catch {}
  };

  const handleReject = async (id: number) => {
    try {
      await api.post('/partner/reject', { id });
      await loadData();
    } catch {}
  };

  const isOccupied = !!currentPartner;
  const hasPartner = !!currentPartner;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-8">
      <div className="sticky top-0 z-20 border-b border-white/40 bg-white/85 backdrop-blur-xl">
        <div className="flex items-center px-4 py-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="ml-3 text-sm font-medium text-slate-700">学伴</span>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">One-to-one partner</p>
              <h1 className="mt-2 text-[22px] font-bold leading-tight">建立稳定的 1 对 1 学伴关系</h1>
              <p className="mt-2 text-sm leading-relaxed text-white/72">
                一个人只能有一个伙伴，建立后会自动进入专属伙伴空间。
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-white/10 backdrop-blur-md">
              <Sparkles size={24} />
            </div>
          </div>

          {currentPartner ? (
            <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="h-14 w-14 overflow-hidden rounded-[1.2rem] bg-white/15"
                  onClick={() => navigate(`/user/${currentPartner.id}`)}
                >
                  {currentPartner.avatar ? (
                    <img src={resolveMediaUrl(currentPartner.avatar)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold">
                      {(currentPartner.nickname || '?')[0]}
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">{currentPartner.nickname || '伙伴'}</h2>
                    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
                      当前伙伴
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-white/70">{currentPartner.bio || 'TA 还没有写简介'}</p>
                  <TagPills tags={currentPartner.tags || []} compact className="mt-2" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: '笔记', value: currentPartner.note_cnt || 0 },
                  { label: '签到', value: currentPartner.sign_days || 0 },
                  { label: '打卡', value: currentPartner.checkin_cnt || 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.2rem] bg-white/10 px-3 py-2 text-center">
                    <div className="text-lg font-bold">{item.value}</div>
                    <div className="text-[10px] text-white/55">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-lg shadow-black/10"
                  onClick={() => navigate('/partner/room')}
                >
                  进入伙伴空间
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white"
                  onClick={() => navigate(`/user/${currentPartner.id}`)}
                >
                  主页
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-white/10">
                  <Users size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">还没有建立伙伴关系</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">
                    去发现列表里找一个合适的人，然后邀请成为你的 1 对 1 学伴。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-[1.4rem] bg-white p-1 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              className={`rounded-[1rem] py-3 text-sm font-medium transition-all ${
                tab === 'my' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setTab('my')}
            >
              <Users size={15} className="mr-1 inline" />
              我的伙伴
              {hasPartner && (
                <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                  1
                </span>
              )}
            </button>
            <button
              type="button"
              className={`rounded-[1rem] py-3 text-sm font-medium transition-all ${
                tab === 'pending' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setTab('pending')}
            >
              <UserPlus size={15} className="mr-1 inline" />
              待处理
              {pending.length > 0 && (
                <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                  {pending.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`rounded-[1rem] py-3 text-sm font-medium transition-all ${
                tab === 'discover' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setTab('discover')}
            >
              <Compass size={15} className="mr-1 inline" />
              发现
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {tab === 'discover' && isOccupied && (
          <div className="mb-4 rounded-[1.4rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            当前已拥有伙伴，新的邀请会显示为“已满员”。
          </div>
        )}

        {tab === 'discover' ? (
          <>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索昵称、签名、标签"
                className="w-full rounded-[1.2rem] border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {discoverLoading && discoverUsers.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : discoverUsers.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <Search size={48} className="mx-auto text-slate-200" />
                <p className="mt-3 text-sm text-slate-400">搜索并发现新的学伴</p>
              </div>
            ) : (
              <div className="space-y-3">
                {discoverUsers.map((user: any) => {
                  const status = statusMap[user.id] || 'none';
                  return (
                    <div
                      key={user.id}
                      className="rounded-[1.6rem] border border-slate-100 bg-white p-4 shadow-sm transition-all active:scale-[0.99]"
                      onClick={() => navigate(`/user/${user.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          className="h-12 w-12 overflow-hidden rounded-full bg-slate-100 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/user/${user.id}`);
                          }}
                        >
                          {user.avatar ? (
                            <img src={resolveMediaUrl(user.avatar)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-indigo-500">
                              {(user.nickname || '?')[0]}
                            </div>
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-800">{user.nickname || '未知用户'}</h3>
                            <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                              {status === 'accepted'
                                ? '已是学伴'
                                : status === 'pending'
                                  ? '已发送邀请'
                                  : status === 'occupied'
                                    ? '当前已有伙伴'
                                    : '可邀请'}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-400">{user.bio || '这个人很懒，什么都没写'}</p>
                          {Array.isArray(user.tags) && user.tags.length > 0 && (
                            <TagPills tags={user.tags.slice(0, 3)} compact className="mt-2" />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Eye size={13} />
                          <span>{user.login_cnt || 0} 次活跃</span>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          {status === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
                              <Check size={13} />
                              已是学伴
                            </span>
                          ) : status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400">
                              已发送邀请
                            </span>
                          ) : status === 'occupied' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                              <X size={13} />
                              当前已有伙伴
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm disabled:opacity-60"
                              disabled={invitingId === user.id || isOccupied}
                              onClick={() => handleInvite(user.id)}
                            >
                              {invitingId === user.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <UserPlus size={13} />
                              )}
                              <span>{isOccupied ? '当前已满员' : '添加学伴'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    type="button"
                    className="w-full rounded-full bg-white py-3 text-sm font-medium text-indigo-500 shadow-sm"
                    onClick={() => loadDiscover(discoverPage + 1, keyword)}
                    disabled={discoverLoading}
                  >
                    {discoverLoading ? <Loader2 size={16} className="mx-auto animate-spin" /> : '加载更多'}
                  </button>
                )}
              </div>
            )}
          </>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : tab === 'my' ? (
          <>
            {!currentPartner ? (
              <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <Users size={48} className="mx-auto text-slate-200" />
                <p className="mt-3 text-sm text-slate-400">还没有学伴，先去发现列表建立一个 1 对 1 关系</p>
              </div>
            ) : (
              <div className="rounded-[1.8rem] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="h-12 w-12 overflow-hidden rounded-full bg-slate-100"
                    onClick={() => navigate(`/user/${currentPartner.id}`)}
                  >
                    {currentPartner.avatar ? (
                      <img src={resolveMediaUrl(currentPartner.avatar)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-indigo-500">
                        {(currentPartner.nickname || '?')[0]}
                      </div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-800">{currentPartner.nickname || '未知用户'}</h3>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">
                        一对一
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">{currentPartner.bio || '学伴'}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: '笔记', value: currentPartner.note_cnt || 0 },
                    { label: '签到', value: currentPartner.sign_days || 0 },
                    { label: '打卡', value: currentPartner.checkin_cnt || 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.1rem] bg-slate-50 px-3 py-2 text-center">
                      <div className="text-base font-bold text-slate-900">{item.value}</div>
                      <div className="text-[10px] text-slate-400">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-600"
                    onClick={() => navigate(`/user/${currentPartner.id}`)}
                  >
                    查看主页
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white"
                    onClick={() => navigate('/partner/room')}
                  >
                    进入伙伴空间
                  </button>
                </div>
              </div>
            )}
          </>
        ) : pending.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <UserPlus size={48} className="mx-auto text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">暂无待处理的邀请</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((item: any) => (
              <div key={item.id} className="rounded-[1.6rem] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="h-12 w-12 overflow-hidden rounded-full bg-slate-100"
                    onClick={() => navigate(`/user/${item.user_id}`)}
                  >
                    {item.user_pic ? (
                      <img src={resolveMediaUrl(item.user_pic)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-indigo-500">
                        {(item.user_name || '?')[0]}
                      </div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-slate-800">{item.user_name || '未知用户'}</h3>
                    <p className="mt-1 text-xs text-slate-400">请求成为你的学伴</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-600"
                    onClick={() => handleAccept(item.id)}
                  >
                    接受
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-500"
                    onClick={() => handleReject(item.id)}
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
