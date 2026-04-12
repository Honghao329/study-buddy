import { Image, Text, View } from "@tarojs/components";
import { useDidShow, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { api } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface MessageItem {
  id: number;
  type: string;
  content: string;
  from_name: string;
  from_avatar: string;
  is_read: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function MessagesPage() {
  const [list, setList] = useState<MessageItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [detail, setDetail] = useState<MessageItem | null>(null);

  const hasMore = list.length < total;

  const fetchList = useCallback(
    async (p: number, append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await api.get<{ list: MessageItem[]; total: number }>(
          "/api/message/list",
          { page: p, size: PAGE_SIZE }
        );
        const items = res.list || [];
        setList((prev) => (append ? [...prev, ...items] : items));
        setTotal(res.total || 0);
        setPage(p);
      } catch {
        /* ignore */
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  useDidShow(() => {
    fetchList(1);
  });

  useReachBottom(() => {
    if (!loading && hasMore) {
      fetchList(page + 1, true);
    }
  });

  /* ---- actions ---- */

  const openMessage = async (msg: MessageItem) => {
    if (!msg.is_read) {
      try {
        await api.post("/api/message/read", { id: msg.id });
        setList((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
      } catch {
        /* ignore */
      }
    }
    setDetail(msg);
  };

  const closeDetail = () => {
    setDetail(null);
  };

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* Message list */}
      <View className="px-12 pt-12">
        {list.map((msg) => (
          <View
            key={msg.id}
            className="bg-white rounded-xl shadow-sm mb-10 p-14 flex items-start active:opacity-80"
            onClick={() => openMessage(msg)}
          >
            {/* Avatar */}
            <View className="relative shrink-0 mr-12">
              <Image
                className="w-44 h-44 rounded-full bg-gray-2"
                src={resolveImageUrl(msg.from_avatar) || "https://via.placeholder.com/160"}
                mode="aspectFill"
              />
              {!msg.is_read && (
                <View className="absolute top-0 right-0 w-10 h-10 rounded-full bg-red-5" />
              )}
            </View>

            {/* Content */}
            <View className="flex-1 min-w-0">
              <View className="flex items-center justify-between mb-4">
                <Text className="text-sm font-medium text-gray-8 truncate">
                  {msg.from_name || "系统通知"}
                </Text>
                <Text className="text-xs text-gray-4 shrink-0 ml-8">
                  {formatRelativeTimestamp(msg.created_at)}
                </Text>
              </View>
              <Text className="text-sm text-gray-5 truncate block">
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Loading */}
        {loading && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">加载中...</Text>
          </View>
        )}

        {/* Empty */}
        {!loading && list.length === 0 && (
          <View className="py-80 text-center">
            <Text className="block text-4xl mb-12">📭</Text>
            <Text className="text-sm text-gray-4">暂无消息</Text>
          </View>
        )}

        {/* No more */}
        {!loading && list.length > 0 && !hasMore && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">-- 已经到底了 --</Text>
          </View>
        )}
      </View>

      {/* ====== Detail Modal ====== */}
      {detail && (
        <View
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeDetail}
        >
          {/* Overlay */}
          <View className="absolute inset-0 bg-black opacity-50" />

          {/* Modal content */}
          <View
            className="relative bg-white rounded-xl mx-24 p-20 w-full max-w-600 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex items-center mb-16">
              <Image
                className="w-40 h-40 rounded-full bg-gray-2 mr-10"
                src={resolveImageUrl(detail.from_avatar) || "https://via.placeholder.com/160"}
                mode="aspectFill"
              />
              <View className="flex-1 min-w-0">
                <Text className="text-base font-bold text-gray-8 block">
                  {detail.from_name || "系统通知"}
                </Text>
                <Text className="text-xs text-gray-4">
                  {formatRelativeTimestamp(detail.created_at)}
                </Text>
              </View>
            </View>

            {/* Body */}
            <Text className="text-sm text-gray-6 leading-relaxed block mb-20">
              {detail.content}
            </Text>

            {/* Close */}
            <View
              className="bg-gray-1 rounded-lg py-10 text-center active:opacity-80"
              onClick={closeDetail}
            >
              <Text className="text-sm text-gray-6">关闭</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
