import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useMemo, useState } from "react";
import { Avatar, Button, Cell, Empty, Loading, NoticeBar, Tag } from "@taroify/core";
import { Arrow, Bell } from "@taroify/icons";
import { api, isLoggedIn } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

interface SignStats {
  streak: number;
  totalDays: number;
  totalDuration: number;
  todaySigned: boolean;
}

interface Task {
  id: number;
  title: string;
  join_cnt: number;
  _joined: boolean;
}

interface Activity {
  avatar?: string;
  text: string;
  time: string;
  icon?: string;
  color?: string;
}

interface Note {
  id: number;
  title: string;
  content?: string;
  user_name: string;
  user_pic: string;
  like_cnt: number;
  view_cnt: number;
  comment_cnt: number;
}

type SectionStatus = "idle" | "loading" | "success" | "error";

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 6) return { text: "夜深了", emoji: "🌙" };
  if (h < 12) return { text: "早上好", emoji: "🌅" };
  if (h < 14) return { text: "中午好", emoji: "☀️" };
  if (h < 18) return { text: "下午好", emoji: "🌤" };
  return { text: "晚上好", emoji: "🌙" };
}

export default function IndexPage() {
  const [logged, setLogged] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [signStats, setSignStats] = useState<SignStats>({
    streak: 0,
    totalDays: 0,
    totalDuration: 0,
    todaySigned: false,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayDone, setTodayDone] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [signStatus, setSignStatus] = useState<SectionStatus>("idle");
  const [taskStatus, setTaskStatus] = useState<SectionStatus>("idle");
  const [activityStatus, setActivityStatus] = useState<SectionStatus>("idle");
  const [noteStatus, setNoteStatus] = useState<SectionStatus>("idle");
  const [homeError, setHomeError] = useState("");

  const greeting = useMemo(() => getGreeting(), []);

  const loadAll = useCallback(async () => {
    setPageLoading(true);
    setHomeError("");
    setSignStatus("loading");
    setTaskStatus("loading");
    setActivityStatus("loading");
    setNoteStatus("loading");

    const [signRes, checkinRes, noteRes, activityRes, unreadRes] = await Promise.allSettled([
      api.get("/api/sign/stats"),
      api.get("/api/checkin/list", { page: 1, size: 10 }),
      api.get("/api/note/public_list", { page: 1, size: 5, sort: "hot" }),
      api.get("/api/home/activity"),
      api.get("/api/message/unread_count"),
    ]);

    let failedCount = 0;

    if (signRes.status === "fulfilled") {
      const sign = signRes.value || {};
      setSignStats({
        streak: sign.streak || 0,
        totalDays: sign.totalDays || 0,
        totalDuration: sign.totalDuration || 0,
        todaySigned: !!sign.todaySigned,
      });
      setSignStatus("success");
    } else {
      failedCount += 1;
      setSignStatus("error");
    }

    if (checkinRes.status === "fulfilled") {
      const taskList = checkinRes.value?.list || [];
      let doneIds: number[] = [];
      if (taskList.length) {
        try {
          doneIds = await api.get("/api/checkin/today_done_ids");
        } catch {
          doneIds = [];
        }
      }
      const mapped = taskList.map((t: any) => ({ ...t, _joined: doneIds.includes(t.id) }));
      setTasks(mapped);
      setTodayDone(mapped.filter((t: Task) => t._joined).length);
      setTaskStatus("success");
    } else {
      failedCount += 1;
      setTasks([]);
      setTodayDone(0);
      setTaskStatus("error");
    }

    if (noteRes.status === "fulfilled") {
      setNotes(noteRes.value?.list || []);
      setNoteStatus("success");
    } else {
      failedCount += 1;
      setNotes([]);
      setNoteStatus("error");
    }

    if (activityRes.status === "fulfilled") {
      const items = Array.isArray(activityRes.value) ? activityRes.value : [];
      setActivities(items);
      setActivityStatus("success");
    } else {
      failedCount += 1;
      setActivities([]);
      setActivityStatus("error");
    }

    if (unreadRes.status === "fulfilled") {
      setUnread(Number(unreadRes.value) || 0);
    } else {
      setUnread(0);
    }

    if (failedCount >= 3) {
      setHomeError("首页数据同步失败，当前看到的不是完整内容。");
    }
    setPageLoading(false);
  }, []);

  useDidShow(() => {
    const l = isLoggedIn();
    setLogged(l);
    if (l) loadAll();
  });

  const goLogin = () => Taro.navigateTo({ url: "/pages/login/index" });
  const goMessages = () => Taro.navigateTo({ url: "/pages/messages/index" });
  const goCheckin = (id: number) => Taro.navigateTo({ url: `/pages/checkin-detail/index?id=${id}` });
  const goNote = (id: number) => Taro.navigateTo({ url: `/pages/note-detail/index?id=${id}` });
  const goSign = () => Taro.navigateTo({ url: "/pages/sign/index" });
  const goCheckinList = () => Taro.switchTab({ url: "/pages/checkin-list/index" });

  const onSignTap = () => {
    goSign();
  };

  const quickSign = async () => {
    if (!logged || signStats.todaySigned) {
      goSign();
      return;
    }

    try {
      await api.post("/api/sign/do", {
        duration: 30,
        status: "normal",
        content: "",
      });
      Taro.showToast({ title: "已快速签到", icon: "success" });
      loadAll();
    } catch {
      Taro.showToast({ title: "快速签到失败", icon: "none" });
    }
  };

  const renderSectionState = ({
    title,
    description,
    actionText,
    onAction,
    compact = false,
  }: {
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
    compact?: boolean;
  }) => (
    <View
      className={`rounded-2xl bg-white ${compact ? "px-4 py-5" : "px-4 py-7"}`}
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      <Text className="block text-base font-bold text-[#1a1a1a] text-center">{title}</Text>
      <Text className="block text-sm text-[#999] text-center mt-2 leading-6">{description}</Text>
      {actionText && onAction && (
        <View className="flex justify-center mt-4">
          <Button
            size="small"
            round
            style={{
              background: "#1CB0F6",
              color: "#fff",
              border: "none",
              padding: "0 18px",
            }}
            onClick={onAction}
          >
            {actionText}
          </Button>
        </View>
      )}
    </View>
  );

  /* ---------- Not logged in ---------- */
  if (!logged) {
    return (
      <View
        className="min-h-100vh flex flex-col items-center justify-center px-6 pb-20"
        style={{ background: "linear-gradient(160deg, #58CC02 0%, #1CB0F6 100%)" }}
      >
        {/* Floating decorative circles */}
        <View
          className="absolute top-10 left-6 w-20 h-20 rounded-full opacity-15"
          style={{ background: "#fff" }}
        />
        <View
          className="absolute top-40 right-8 w-12 h-12 rounded-full opacity-10"
          style={{ background: "#fff" }}
        />
        <View
          className="absolute bottom-40 left-10 w-16 h-16 rounded-full opacity-10"
          style={{ background: "#fff" }}
        />

        {/* Logo area */}
        <View className="flex flex-col items-center mb-10">
          <Text className="text-6xl mb-4">📖</Text>
          <Text
            className="text-3xl font-extrabold mb-2"
            style={{ color: "#fff" }}
          >
            Study Buddy
          </Text>
          <Text
            className="text-base opacity-90"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            签到打卡 · 结交伙伴 · 共同成长
          </Text>
        </View>

        {/* Login card */}
        <View
          className="w-full rounded-3xl px-6 py-8 flex flex-col items-center"
          style={{
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <View className="flex items-center gap-2 mb-2">
            <Text className="text-xl">🌱</Text>
            <Text className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
              开启你的学习之旅
            </Text>
          </View>
          <Text className="text-sm mb-6" style={{ color: "#999" }}>
            每天进步一点点，遇见更好的自己
          </Text>
          <Button
            className="w-full"
            style={{
              background: "linear-gradient(135deg, #58CC02 0%, #46a302 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              height: "48px",
              fontSize: "16px",
              fontWeight: "600",
              boxShadow: "0 4px 16px rgba(88,204,2,0.35)",
            }}
            onClick={goLogin}
          >
            立即登录
          </Button>
        </View>
      </View>
    );
  }

  /* ---------- Logged in ---------- */
  return (
    <View className="min-h-100vh pb-6" style={{ background: "#F7F8FA" }}>
      {/* ====== Top greeting ====== */}
      <View className="px-5 pt-4 pb-3" style={{ background: "#fff" }}>
        <View className="flex items-center justify-between">
          <View>
            <Text className="block text-lg font-bold" style={{ color: "#1a1a1a" }}>
              {greeting.emoji} {greeting.text}
            </Text>
            <Text className="block text-xs mt-1" style={{ color: "#bbb" }}>
              今天也要加油哦
            </Text>
          </View>
          <View className="relative" onClick={goMessages}>
            <View
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#F5F5F5" }}
            >
              <Bell size="18" color="#666" />
            </View>
            {unread > 0 && (
              <View
                className="absolute flex items-center justify-center"
                style={{
                  top: "-3px", right: "-3px",
                  minWidth: "16px", height: "16px", borderRadius: "8px",
                  background: "#FF4D4F", border: "2px solid #fff", padding: "0 3px",
                }}
              >
                <Text className="text-white font-bold" style={{ fontSize: "9px" }}>
                  {unread > 99 ? "99+" : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="px-4 pt-3">
        {homeError && (
          <View className="mb-3 rounded-2xl px-4 py-3" style={{ background: "#FFF7E6", border: "1px solid #FFE7BA" }}>
            <Text className="block text-sm font-medium text-[#D46B08]">{homeError}</Text>
            <Text className="block text-xs text-[#AD6800] mt-1">可先浏览已加载内容，也可以重新同步。</Text>
            <View className="mt-3">
              <Button
                size="small"
                round
                style={{ background: "#FF9500", color: "#fff", border: "none" }}
                onClick={loadAll}
              >
                重新同步
              </Button>
            </View>
          </View>
        )}

        {/* ====== Sign-in card ====== */}
        {signStatus === "loading" && pageLoading ? (
          <View
            className="rounded-2xl px-4 py-5 mb-3 flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <Loading type="spinner" style={{ color: "#FF9500" }}>
              正在同步签到状态...
            </Loading>
          </View>
        ) : signStatus === "error" ? (
          <View className="mb-3">
            {renderSectionState({
              title: "签到数据暂时不可用",
              description: "连续签到和今日状态没有拉到，先重试这块信息。",
              actionText: "重新加载",
              onAction: loadAll,
              compact: true,
            })}
          </View>
        ) : (
          <View
            className="rounded-2xl px-4 py-3.5 mb-3"
            style={{
              background: "#fff",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              borderLeft: signStats.todaySigned ? "3px solid #58CC02" : "3px solid #FF9500",
            }}
            onClick={onSignTap}
          >
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3 min-w-0 flex-1">
                <Text className="text-xl">🔥</Text>
                <View className="min-w-0">
                  <View className="flex items-center gap-1">
                    <Text className="text-lg font-bold" style={{ color: signStats.todaySigned ? "#58CC02" : "#FF9500" }}>
                      {signStats.streak || 0}
                    </Text>
                    <Text className="text-sm" style={{ color: "#333" }}>天连续</Text>
                    <Text className="text-xs" style={{ color: "#ccc", margin: "0 4px" }}>·</Text>
                    <Text className="text-xs" style={{ color: "#999" }}>累计{signStats.totalDays || 0}天</Text>
                  </View>
                </View>
              </View>
              <View className="shrink-0 flex items-center gap-2">
                {!signStats.todaySigned ? (
                  <Button
                    round
                    size="small"
                    style={{
                      background: "linear-gradient(135deg, #FF9500 0%, #F97316 100%)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      boxShadow: "0 4px 12px rgba(249,115,22,0.24)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      quickSign();
                    }}
                  >
                    快速签到
                  </Button>
                ) : (
                  <Text className="text-sm shrink-0" style={{ color: "#58CC02", fontWeight: "500" }}>
                    已签到 ✓
                  </Text>
                )}
                <View
                  className="flex items-center shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSignTap();
                  }}
                >
                  <Text className="text-xs" style={{ color: "#999" }}>
                    完整页
                  </Text>
                  <Arrow style={{ marginLeft: "2px" }} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ====== Unread messages notice bar ====== */}
        {unread > 0 && (
          <View className="mb-3">
            <NoticeBar
              style={{
                borderRadius: "14px",
                background: "linear-gradient(135deg, #FFF8E6, #FFF3D6)",
                color: "#FF9500",
                fontWeight: "500",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              }}
              onClick={goMessages}
            >
              <NoticeBar.Icon>
                <Bell />
              </NoticeBar.Icon>
              你有 {unread} 条未读消息，点击查看
            </NoticeBar>
          </View>
        )}

        {/* ====== Today's checkin tasks ====== */}
        {taskStatus === "loading" && pageLoading && (
          <View
            className="mb-4 rounded-2xl bg-white px-4 py-6 flex items-center justify-center"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <Loading type="spinner" style={{ color: "#1CB0F6" }}>
              正在加载今日打卡...
            </Loading>
          </View>
        )}

        {taskStatus === "success" && tasks.length > 0 && (
          <View className="mb-4">
            <View className="flex justify-between items-center mb-3 px-1">
              <View className="flex items-center gap-2">
                <Text className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
                  今日打卡
                </Text>
                <Tag
                  size="small"
                  style={{
                    background:
                      todayDone === tasks.length
                        ? "linear-gradient(135deg, #58CC02, #46a302)"
                        : "rgba(28,176,246,0.1)",
                    color: todayDone === tasks.length ? "#fff" : "#1CB0F6",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                  }}
                >
                  {todayDone}/{tasks.length}
                </Tag>
              </View>
              {/* Progress dots */}
              <View className="flex items-center gap-1">
                {tasks.map((t) => (
                  <View
                    key={t.id}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: t._joined ? "#58CC02" : "#E0E0E0",
                      transition: "background 0.3s",
                    }}
                  />
                ))}
              </View>
            </View>

            <Cell.Group
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              }}
            >
              {tasks.map((t) => (
                <Cell
                  key={t.id}
                  clickable
                  style={{
                    opacity: t._joined ? 0.6 : 1,
                    padding: "14px 16px",
                  }}
                  icon={
                    <View
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: t._joined ? "#58CC02" : "transparent",
                        border: t._joined ? "2px solid #58CC02" : "2px solid #D0D0D0",
                        marginRight: "12px",
                      }}
                    >
                      {t._joined && (
                        <Text className="text-white font-bold" style={{ fontSize: "12px", lineHeight: "1" }}>
                          ✓
                        </Text>
                      )}
                    </View>
                  }
                  title={
                    <Text
                      className="font-medium"
                      style={{
                        color: t._joined ? "#999" : "#1a1a1a",
                        textDecoration: t._joined ? "line-through" : "none",
                        fontSize: "15px",
                      }}
                    >
                      {t.title}
                    </Text>
                  }
                  brief={
                    <View className="flex items-center gap-1 mt-0.5">
                      <Text style={{ color: "#bbb", fontSize: "12px" }}>
                        {t.join_cnt || 0}人参与
                      </Text>
                    </View>
                  }
                  isLink
                  onClick={() => goCheckin(t.id)}
                />
              ))}
            </Cell.Group>
          </View>
        )}

        {/* ====== Empty state for tasks ====== */}
        {taskStatus === "error" && (
          <View className="mb-4">
            {renderSectionState({
              title: "打卡任务加载失败",
              description: "任务清单没有拉到，先刷新看看，避免把异常当成空列表。",
              actionText: "重试任务列表",
              onAction: loadAll,
            })}
          </View>
        )}

        {taskStatus === "success" && tasks.length === 0 && (
          <View
            className="mb-4 rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
            }}
            onClick={goCheckinList}
          >
            <Empty>
              <Empty.Image
                style={{ width: "120px", height: "120px" }}
              />
              <Empty.Description>
                <Text style={{ color: "#999", fontSize: "14px" }}>
                  还没有加入打卡任务
                </Text>
              </Empty.Description>
            </Empty>
            <View className="flex justify-center pb-5">
              <Button
                size="small"
                style={{
                  background: "linear-gradient(135deg, #58CC02, #46a302)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "999px",
                  padding: "6px 24px",
                  fontWeight: "600",
                  boxShadow: "0 3px 12px rgba(88,204,2,0.25)",
                }}
              >
                去看看有哪些任务
                <Arrow style={{ marginLeft: "4px" }} />
              </Button>
            </View>
          </View>
        )}

        {/* ====== Recent activity feed ====== */}
        {activityStatus === "error" && (
          <View className="mb-4">
            {renderSectionState({
              title: "动态流暂时不可用",
              description: "社区动态接口当前失败，不是没有内容。",
              actionText: "重试动态",
              onAction: loadAll,
            })}
          </View>
        )}

        {activityStatus === "success" && activities.length > 0 && (
          <View className="mb-4">
            <View className="flex justify-between items-center mb-3 px-1">
              <Text className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
                最新动态
              </Text>
              <View className="flex items-center gap-0.5">
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#58CC02" }}
                />
                <Text style={{ color: "#999", fontSize: "12px", marginLeft: "4px" }}>
                  实时更新
                </Text>
              </View>
            </View>

            <Cell.Group
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              }}
            >
              {activities.map((a, i) => (
                <Cell
                  key={i}
                  style={{ padding: "12px 16px" }}
                  icon={
                    a.avatar ? (
                      <Avatar
                        src={resolveImageUrl(a.avatar) || ""}
                        style={{
                          width: "32px",
                          height: "32px",
                          marginRight: "10px",
                        }}
                      />
                    ) : (
                      <View
                        className="shrink-0 rounded-full"
                        style={{
                          width: "32px",
                          height: "32px",
                          background: `linear-gradient(135deg, ${a.color || "#1CB0F6"}, ${a.color || "#0d8ecf"})`,
                          marginRight: "10px",
                        }}
                      />
                    )
                  }
                  title={
                    <Text
                      className="truncate"
                      style={{ color: "#555", fontSize: "14px" }}
                    >
                      {a.text}
                    </Text>
                  }
                >
                  <Text style={{ color: "#ccc", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {a.time}
                  </Text>
                </Cell>
              ))}
            </Cell.Group>
          </View>
        )}

        {/* ====== Hot notes ====== */}
        {noteStatus === "error" && (
          <View className="mb-4">
            {renderSectionState({
              title: "热门笔记加载失败",
              description: "推荐内容没拉到，先重试，不要把异常误判成没人发笔记。",
              actionText: "重试推荐",
              onAction: loadAll,
            })}
          </View>
        )}

        {noteStatus === "success" && notes.length > 0 && (
          <View className="mb-4">
            <View className="flex justify-between items-center mb-3 px-1">
              <View className="flex items-center gap-2">
                <Text className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
                  热门笔记
                </Text>
                <Text className="text-lg">🔥</Text>
              </View>
              <Text
                style={{ color: "#1CB0F6", fontSize: "14px", fontWeight: "500" }}
                onClick={() => Taro.switchTab({ url: "/pages/community/index" })}
              >
                更多
                <Arrow style={{ marginLeft: "2px" }} />
              </Text>
            </View>

            {notes.map((n) => (
              <View
                key={n.id}
                className="mb-3 rounded-2xl overflow-hidden"
                style={{
                  background: "#fff",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                }}
                onClick={() => goNote(n.id)}
              >
                <View className="px-4 pt-4 pb-3">
                  {/* Author row */}
                  <View className="flex items-center gap-2.5 mb-3">
                    <Avatar
                      src={resolveImageUrl(n.user_pic) || ""}
                      style={{
                        width: "28px",
                        height: "28px",
                      }}
                    />
                    <Text style={{ color: "#888", fontSize: "13px" }}>
                      {n.user_name || "匿名"}
                    </Text>
                  </View>

                  {/* Title */}
                  <Text
                    className="block line-clamp-2"
                    style={{
                      color: "#1a1a1a",
                      fontSize: "16px",
                      fontWeight: "600",
                      lineHeight: "1.5",
                    }}
                  >
                    {n.title}
                  </Text>

                  {/* Content preview */}
                  {n.content && (
                    <Text
                      className="block line-clamp-2 mt-1.5"
                      style={{
                        color: "#999",
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    >
                      {n.content}
                    </Text>
                  )}

                  {/* Stats row */}
                  <View className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #f5f5f5" }}>
                    <Text style={{ color: "#999", fontSize: "12px" }}>👍 {n.like_cnt || 0}</Text>
                    <Text style={{ color: "#999", fontSize: "12px" }}>👁 {n.view_cnt || 0}</Text>
                    <Text style={{ color: "#999", fontSize: "12px" }}>💬 {n.comment_cnt || 0}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {noteStatus === "success" && notes.length === 0 && (
          <View className="mb-4">
            {renderSectionState({
              title: "还没有热门笔记",
              description: "社区还没出现可推荐的公开内容，可以先去社区逛逛或发布一篇。",
              actionText: "去社区看看",
              onAction: () => Taro.switchTab({ url: "/pages/community/index" }),
            })}
          </View>
        )}

        {/* Bottom breathing room */}
        <View className="h-4" />
      </View>
    </View>
  );
}
