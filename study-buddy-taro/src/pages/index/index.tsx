import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useMemo, useState } from "react";
import { Avatar, Badge, Button, Cell, Empty, NoticeBar, Tag } from "@taroify/core";
import { FireOutlined, Bell, Arrow } from "@taroify/icons";
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

  const greeting = useMemo(() => getGreeting(), []);

  const loadAll = useCallback(async () => {
    try {
      const [sign, checkins, noteRes, acts] = await Promise.all([
        api.get("/api/sign/stats").catch(() => ({})),
        api.get("/api/checkin/list", { page: 1, size: 10 }).catch(() => ({ list: [] })),
        api.get("/api/note/public_list", { page: 1, size: 5, sort: "hot" }).catch(() => ({ list: [] })),
        api.get("/api/home/activity").catch(() => []),
      ]);

      setSignStats({
        streak: sign.streak || 0,
        totalDays: sign.totalDays || 0,
        totalDuration: sign.totalDuration || 0,
        todaySigned: !!sign.todaySigned,
      });

      const taskList = checkins.list || [];
      let doneIds: number[] = [];
      if (taskList.length) {
        try {
          doneIds = await api.get("/api/checkin/today_done_ids");
        } catch {}
      }
      const mapped = taskList.map((t: any) => ({ ...t, _joined: doneIds.includes(t.id) }));
      setTasks(mapped);
      setTodayDone(mapped.filter((t: Task) => t._joined).length);
      setNotes(noteRes.list || []);
      setActivities(Array.isArray(acts) ? acts : []);

      try {
        const u = await api.get("/api/message/unread_count");
        setUnread(u || 0);
      } catch {}
    } catch {}
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
    <View
      className="min-h-100vh pb-6"
      style={{ background: "#F7F8FA" }}
    >
      {/* ====== Top header area with gradient ====== */}
      <View
        className="px-5 pt-4 pb-8"
        style={{
          background: "linear-gradient(135deg, #58CC02 0%, #43b700 50%, #1CB0F6 100%)",
          borderRadius: "0 0 24px 24px",
        }}
      >
        {/* Greeting row */}
        <View className="flex items-center justify-between mb-5">
          <View className="flex items-center gap-2">
            <Text className="text-2xl">{greeting.emoji}</Text>
            <View>
              <Text
                className="block text-xl font-bold"
                style={{ color: "#fff" }}
              >
                {greeting.text}
              </Text>
              <Text
                className="block text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                今天也要加油哦
              </Text>
            </View>
          </View>
          {/* Message bell */}
          <View className="relative" onClick={goMessages}>
            <View
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Bell size="20" color="#fff" />
            </View>
            {unread > 0 && (
              <View
                className="absolute flex items-center justify-center"
                style={{
                  top: "-4px",
                  right: "-4px",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  background: "#FF4D4F",
                  border: "2px solid #58CC02",
                  padding: "0 4px",
                }}
              >
                <Text className="text-white font-bold" style={{ fontSize: "10px" }}>
                  {unread > 99 ? "99+" : unread}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ====== Sign-in card (inside header) ====== */}
        <View
          className="rounded-2xl px-5 py-4"
          style={{
            background: signStats.todaySigned
              ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,255,230,0.95) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,245,230,0.95) 100%)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            backdropFilter: "blur(10px)",
          }}
          onClick={onSignTap}
        >
          <View className="flex items-center justify-between">
            {/* Left: streak info */}
            <View className="flex items-center gap-3 min-w-0 flex-1">
              {/* Fire icon container */}
              <View
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: signStats.todaySigned
                    ? "linear-gradient(135deg, #58CC02, #46a302)"
                    : "linear-gradient(135deg, #FF9500, #FF6B00)",
                  boxShadow: signStats.todaySigned
                    ? "0 3px 12px rgba(88,204,2,0.3)"
                    : "0 3px 12px rgba(255,149,0,0.3)",
                }}
              >
                <FireOutlined size="22" color="#fff" />
              </View>
              <View className="min-w-0">
                <View className="flex items-center gap-1.5">
                  <Text
                    className="text-xl font-extrabold"
                    style={{ color: signStats.todaySigned ? "#58CC02" : "#FF9500" }}
                  >
                    {signStats.streak || 0}
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: "#333" }}>
                    天连续
                  </Text>
                </View>
                <View className="flex items-center gap-2 mt-0.5">
                  <Tag
                    size="small"
                    style={{
                      background: "rgba(88,204,2,0.1)",
                      color: "#58CC02",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    累计{signStats.totalDays || 0}天
                  </Tag>
                  {signStats.totalDuration > 0 && (
                    <Tag
                      size="small"
                      style={{
                        background: "rgba(28,176,246,0.1)",
                        color: "#1CB0F6",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      {signStats.totalDuration}分钟
                    </Tag>
                  )}
                </View>
              </View>
            </View>

            {/* Right: sign button or badge */}
            {!signStats.todaySigned ? (
              <View
                className="shrink-0 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FF9500, #FF6B00)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "700",
                  padding: "8px 24px",
                  borderRadius: "999px",
                  boxShadow: "0 3px 12px rgba(255,149,0,0.35)",
                }}
              >
                签到
              </View>
            ) : (
              <Tag
                size="medium"
                style={{
                  background: "linear-gradient(135deg, #58CC02, #46a302)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  fontWeight: "600",
                }}
              >
                已签到 ✓
              </Tag>
            )}
          </View>
        </View>
      </View>

      {/* ====== Content area ====== */}
      <View className="px-4" style={{ marginTop: "-12px" }}>

        {/* ====== Unread messages notice bar ====== */}
        {unread > 0 && (
          <View className="mb-3">
            <NoticeBar
              style={{
                borderRadius: "14px",
                background: "linear-gradient(135deg, #FFF8E6, #FFF3D6)",
                color: "#FF9500",
                fontWeight: "500",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
        {tasks.length > 0 && (
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
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
        {tasks.length === 0 && (
          <View
            className="mb-4 rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
        {activities.length > 0 && (
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
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
        {notes.length > 0 && (
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
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
                    <Tag
                      size="small"
                      style={{
                        background: "rgba(255,68,68,0.06)",
                        color: "#FF4444",
                        border: "none",
                        borderRadius: "6px",
                      }}
                    >
                      👍 {n.like_cnt || 0}
                    </Tag>
                    <Tag
                      size="small"
                      style={{
                        background: "rgba(28,176,246,0.06)",
                        color: "#1CB0F6",
                        border: "none",
                        borderRadius: "6px",
                      }}
                    >
                      👁 {n.view_cnt || 0}
                    </Tag>
                    <Tag
                      size="small"
                      style={{
                        background: "rgba(88,204,2,0.06)",
                        color: "#58CC02",
                        border: "none",
                        borderRadius: "6px",
                      }}
                    >
                      💬 {n.comment_cnt || 0}
                    </Tag>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom breathing room */}
        <View className="h-4" />
      </View>
    </View>
  );
}
