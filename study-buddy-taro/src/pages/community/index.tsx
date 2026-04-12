import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { Avatar, Empty, FloatingBubble, Loading, Tabs } from "@taroify/core";
import { Plus, LikeOutlined, EyeOutlined, CommentOutlined } from "@taroify/icons";
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

  const tabIndex = sort === "hot" ? 0 : 1;

  return (
    <View className="min-h-screen bg-[#F7F8FA] pb-40">
      {/* Sort tabs */}
      <View className="sticky top-0 z-10 bg-white">
        <Tabs
          value={tabIndex}
          onChange={(val) => switchSort(val === 0 ? "hot" : "new")}
          style={{
            "--tabs-active-color": "#58CC02",
            "--tabs-line-height": "3px",
          } as React.CSSProperties}
        >
          <Tabs.TabPane title="热门" />
          <Tabs.TabPane title="最新" />
        </Tabs>
      </View>

      {/* Card list */}
      <View className="px-3 pt-3">
        {list.map((note) => (
          <View
            key={note.id}
            className="bg-white rounded-xl mb-3 p-4 active:opacity-80"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            onClick={() => goDetail(note.id)}
          >
            {/* Author row */}
            <View className="flex items-center mb-2.5">
              <Avatar
                src={resolveImageUrl(note.user_pic) || ""}
                size="small"
                style={{ marginRight: "8px", flexShrink: 0 }}
              />
              <Text className="text-sm text-[#666] truncate">
                {note.user_name || "匿名用户"}
              </Text>
            </View>

            {/* Title */}
            <Text className="block text-base font-bold text-[#333] leading-snug mb-1.5 line-clamp-2">
              {note.title}
            </Text>

            {/* Content preview */}
            {note.content && (
              <Text className="block text-sm text-[#999] leading-relaxed mb-3 line-clamp-3">
                {note.content}
              </Text>
            )}

            {/* Stats row */}
            <View className="flex items-center gap-4 text-xs text-[#BCBCBC]">
              <View className="flex items-center gap-1">
                <LikeOutlined size="14" color="#BCBCBC" />
                <Text className="text-xs text-[#BCBCBC]">{note.like_cnt || 0}</Text>
              </View>
              <View className="flex items-center gap-1">
                <EyeOutlined size="14" color="#BCBCBC" />
                <Text className="text-xs text-[#BCBCBC]">{note.view_cnt || 0}</Text>
              </View>
              <View className="flex items-center gap-1">
                <CommentOutlined size="14" color="#BCBCBC" />
                <Text className="text-xs text-[#BCBCBC]">{note.comment_cnt || 0}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Loading state */}
        {loading && (
          <View className="flex justify-center items-center py-5 gap-2">
            <Loading size="18px" />
            <Text className="text-sm text-[#999]">加载中...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && list.length === 0 && (
          <View className="pt-20">
            <Empty>
              <Empty.Image />
              <Empty.Description>暂无笔记，快去发布第一篇吧</Empty.Description>
            </Empty>
          </View>
        )}

        {/* No more data */}
        {!loading && list.length > 0 && !hasMore && (
          <View className="flex justify-center py-5">
            <Text className="text-xs text-[#BCBCBC]">— 已经到底了 —</Text>
          </View>
        )}
      </View>

      {/* Floating add button */}
      <FloatingBubble
        icon={<Plus />}
        style={{
          "--initial-position-bottom": "100px",
          "--initial-position-right": "16px",
          "--background": "#58CC02",
        } as React.CSSProperties}
        onClick={goAdd}
      />
    </View>
  );
}
