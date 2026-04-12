import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { api } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  user_name: string;
  user_pic: string;
  like_cnt: number;
  view_cnt: number;
  comment_cnt: number;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function CommunityPage() {
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [list, setList] = useState<NoteItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const hasMore = list.length < total;

  const fetchList = useCallback(
    async (p: number, sortMode: "hot" | "new", append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await api.get<{ list: NoteItem[]; total: number }>(
          "/api/note/public_list",
          { page: p, size: PAGE_SIZE, sort: sortMode }
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
    fetchList(1, sort);
  });

  usePullDownRefresh(async () => {
    loadingRef.current = false;
    await fetchList(1, sort);
    Taro.stopPullDownRefresh();
  });

  useReachBottom(() => {
    if (!loadingRef.current && hasMore) {
      fetchList(page + 1, sort, true);
    }
  });

  const switchSort = (mode: "hot" | "new") => {
    if (mode === sort) return;
    setSort(mode);
    loadingRef.current = false;
    fetchList(1, mode);
  };

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/note-detail/index?id=${id}` });
  };

  const goAdd = () => {
    Taro.navigateTo({ url: "/pages/note-add/index" });
  };

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* Sort tabs */}
      <View className="sticky top-0 z-10 bg-white flex items-center px-16 py-12 shadow-sm">
        <View
          className={`px-20 py-8 rounded-full mr-12 text-sm font-medium ${
            sort === "hot"
              ? "bg-primary-6 text-white"
              : "bg-gray-1 text-gray-6"
          }`}
          onClick={() => switchSort("hot")}
        >
          <Text>热门</Text>
        </View>
        <View
          className={`px-20 py-8 rounded-full text-sm font-medium ${
            sort === "new"
              ? "bg-primary-6 text-white"
              : "bg-gray-1 text-gray-6"
          }`}
          onClick={() => switchSort("new")}
        >
          <Text>最新</Text>
        </View>
      </View>

      {/* Card list */}
      <View className="px-12 pt-12">
        {list.map((note) => (
          <View
            key={note.id}
            className="bg-white rounded-xl shadow-sm mb-12 p-16 active:opacity-80"
            onClick={() => goDetail(note.id)}
          >
            {/* Author row */}
            <View className="flex items-center mb-10">
              <Image
                className="w-48 h-48 rounded-full mr-10 bg-gray-2 shrink-0"
                src={resolveImageUrl(note.user_pic) || "https://via.placeholder.com/160"}
                mode="aspectFill"
              />
              <Text className="text-sm text-gray-6 truncate">
                {note.user_name || "匿名用户"}
              </Text>
            </View>

            {/* Title */}
            <Text className="block text-base font-bold text-gray-8 leading-snug mb-6 line-clamp-2">
              {note.title}
            </Text>

            {/* Content preview */}
            {note.content && (
              <Text className="block text-sm text-gray-5 leading-relaxed mb-10 line-clamp-3">
                {note.content}
              </Text>
            )}

            {/* Stats row */}
            <View className="flex items-center text-xs text-gray-4 gap-16">
              <Text>👍 {note.like_cnt || 0}</Text>
              <Text>👁 {note.view_cnt || 0}</Text>
              <Text>💬 {note.comment_cnt || 0}</Text>
            </View>
          </View>
        ))}

        {/* Loading / empty states */}
        {loading && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">加载中...</Text>
          </View>
        )}

        {!loading && list.length === 0 && (
          <View className="py-60 text-center">
            <Text className="text-sm text-gray-4">暂无笔记，快去发布第一篇吧</Text>
          </View>
        )}

        {!loading && list.length > 0 && !hasMore && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">— 已经到底了 —</Text>
          </View>
        )}
      </View>

      {/* Floating add button */}
      <View
        className="fixed right-20 bottom-120 w-56 h-56 rounded-full bg-primary-6 shadow-lg flex items-center justify-center z-20 active:opacity-80"
        onClick={goAdd}
      >
        <Text className="text-white text-2xl font-light leading-none">+</Text>
      </View>
    </View>
  );
}
