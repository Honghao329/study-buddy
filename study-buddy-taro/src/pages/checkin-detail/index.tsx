import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { Avatar, Button, Cell, Divider, Empty, Tag } from "@taroify/core";
import { ClockOutlined, FireOutlined } from "@taroify/icons";
import { api, isLoggedIn } from "~/api/request";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";
import InputPopup from "~/components/InputPopup";
import { resolveImageUrl } from "~/utils/imageUrl";

interface CheckinDetail {
  id: number;
  title: string;
  description: string;
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
      <View className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8FA" }}>
        <Text className="text-sm" style={{ color: "#999" }}>加载中...</Text>
      </View>
    );
  }

  if (loadError || !detail) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "#F7F8FA" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>{loadError || "任务不存在"}</Empty.Description>
        </Empty>
        <Button
          color="primary"
          shape="round"
          size="small"
          style={{ marginTop: "16px", background: "#58CC02", borderColor: "#58CC02" }}
          onClick={loadPage}
        >
          重试
        </Button>
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-40" style={{ background: "#F7F8FA" }}>
      {/* Hero header with gradient */}
      <View
        className="px-4 pt-4 pb-6"
        style={{
          background: "linear-gradient(135deg, #58CC02 0%, #46a302 100%)",
          borderRadius: "0 0 24px 24px",
        }}
      >
        <Text className="block text-xl font-bold text-white mb-2 leading-snug">
          {detail.title}
        </Text>
        {detail.description && (
          <Text className="block text-sm text-white mb-3 leading-relaxed" style={{ opacity: 0.85 }}>
            {detail.description}
          </Text>
        )}
        <View className="flex items-center gap-3 mt-3">
          <Tag color="primary" shape="round" size="medium" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderColor: "transparent" }}>
            {detail.join_cnt} 人参与
          </Tag>
          {detail.supervisor_name && (
            <Tag shape="round" size="medium" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderColor: "transparent" }}>
              监督: {detail.supervisor_name}
            </Tag>
          )}
        </View>
      </View>

      {/* Creator info card */}
      <View
        className="mx-3 -mt-4 bg-white rounded-2xl p-4"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
      >
        <Cell
          style={{ padding: 0 }}
          title={
            <View className="flex items-center">
              <Avatar
                src={resolveImageUrl(detail.creator_avatar)}
                size="small"
                shape="circle"
                style={{ marginRight: "10px" }}
              />
              <View>
                <Text className="block text-sm font-medium" style={{ color: "#333" }}>
                  {detail.creator_name}
                </Text>
                <Text className="block text-xs" style={{ color: "#999", marginTop: "2px" }}>
                  创建于 {formatRelativeTimestamp(detail.created_at)}
                </Text>
              </View>
            </View>
          }
        />
      </View>

      {/* Action button */}
      <View className="mx-3 mt-4">
        {!joined ? (
          <Button
            color="primary"
            shape="round"
            block
            size="large"
            style={{
              background: "#1CB0F6",
              borderColor: "#1CB0F6",
              fontWeight: 600,
              fontSize: "16px",
              boxShadow: "0 4px 12px rgba(28,176,246,0.3)",
            }}
            onClick={openCheckinPopup}
          >
            加入任务
          </Button>
        ) : todayDone ? (
          <Button
            shape="round"
            block
            size="large"
            disabled
            style={{
              background: "#E8F5E9",
              borderColor: "#E8F5E9",
              color: "#58CC02",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            今日已打卡
          </Button>
        ) : (
          <Button
            color="success"
            shape="round"
            block
            size="large"
            style={{
              background: "#58CC02",
              borderColor: "#58CC02",
              fontWeight: 600,
              fontSize: "16px",
              boxShadow: "0 4px 12px rgba(88,204,2,0.3)",
            }}
            onClick={openCheckinPopup}
          >
            打卡
          </Button>
        )}
      </View>

      {/* Records section header */}
      <View className="mx-3 mt-5 mb-3 flex items-center justify-between">
        <View className="flex items-center">
          <View
            className="w-1 h-4 rounded-full mr-2"
            style={{ background: "#58CC02" }}
          />
          <Text className="text-base font-bold" style={{ color: "#333" }}>
            打卡记录
          </Text>
        </View>
        {records.length > 0 && (
          <Tag color="primary" variant="outlined" shape="round" size="small" style={{ color: "#58CC02", borderColor: "#58CC02" }}>
            共 {records.length} 条
          </Tag>
        )}
      </View>

      {/* Records list */}
      {records.length === 0 ? (
        <View
          className="mx-3 bg-white rounded-2xl py-8"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <Empty>
            <Empty.Image />
            <Empty.Description>暂无打卡记录</Empty.Description>
          </Empty>
        </View>
      ) : (
        <View className="mx-3">
          {records.map((record, idx) => (
            <View key={record.id}>
              <View
                className="bg-white rounded-2xl p-4 mb-3"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
              >
                {/* User row */}
                <View className="flex items-center mb-3">
                  <Avatar
                    src={resolveImageUrl(record.user_avatar)}
                    size="small"
                    shape="circle"
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  />
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-medium truncate" style={{ color: "#333" }}>
                      {record.user_name}
                    </Text>
                  </View>
                  <Text className="text-xs" style={{ color: "#bbb" }}>
                    {formatRelativeTimestamp(record.created_at)}
                  </Text>
                </View>

                {/* Content */}
                <Text className="block text-sm leading-relaxed mb-2" style={{ color: "#666" }}>
                  {record.content}
                </Text>

                {/* Optional image */}
                {record.image && (
                  <Image
                    className="w-full rounded-xl mb-2"
                    style={{ height: "160px" }}
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

                {/* Duration tag */}
                {record.duration > 0 && (
                  <View className="flex items-center mb-2">
                    <Tag
                      color="primary"
                      shape="round"
                      size="small"
                      style={{
                        background: "rgba(88,204,2,0.1)",
                        color: "#58CC02",
                        borderColor: "transparent",
                      }}
                    >
                      <ClockOutlined size="12" style={{ marginRight: "4px" }} />
                      学习 {record.duration} 分钟
                    </Tag>
                  </View>
                )}

                {/* Supervisor comment */}
                {record.comment && (
                  <View
                    className="rounded-xl p-3 mt-2"
                    style={{ background: "#FFF9F0", border: "1px solid #FFE8CC" }}
                  >
                    <View className="flex items-center mb-1">
                      <FireOutlined size="14" style={{ color: "#FF9500", marginRight: "4px" }} />
                      <Text className="text-xs font-medium" style={{ color: "#FF9500" }}>
                        {record.comment_by} 点评
                      </Text>
                    </View>
                    <Text className="text-sm leading-relaxed" style={{ color: "#666" }}>
                      {record.comment}
                    </Text>
                  </View>
                )}
              </View>

              {/* Divider between records */}
              {idx < records.length - 1 && (
                <Divider style={{ margin: "0 0 12px 0", borderColor: "transparent" }} />
              )}
            </View>
          ))}

          {/* Load more / end */}
          {hasMore ? (
            <View className="py-3 flex items-center justify-center" onClick={loadMore}>
              <Button
                variant="text"
                size="small"
                style={{ color: "#1CB0F6" }}
              >
                加载更多
              </Button>
            </View>
          ) : records.length > 0 ? (
            <Divider style={{ color: "#ccc", fontSize: "12px" }}>没有更多了</Divider>
          ) : null}
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
