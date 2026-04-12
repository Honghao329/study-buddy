import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { api } from "~/api/request";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  like_cnt: number;
  view_cnt: number;
  comment_cnt: number;
  is_public: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function NoteListPage() {
  const [list, setList] = useState<NoteItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const hasMore = list.length < total;

  const fetchList = useCallback(
    async (p: number, append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await api.get<{ list: NoteItem[]; total: number }>(
          "/api/note/my_list",
          { page: p, size: PAGE_SIZE }
        );
        const items = res.list || [];
        setList((prev) => (append ? [...prev, ...items] : items));
        setTotal(res.total || 0);
        setPage(p);
      } catch {
        // silently fail
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  useDidShow(() => {
    loadingRef.current = false;
    fetchList(1);
  });

  usePullDownRefresh(async () => {
    loadingRef.current = false;
    await fetchList(1);
    Taro.stopPullDownRefresh();
  });

  useReachBottom(() => {
    if (!loading && hasMore) {
      fetchList(page + 1, true);
    }
  });

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/note-detail/index?id=${id}` });
  };

  const goAdd = () => {
    Taro.navigateTo({ url: "/pages/note-add/index" });
  };

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* Note cards */}
      <View className="px-12 pt-12">
        {list.map((note) => (
          <View
            key={note.id}
            className="bg-white rounded-xl shadow-sm mb-12 p-16 active:opacity-80"
            onClick={() => goDetail(note.id)}
          >
            {/* Title + badge */}
            <View className="flex items-center mb-8">
              <Text className="flex-1 text-base font-bold text-gray-8 leading-snug truncate mr-8">
                {note.title}
              </Text>
              <View
                className={`px-8 py-2 rounded-full shrink-0 ${
                  note.is_public ? "bg-primary-1 text-primary-6" : "bg-gray-2 text-gray-5"
                }`}
              >
                <Text className="text-xs">{note.is_public ? "公开" : "私密"}</Text>
              </View>
            </View>

            {/* Content preview */}
            {note.content && (
              <Text className="block text-sm text-gray-5 leading-relaxed mb-10 line-clamp-2">
                {note.content}
              </Text>
            )}

            {/* Stats + date */}
            <View className="flex items-center justify-between">
              <View className="flex items-center text-xs text-gray-4 gap-12">
                <Text>👍 {note.like_cnt || 0}</Text>
                <Text>👁 {note.view_cnt || 0}</Text>
                <Text>💬 {note.comment_cnt || 0}</Text>
              </View>
              <Text className="text-xs text-gray-4">{note.created_at}</Text>
            </View>
          </View>
        ))}

        {/* Loading state */}
        {loading && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">加载中...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && list.length === 0 && (
          <View className="py-60 text-center">
            <Text className="block text-sm text-gray-4 mb-16">还没有笔记</Text>
            <View
              className="inline-block px-24 py-10 rounded-full bg-primary-6 active:opacity-80"
              onClick={goAdd}
            >
              <Text className="text-sm text-white">写第一篇笔记</Text>
            </View>
          </View>
        )}

        {/* End of list */}
        {!loading && list.length > 0 && !hasMore && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">— 已经到底了 —</Text>
          </View>
        )}
      </View>

      {/* Floating add button */}
      {list.length > 0 && (
        <View
          className="fixed right-20 bottom-120 w-56 h-56 rounded-full bg-primary-6 shadow-lg flex items-center justify-center z-20 active:opacity-80"
          onClick={goAdd}
        >
          <Text className="text-white text-2xl font-light leading-none">+</Text>
        </View>
      )}
    </View>
  );
}
