import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { api, isLoggedIn } from "~/api/request";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";
import InputPopup from "~/components/InputPopup";
import { resolveImageUrl } from "~/utils/imageUrl";

interface CheckinDetail {
  id: number;
  title: string;
  desc: string;
  join_cnt: number;
  creator_id: number;
  creator_name: string;
  creator_avatar: string;
  supervisor_id: number;
  supervisor_name: string;
  created_at: string;
  is_joined?: boolean;
  my_total?: number;
}

interface CheckinRecord {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  content: string;
  image: string;
  duration: number;
  created_at: string;
  comment: string;
  comment_by: string;
}

export default function CheckinDetailPage() {
  const { id } = Taro.getCurrentInstance().router?.params || {};

  const [detail, setDetail] = useState<CheckinDetail | null>(null);
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [todayDone, setTodayDone] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinContent, setCheckinContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.get<CheckinDetail>(`/api/checkin/detail/${id}`);
      setDetail(data);
      setTodayDone(Boolean(data.is_joined));
      setJoined(Boolean((data.my_total || 0) > 0));
      setLoadError("");
    } catch {
      setDetail(null);
      setLoadError("任务加载失败");
      Taro.showToast({ title: "加载失败", icon: "none" });
    }
  }, [id]);

  const loadRecords = useCallback(
    async (p = 1, append = false) => {
      if (!id || !isLoggedIn()) return;
      try {
        const res = await api.get<{ list: CheckinRecord[]; total: number }>(
          `/api/checkin/records/${id}`,
          { page: p, size: 20 }
        );
        const list = res?.list || [];
        setRecords((prev) => (append ? [...prev, ...list] : list));
        setHasMore((p - 1) * 20 + list.length < (res?.total || 0));
        setPage(p);
      } catch {
        /* silent */
      }
    },
    [id]
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setRecords([]);
    setPage(1);
    setHasMore(true);
    setTodayDone(false);
    setJoined(false);
    setCheckinOpen(false);
    setCheckinContent("");
    setSubmitting(false);
    await Promise.all([loadDetail(), isLoggedIn() ? loadRecords(1) : Promise.resolve()]);
    setLoading(false);
  }, [loadDetail, loadRecords]);

  useDidShow(() => {
    loadPage();
  });

  const openCheckinPopup = () => {
    setCheckinContent("");
    setCheckinOpen(true);
  };

  const submitCheckin = async () => {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/api/checkin/join", {
        checkinId: Number(id),
        content: checkinContent.trim(),
      });
      Taro.showToast({ title: "打卡成功", icon: "success" });
      setTodayDone(true);
      setJoined(true);
      setCheckinOpen(false);
      loadRecords(1);
      loadDetail();
    } catch {
      Taro.showToast({ title: "打卡失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = () => {
    if (hasMore) {
      loadRecords(page + 1, true);
    }
  };


  if (loading) {
    return (
      <View className="min-h-screen bg-gray-1 flex items-center justify-center">
        <Text className="text-sm text-gray-4">加载中...</Text>
      </View>
    );
  }

  if (loadError || !detail) {
    return (
      <View className="min-h-screen bg-gray-1 flex flex-col items-center justify-center px-8">
        <Text className="text-sm text-gray-4 mb-4">{loadError || "任务不存在"}</Text>
        <View
          className="rounded-full bg-primary-6 px-5 py-2 active:opacity-80"
          onClick={loadPage}
        >
          <Text className="text-sm font-medium text-white">重试</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* Task info card */}
      <View className="mx-3 mt-3 bg-white rounded-xl shadow-sm p-4">
        <Text className="block text-lg font-bold text-gray-8 mb-2">
          {detail.title}
        </Text>
        {detail.desc && (
          <Text className="block text-sm text-gray-6 mb-3 leading-relaxed">
            {detail.desc}
          </Text>
        )}
        <View className="flex items-center mb-3">
          <Image
            className="w-8 h-8 rounded-full mr-2"
            src={resolveImageUrl(detail.creator_avatar) || "https://via.placeholder.com/160"}
            mode="aspectFill"
          />
          <Text className="text-sm text-gray-6">{detail.creator_name}</Text>
        </View>
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-3">
            <Text className="text-xs text-gray-4">
              {detail.join_cnt} 人参与
            </Text>
            {detail.supervisor_name && (
              <Text className="text-xs text-gray-4">
                监督人: {detail.supervisor_name}
              </Text>
            )}
          </View>
          <Text className="text-xs text-gray-4">
            {formatRelativeTimestamp(detail.created_at)}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View className="mx-3 mt-3 flex gap-3">
        {!joined ? (
          <View
            className="flex-1 bg-primary-6 rounded-xl py-3 flex items-center justify-center active:opacity-80"
            onClick={openCheckinPopup}
          >
            <Text className="text-white text-sm font-medium">加入任务</Text>
          </View>
        ) : todayDone ? (
          <View className="flex-1 bg-gray-2 rounded-xl py-3 flex items-center justify-center">
            <Text className="text-gray-4 text-sm font-medium">
              今日已打卡 ✓
            </Text>
          </View>
        ) : (
          <View
            className="flex-1 bg-green-6 rounded-xl py-3 flex items-center justify-center active:opacity-80"
            onClick={openCheckinPopup}
          >
            <Text className="text-white text-sm font-medium">打卡</Text>
          </View>
        )}
      </View>

      {/* Records timeline */}
      <View className="mx-3 mt-4 mb-2">
        <Text className="text-base font-bold text-gray-8">打卡记录</Text>
      </View>

      {records.length === 0 ? (
        <View className="mx-3 bg-white rounded-xl shadow-sm py-12 flex items-center justify-center">
          <Text className="text-sm text-gray-4">暂无打卡记录</Text>
        </View>
      ) : (
        <View className="mx-3">
          {records.map((record, idx) => (
            <View
              key={record.id}
              className="bg-white rounded-xl shadow-sm p-4 mb-3 relative"
            >
              {/* User row */}
              <View className="flex items-center mb-2">
                <Image
                  className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                  src={resolveImageUrl(record.user_avatar) || "https://via.placeholder.com/160"}
                  mode="aspectFill"
                />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-8">
                    {record.user_name}
                  </Text>
                </View>
                <Text className="text-xs text-gray-4">
                  {formatRelativeTimestamp(record.created_at)}
                </Text>
              </View>

              {/* Content */}
              <Text className="block text-sm text-gray-6 leading-relaxed mb-2">
                {record.content}
              </Text>

              {/* Optional image */}
              {record.image && (
                <Image
                  className="w-full h-40 rounded-lg mb-2"
                  src={record.image}
                  mode="aspectFill"
                  onClick={() =>
                    Taro.previewImage({
                      current: record.image,
                      urls: [record.image],
                    })
                  }
                />
              )}

              {/* Duration */}
              {record.duration > 0 && (
                <Text className="text-xs text-primary-6 mb-2">
                  学习 {record.duration} 分钟
                </Text>
              )}

              {/* Supervisor comment */}
              {record.comment && (
                <View className="bg-gray-1 rounded-lg p-3 mt-1">
                  <Text className="text-xs text-gray-4 mb-1 block">
                    {record.comment_by} 点评:
                  </Text>
                  <Text className="text-sm text-gray-6">
                    {record.comment}
                  </Text>
                </View>
              )}

              {/* Timeline dot connector (visual) */}
              {idx < records.length - 1 && (
                <View className="absolute left-7 bottom-0 w-0.5 h-3 bg-gray-2" />
              )}
            </View>
          ))}

          {/* Load more */}
          {hasMore && (
            <View
              className="py-3 flex items-center justify-center"
              onClick={loadMore}
            >
              <Text className="text-xs text-primary-6">加载更多</Text>
            </View>
          )}
          {!hasMore && records.length > 0 && (
            <View className="py-3 flex items-center justify-center">
              <Text className="text-xs text-gray-4">没有更多了</Text>
            </View>
          )}
        </View>
      )}

      <InputPopup
        open={checkinOpen}
        value={checkinContent}
        title={joined ? "打卡内容" : "加入任务"}
        placeholder="输入打卡内容..."
        buttonText={submitting ? "提交中..." : "提交"}
        maxLength={2000}
        onClose={() => setCheckinOpen(false)}
        onChange={setCheckinContent}
        onSubmit={submitCheckin}
        isLoading={submitting}
        isDisabled={submitting}
      />
    </View>
  );
}
