import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { api } from "~/api/request";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface FavItem {
  id: number;
  target_type: string;
  target_id: number;
  title: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  note: "笔记",
  checkin: "打卡",
  post: "帖子",
};

function navigateToTarget(item: FavItem) {
  switch (item.target_type) {
    case "note":
      Taro.navigateTo({ url: `/pages/note-detail/index?id=${item.target_id}` });
      break;
    case "checkin":
      Taro.navigateTo({
        url: `/pages/checkin-detail/index?id=${item.target_id}`,
      });
      break;
    default:
      Taro.showToast({ title: "暂不支持查看", icon: "none" });
  }
}

/* ---------- component ---------- */

export default function FavoritePage() {
  const [list, setList] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const fetchList = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await api.get<FavItem[]>("/api/fav/my_list");
      setList(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    fetchList();
  });

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      <View className="px-12 pt-12">
        {list.map((item) => (
          <View
            key={item.id}
            className="bg-white rounded-xl shadow-sm mb-10 p-16 active:opacity-80"
            onClick={() => navigateToTarget(item)}
          >
            <View className="flex items-center justify-between mb-6">
              <Text className="text-base font-medium text-gray-8 flex-1 truncate mr-10">
                {item.title || "无标题"}
              </Text>
              <View
                className={`shrink-0 px-8 py-2 rounded-md text-xs ${
                  item.target_type === "note"
                    ? "bg-primary-1 text-primary-6"
                    : item.target_type === "checkin"
                    ? "bg-green-1 text-green-6"
                    : "bg-gray-1 text-gray-5"
                }`}
              >
                <Text>{TYPE_LABELS[item.target_type] || item.target_type}</Text>
              </View>
            </View>
            <Text className="text-xs text-gray-4">
              {formatRelativeTimestamp(item.created_at)}
            </Text>
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
            <Text className="block text-4xl mb-12">⭐</Text>
            <Text className="text-sm text-gray-4">暂无收藏内容</Text>
          </View>
        )}

      </View>
    </View>
  );
}
