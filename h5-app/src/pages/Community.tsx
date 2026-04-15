import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Flame,
  Clock3,
  Loader2,
  Plus,
  Sparkles,
  Heart,
  MessageCircle,
  Eye,
  X,
} from 'lucide-react';
import { api, isLoggedIn } from '../api/request';
import { resolveMediaUrl } from '../utils/media';
import MediaGrid from '../components/MediaGrid';
import TagPills from '../components/TagPills';

const TREND_TAGS = ['学习', '复盘', '英语', '考研', '编程', '阅读', '运动', '计划'];

type SortMode = 'recommend' | 'hot' | 'new';

export default function Community() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortMode>('recommend');
  const [keyword, setKeyword] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes(1, true);
    }, 220);
    return () => clearTimeout(timer);
  }, [sort, keyword, activeTag]);

  const loadNotes = async (nextPage: number, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (reset) {
      setInitialLoad(true);
      setPage(1);
      setNotes([]);
    } else {
      setLoading(true);
    }

    try {
      const params: Record<string, any> = { page: nextPage, size: 10, sort };
      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword) params.search = trimmedKeyword;
      if (activeTag) params.tag = activeTag;
      const res: any = await api.get('/note/public_list', params);
      const list = res?.list || [];
      setNotes((prev) => (reset ? list : [...prev, ...list]));
      setHasMore(list.length >= 10);
      setPage(nextPage);
    } catch {
      if (reset) {
        setNotes([]);
        setHasMore(false);
      }
    }

    setLoading(false);
    setInitialLoad(false);
    loadingRef.current = false;
  };

  const loadMore = () => {
    if (!hasMore || loading || initialLoad) return;
    loadNotes(page + 1, false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="sticky top-0 z-20 border-b border-white/40 bg-white/85 backdrop-blur-xl">
        <div className="px-5 pt-12 pb-3">
          <h1 className="text-xl font-bold text-slate-900">社区广场</h1>
          <p className="mt-1 text-xs text-slate-400">推荐优先展示与你和学伴标签更相关的内容</p>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索标题、正文或标签"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
            />
            {keyword && (
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500"
                onClick={() => setKeyword('')}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-3">
          <div className="flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded-[0.9rem] py-2.5 text-sm font-medium transition-all ${
                sort === 'recommend' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setSort('recommend')}
            >
              <Sparkles size={15} className="mr-1 inline" />
              推荐
            </button>
            <button
              type="button"
              className={`flex-1 rounded-[0.9rem] py-2.5 text-sm font-medium transition-all ${
                sort === 'hot' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setSort('hot')}
            >
              <Flame size={15} className="mr-1 inline" />
              热门
            </button>
            <button
              type="button"
              className={`flex-1 rounded-[0.9rem] py-2.5 text-sm font-medium transition-all ${
                sort === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setSort('new')}
            >
              <Clock3 size={15} className="mr-1 inline" />
              最新
            </button>
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TREND_TAGS.map((tag) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200'
                  }`}
                  onClick={() => setActiveTag(active ? '' : tag)}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {initialLoad ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Search size={28} />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-800">暂无匹配内容</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              换个关键词或标签试试，也可以自己发布一篇图文笔记。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note: any) => {
              const images = Array.isArray(note.images) ? note.images : [];
              const coverImages = images.slice(0, 3);
              return (
                <div
                  key={note.id}
                  className="overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white shadow-sm transition-all active:scale-[0.99]"
                  onClick={() => navigate(`/note/${note.id}`)}
                >
                  {coverImages.length > 0 && (
                    <div className="border-b border-slate-100">
                      <MediaGrid images={coverImages} cover={coverImages.length === 1} />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 overflow-hidden rounded-full bg-slate-100 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/${note.user_id}`);
                        }}
                      >
                        {note.user_pic ? (
                          <img src={resolveMediaUrl(note.user_pic)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-indigo-500">
                            {(note.user_name || '?')[0]}
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">{note.user_name || '匿名'}</p>
                          <span className="text-[10px] text-slate-400">{String(note.created_at || '').slice(0, 10)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            {note.visibility === 'partner' ? '学伴可见' : note.visibility === 'private' ? '仅自己' : '公开'}
                          </span>
                          {Array.isArray(note.tags) && note.tags.length > 0 && (
                            <TagPills tags={note.tags.slice(0, 2)} compact className="gap-1" />
                          )}
                        </div>
                      </div>
                    </div>

                    <h3 className="mt-3 text-[15px] font-semibold leading-6 text-slate-900 line-clamp-2">
                      {note.title || '未命名笔记'}
                    </h3>
                    {note.content && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {note.content}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Heart size={13} />
                        {note.like_cnt || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle size={13} />
                        {note.comment_cnt || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye size={13} />
                        {note.view_cnt || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button
                type="button"
                className="w-full rounded-full bg-white py-3 text-sm font-medium text-slate-500 shadow-sm"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>加载中...</span>
                  </span>
                ) : '加载更多'}
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
        onClick={() => navigate('/note/add')}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
