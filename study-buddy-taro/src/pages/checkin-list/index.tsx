import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { Cell, Empty, FloatingBubble, Loading, Tag } from "@taroify/core";
import { Plus } from "@taroify/icons";
import { api, isLoggedIn } from "~/api/request";

interface CheckinTask {
  id: number;
  title: string;
  description: string;
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

  const onCreateTap = async () => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    try {
      const titleRes = await Taro.showModal({
        title: "创建打卡任务",
        placeholderText: "请输入任务标题",
        editable: true,
        confirmText: "下一步",
      });
      if (!titleRes.confirm || !titleRes.content?.trim()) return;
      const title = titleRes.content.trim();

      const descRes = await Taro.showModal({
        title: "任务描述（可选）",
        placeholderText: "请输入任务描述",
        editable: true,
        confirmText: "创建",
      });
      const description = descRes.confirm ? (descRes.content?.trim() || "") : "";
      if (!descRes.confirm) return;

      Taro.showLoading({ title: "创建中..." });
      const res = await api.post<{ id: number }>("/api/checkin/create", {
        title,
        description,
      });
      Taro.hideLoading();
      Taro.showToast({ title: "创建成功", icon: "success" });
      // Navigate to the newly created checkin detail
      if (res?.id) {
        Taro.navigateTo({ url: `/pages/checkin-detail/index?id=${res.id}` });
      } else {
        loadList(1);
      }
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: "创建失败", icon: "none" });
    }
  };

  return (
    <View className="min-h-screen bg-[#F7F8FA]">
      {list.length === 0 && !loading ? (
        <View className="pt-32">
          <Empty>
            <Empty.Image />
            <Empty.Description>暂无打卡任务</Empty.Description>
            <Empty.Description>下拉刷新试试</Empty.Description>
          </Empty>
        </View>
      ) : (
        <View className="px-3 pt-3 pb-24">
          <Cell.Group inset>
            {list.map((item) => (
              <Cell
                key={item.id}
                className="active:bg-gray-50"
                clickable
                onClick={() => goDetail(item.id)}
              >
                <View className="w-full py-1">
                  {/* Title row */}
                  <View className="flex items-center justify-between mb-1.5">
                    <Text className="text-base font-bold text-[#333] flex-1 mr-2 truncate">
                      {item.title}
                    </Text>
                    {joinedIds.has(item.id) && (
                      <Tag color="primary" round className="flex-shrink-0">
                        已加入
                      </Tag>
                    )}
                  </View>

                  {/* Description */}
                  {item.description && (
                    <Text className="block text-sm text-[#999] line-clamp-2 mb-2 leading-relaxed">
                      {item.description}
                    </Text>
                  )}

                  {/* Footer meta */}
                  <View className="flex items-center justify-between text-xs text-[#BCBCBC]">
                    <View className="flex items-center gap-3">
                      <Text className="text-xs text-[#BCBCBC]">
                        {item.join_cnt || 0}人参与
                      </Text>
                      <Text className="text-xs text-[#BCBCBC]">
                        {item.creator_name || "匿名"}
                      </Text>
                    </View>
                    <Text className="text-xs text-[#BCBCBC]">
                      {item.created_at?.slice(0, 10)}
                    </Text>
                  </View>
                </View>
              </Cell>
            ))}
          </Cell.Group>

          {/* Loading indicator */}
          {loading && (
            <View className="flex justify-center items-center py-4 gap-2">
              <Loading size="18px" />
              <Text className="text-sm text-[#999]">加载中...</Text>
            </View>
          )}

          {/* No more data */}
          {!loading && list.length > 0 && list.length >= total && (
            <View className="flex justify-center py-4">
              <Text className="text-xs text-[#BCBCBC]">— 没有更多了 —</Text>
            </View>
          )}
        </View>
      )}

      {/* Floating create button */}
      <FloatingBubble
        icon={<Plus />}
        style={{
          "--initial-position-bottom": "100px",
          "--initial-position-right": "16px",
          "--background": "#58CC02",
        } as React.CSSProperties}
        onClick={onCreateTap}
      />
    </View>
  );
}
