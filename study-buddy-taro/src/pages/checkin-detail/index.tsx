import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useReachBottom } from "@tarojs/taro";
import { useCallback, useMemo, useRef, useState } from "react";
import { Avatar, Button, Empty, Loading, Tag } from "@taroify/core";

import InputPopup from "~/components/InputPopup";
import { api, isLoggedIn } from "~/api/request";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";
import { resolveImageUrl } from "~/utils/imageUrl";

interface CheckinDetail {
  id: number;
  title: string;
  description: string;
  join_cnt: number;
  view_cnt: number;
  creator_id: number;
  supervisor_id: number;
  supervisor_display_name: string;
  supervisor_avatar: string;
  created_at: string;
  has_supervisor?: boolean;
  is_supervisor?: boolean;
  is_joined?: boolean;
  my_total?: number;
  recent_users?: RecentUser[];
  start_date?: string;
  end_date?: string;
}

interface RecentUser {
  user_id: number;
  nickname: string;
  avatar: string;
  day: string;
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

interface CreatorProfile {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
  note_cnt: number;
  sign_days: number;
  checkin_cnt: number;
  partner_status: "none" | "pending" | "accepted";
  created_at: string;
}

const PAGE_SIZE = 20;

export default function CheckinDetailPage() {
  const { id } = Taro.getCurrentInstance().router?.params || {};
  const logged = isLoggedIn();

  const [detail, setDetail] = useState<CheckinDetail | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [joined, setJoined] = useState(false);
  const [todayDone, setTodayDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [recordsError, setRecordsError] = useState("");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinContent, setCheckinContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const loadingRef = useRef(false);

  const loadDetail = useCallback(async () => {
    if (!id) return null;
    const res = await api.get<CheckinDetail>(`/api/checkin/detail/${id}`);
    setDetail(res);
    setTodayDone(Boolean(res?.is_joined));
    setJoined(Boolean((res?.my_total || 0) > 0));
    return res;
  }, [id]);

  const loadCreator = useCallback(async (creatorId: number) => {
    if (!creatorId) {
      setCreator(null);
      return;
    }

    try {
      const res = await api.get<CreatorProfile>(`/api/user/profile/${creatorId}`);
      setCreator(res);
    } catch {
      setCreator(null);
    }
  }, []);

  const loadRecords = useCallback(
    async (nextPage = 1, append = false) => {
      if (!id || loadingRef.current) return;

      loadingRef.current = true;
      setRecordsLoading(true);
      setRecordsError("");
      try {
        const res = await api.get<{ list: CheckinRecord[]; total: number }>(
          `/api/checkin/records/${id}`,
          { page: nextPage, size: PAGE_SIZE },
        );
        const list = res.list || [];
        setRecords((prev) => (append ? [...prev, ...list] : list));
        setHasMore((nextPage - 1) * PAGE_SIZE + list.length < (res.total || 0));
        setPage(nextPage);
      } catch (error: any) {
        setRecordsError(error?.message || "打卡记录加载失败");
      } finally {
        loadingRef.current = false;
        setRecordsLoading(false);
      }
    },
    [id],
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setRecords([]);
    setPage(1);
    setHasMore(true);
    setJoined(false);
    setTodayDone(false);
    setCheckinOpen(false);
    setCheckinContent("");
    setSubmitting(false);
    setRecordsLoading(false);
    setRecordsError("");
    loadingRef.current = false;

    try {
      const detailRes = await loadDetail();
      if (detailRes) {
        await loadCreator(detailRes.creator_id);
      }

      await loadRecords(1, false);
    } catch (error: any) {
      const message = error?.message || "任务加载失败";
      setLoadError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [loadCreator, loadDetail, loadRecords]);

  useDidShow(() => {
    loadPage();
  });

  useReachBottom(() => {
    if (!loading && hasMore && !loadingRef.current && !recordsError) {
      loadRecords(page + 1, true);
    }
  });

  const goLogin = () => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent(
        `/pages/checkin-detail/index?id=${id}`,
      )}`,
    });
  };

  const openCheckinPopup = () => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      goLogin();
      return;
    }

    setCheckinContent("");
    setCheckinOpen(true);
  };

  const submitCheckin = async () => {
    if (!id || submitting) return;

    const cleanContent = checkinContent.trim();
    if (cleanContent.length < 5) {
      Taro.showToast({ title: "至少写 5 个字的打卡内容", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/checkin/join", {
        checkinId: Number(id),
        content: cleanContent,
      });
      Taro.showToast({ title: "打卡成功", icon: "success" });
      setCheckinOpen(false);
      setTodayDone(true);
      setJoined(true);
      await Promise.all([loadRecords(1, false), loadDetail()]);
    } catch (error: any) {
      Taro.showToast({ title: error?.message || "打卡失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  const reload = () => {
    loadPage();
  };

  const retryRecords = () => {
    loadRecords(1, false);
  };

  const ctaState = useMemo(() => {
    if (!logged) {
      return {
        label: "登录后参与",
        disabled: false,
        tone: "info",
      };
    }

    if (!joined) {
      return {
        label: "首次打卡并加入",
        disabled: false,
        tone: "info",
      };
    }

    if (todayDone) {
      return {
        label: "今日已打卡",
        disabled: true,
        tone: "neutral",
      };
    }

    return {
      label: "今日打卡",
      disabled: false,
      tone: "success",
    };
  }, [joined, logged, todayDone]);


  if (loading && !detail) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
        <Loading type="spinner" style={{ color: "#0F766E" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  if (loadError || !detail) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#F8FAFC" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>{loadError || "任务不存在"}</Empty.Description>
        </Empty>
        <Button
          round
          size="small"
          className="mt-4"
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)",
            color: "#fff",
            border: "none",
            fontWeight: 700,
          }}
          onClick={reload}
        >
          重试
        </Button>
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-10" style={{ background: "#F8FAFC" }}>
      <View className="px-4 pt-4">
        {/* Task title */}
        <Text className="block text-xl font-bold text-slate-900">{detail.title}</Text>

        {/* Description if exists */}
        {detail.description ? (
          <Text className="mt-1 block text-sm leading-5 text-slate-500">{detail.description}</Text>
        ) : null}

        {/* Creator + meta merged into one line */}
        <Text className="mt-2 block text-xs text-slate-400">
          创建人 {creator?.nickname || detail.supervisor_display_name || "未知"} · {detail.join_cnt || 0}人参与 · {formatRelativeTimestamp(detail.created_at)}
          {detail.supervisor_display_name ? ` · 监督 ${detail.supervisor_display_name}` : ""}
        </Text>

        {/* Compact action button */}
        <View className="mt-3 flex items-center gap-3">
          <Button
            shape="round"
            size="small"
            disabled={ctaState.disabled}
            style={{
              background: ctaState.disabled
                ? "#CBD5E1"
                : ctaState.tone === "success"
                  ? "linear-gradient(135deg, #16A34A 0%, #0F766E 100%)"
                  : "linear-gradient(135deg, #0F766E 0%, #0EA5E9 100%)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              padding: "0 20px",
            }}
            onClick={ctaState.disabled ? undefined : openCheckinPopup}
          >
            {ctaState.label}
          </Button>
          {joined && (
            <Text className="text-xs text-slate-400">
              我的记录 {detail.my_total || 0} 次
            </Text>
          )}
        </View>

        <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm" style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}>
          <Text className="block text-sm font-semibold text-slate-900">打卡记录</Text>
          <Text className="mt-1 block text-xs text-slate-500">
            这里展示所有参与者的记录、内容和监督反馈。
          </Text>

          {!logged ? (
            <View className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-5">
              <Text className="block text-sm font-medium text-sky-900">登录后可参与打卡</Text>
              <Text className="mt-1 block text-xs leading-5 text-sky-700">
                当前先展示任务概览和记录，登录后还能提交自己的打卡内容。
              </Text>
              <Button
                round
                size="small"
                className="mt-3"
                style={{
                  background: "#fff",
                  color: "#0369A1",
                  border: "1px solid rgba(3,105,161,0.12)",
                  fontWeight: 700,
                }}
                onClick={goLogin}
              >
                去登录
              </Button>
            </View>
          ) : recordsError && records.length === 0 && !recordsLoading ? (
            <View className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5">
              <Text className="block text-sm font-medium text-rose-900">打卡记录加载失败</Text>
              <Text className="mt-1 block text-xs leading-5 text-rose-700">{recordsError}</Text>
              <Button
                round
                size="small"
                className="mt-3"
                style={{
                  background: "#fff",
                  color: "#BE123C",
                  border: "1px solid rgba(190,24,93,0.12)",
                  fontWeight: 700,
                }}
                onClick={retryRecords}
              >
                重试
              </Button>
            </View>
          ) : records.length === 0 && !loading && !recordsLoading ? (
            <View className="mt-4">
              <Empty>
                <Empty.Image />
                <Empty.Description>还没有人完成打卡</Empty.Description>
              </Empty>
            </View>
          ) : (
            <View className="mt-4 space-y-3">
              {records.map((record) => (
                <View
                  key={record.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  style={{ boxShadow: "0 1px 6px rgba(15, 23, 42, 0.04)" }}
                >
                  <View className="flex items-center justify-between">
                    <View className="flex items-center min-w-0 flex-1">
                      <Avatar
                        src={resolveImageUrl(record.user_avatar)}
                        size="small"
                        style={{ flexShrink: 0 }}
                      />
                      <View className="ml-3 min-w-0">
                        <Text className="block truncate text-sm font-semibold text-slate-900">
                          {record.user_name || "匿名"}
                        </Text>
                        <Text className="block text-[11px] text-slate-400">
                          {formatRelativeTimestamp(record.created_at)}
                        </Text>
                      </View>
                    </View>
                    <Tag
                      shape="rounded"
                      size="small"
                      style={{
                        background: "rgba(15,118,110,0.10)",
                        color: "#0F766E",
                        borderColor: "transparent",
                      }}
                    >
                      {record.duration || 0} 分钟
                    </Tag>
                  </View>

                  <Text className="mt-3 block text-sm leading-6 text-slate-700">
                    {record.content || "没有填写文字记录。"}
                  </Text>

                  {record.image ? (
                    <Image
                      className="mt-3 w-full rounded-2xl"
                      style={{ height: "180px" }}
                      src={resolveImageUrl(record.image)}
                      mode="aspectFill"
                      onClick={() =>
                        Taro.previewImage({
                          current: resolveImageUrl(record.image),
                          urls: [resolveImageUrl(record.image)],
                        })
                      }
                    />
                  ) : null}

                  {record.comment ? (
                    <View className="mt-3 rounded-2xl bg-white px-3 py-3">
                      <Text className="block text-[11px] font-medium text-emerald-600">监督反馈</Text>
                      <Text className="mt-1 block text-sm leading-6 text-slate-700">
                        {record.comment}
                      </Text>
                      {record.comment_by ? (
                        <Text className="mt-2 block text-[11px] text-slate-400">
                          {record.comment_by}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {logged && recordsError && records.length > 0 ? (
            <View className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
              <Text className="block text-sm font-medium text-amber-900">更多记录暂时没拉下来</Text>
              <Text className="mt-1 block text-xs leading-5 text-amber-700">{recordsError}</Text>
              <Button
                round
                size="small"
                className="mt-3"
                style={{
                  background: "#fff",
                  color: "#92400E",
                  border: "1px solid rgba(146,64,14,0.12)",
                  fontWeight: 700,
                }}
                onClick={() => loadRecords(page + 1, true)}
              >
                重试加载更多
              </Button>
            </View>
          ) : null}

          {recordsLoading && records.length > 0 ? (
            <View className="py-4 flex justify-center">
              <Loading type="spinner" style={{ color: "#0F766E" }}>
                加载中...
              </Loading>
            </View>
          ) : null}

          {!recordsLoading && records.length > 0 && hasMore && !recordsError ? (
            <View className="pt-4 text-center">
              <Text className="text-xs text-slate-400">继续下滑加载更多记录</Text>
            </View>
          ) : null}
        </View>
      </View>

      <InputPopup
        open={checkinOpen}
        value={checkinContent}
        title={joined ? "今日打卡" : "首次打卡并加入"}
        placeholder="至少写 5 个字，记录今天的学习内容、时长或收获"
        buttonText="提交打卡"
        onClose={() => !submitting && setCheckinOpen(false)}
        onChange={setCheckinContent}
        onSubmit={submitCheckin}
        isLoading={submitting}
        isDisabled={ctaState.disabled || checkinContent.trim().length < 5}
      />
    </View>
  );
}
