import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { api, isLoggedIn } from "~/api/request";

interface CheckinTask {
  id: number;
  title: string;
  desc: string;
  join_cnt: number;
  creator_name: string;
  created_at: string;
}

export default function CheckinListPage() {
  const [list, setList] = useState<CheckinTask[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const loadList = useCallback(async (p: number, append = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await api.get<{ list: CheckinTask[]; total: number }>(
        "/api/checkin/list",
        { page: p, size: 20 }
      );
      const items = res.list || [];
      setTotal(res.total || 0);
      setList((prev) => (append ? [...prev, ...items] : items));
      setPage(p);
    } catch {
      // silent
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const loadJoinedIds = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const ids: number[] = await api.get("/api/checkin/my_joined_ids");
      setJoinedIds(new Set(ids || []));
    } catch {
      // silent
    }
  }, []);

  useDidShow(() => {
    loadList(1);
    loadJoinedIds();
  });

  usePullDownRefresh(async () => {
    loadingRef.current = false;
    await loadList(1);
    await loadJoinedIds();
    Taro.stopPullDownRefresh();
  });

  useReachBottom(() => {
    if (list.length < total && !loadingRef.current) {
      loadList(page + 1, true);
    }
  });

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/checkin-detail/index?id=${id}` });
  };

  const onCreateTap = () => {
    Taro.showToast({ title: "功能开发中", icon: "none" });
  };

  return (
    <View className="min-h-screen bg-gray-1">
      {list.length === 0 && !loading ? (
        /* Empty state */
        <View className="flex flex-col items-center justify-center pt-40">
          <Text className="text-3xl mb-4">📋</Text>
          <Text className="text-base text-gray-4">暂无打卡任务</Text>
          <Text className="text-sm text-gray-4 mt-1">下拉刷新试试</Text>
        </View>
      ) : (
        <View className="px-3 pt-3 pb-24">
          <View className="flex flex-col gap-3">
            {list.map((item) => (
                <View
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm px-4 py-3 active:opacity-80"
                  onClick={() => goDetail(item.id)}
                >
                  {/* Title row */}
                  <View className="flex items-center justify-between mb-1">
                    <Text className="text-base font-bold text-gray-8 flex-1 mr-2 truncate">
                      {item.title}
                    </Text>
                    {joinedIds.has(item.id) && (
                      <Text className="text-xs text-primary-6 bg-primary-1 rounded-full px-2 py-0.5 flex-shrink-0">
                        已加入
                      </Text>
                    )}
                  </View>

                  {/* Description */}
                  {item.desc && (
                    <Text className="text-sm text-gray-6 line-clamp-2 mb-2">
                      {item.desc}
                    </Text>
                  )}

                  {/* Footer meta */}
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-3">
                      <Text className="text-xs text-gray-4">
                        {item.join_cnt || 0}人参与
                      </Text>
                      <Text className="text-xs text-gray-4">
                        {item.creator_name || "匿名"}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-4">
                      {item.created_at?.slice(0, 10)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Loading indicator */}
            {loading && (
              <View className="flex justify-center py-4">
                <Text className="text-sm text-gray-4">加载中...</Text>
              </View>
            )}

            {/* No more data */}
            {!loading && list.length > 0 && list.length >= total && (
              <View className="flex justify-center py-4">
                <Text className="text-xs text-gray-4">— 没有更多了 —</Text>
              </View>
            )}
        </View>
      )}

      {/* Floating create button */}
      <View
        className="fixed right-4 bottom-24 w-12 h-12 rounded-full bg-primary-6 shadow-lg flex items-center justify-center active:opacity-80 z-50"
        onClick={onCreateTap}
      >
        <Text className="text-white text-2xl leading-none font-light">+</Text>
      </View>
    </View>
  );
}
