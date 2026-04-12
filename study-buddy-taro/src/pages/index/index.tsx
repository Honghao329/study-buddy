import { ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { Avatar, Button } from "@taroify/core";
import { Bell, Arrow } from "@taroify/icons";
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export default function IndexPage() {
  const [logged, setLogged] = useState(false);
  const [signStats, setSignStats] = useState<SignStats>({ streak: 0, totalDays: 0, totalDuration: 0, todaySigned: false });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayDone, setTodayDone] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [userInfo, setUserInfo] = useState<any>(null);

  const loadAll = useCallback(async () => {
    try {
      const info = Taro.getStorageSync("userInfo");
      setUserInfo(info || null);
    } catch {}

    const [signRes, checkinRes, noteRes, actRes, unreadRes] = await Promise.allSettled([
      api.get("/api/sign/stats"),
      api.get("/api/checkin/list", { page: 1, size: 10 }),
      api.get("/api/note/public_list", { page: 1, size: 6, sort: "hot" }),
      api.get("/api/home/activity"),
      api.get("/api/message/unread_count"),
    ]);

    if (signRes.status === "fulfilled") {
      const s = signRes.value || {};
      setSignStats({ streak: s.streak || 0, totalDays: s.totalDays || 0, totalDuration: s.totalDuration || 0, todaySigned: !!s.todaySigned });
    }
    if (checkinRes.status === "fulfilled") {
      const list = checkinRes.value?.list || [];
      let doneIds: number[] = [];
      if (list.length) { try { doneIds = await api.get("/api/checkin/today_done_ids"); } catch {} }
      const mapped = list.map((t: any) => ({ ...t, _joined: (doneIds || []).includes(t.id) }));
      setTasks(mapped);
      setTodayDone(mapped.filter((t: Task) => t._joined).length);
    }
    if (noteRes.status === "fulfilled") setNotes(noteRes.value?.list || []);
    if (actRes.status === "fulfilled") setActivities(Array.isArray(actRes.value) ? actRes.value : []);
    if (unreadRes.status === "fulfilled") setUnread(Number(unreadRes.value) || 0);
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
  const goCommunity = () => Taro.switchTab({ url: "/pages/community/index" });
  const goCheckinList = () => Taro.switchTab({ url: "/pages/checkin-list/index" });

  const quickSign = async () => {
    if (signStats.todaySigned) { goSign(); return; }
    try {
      await api.post("/api/sign/do", { duration: 30, status: "normal", content: "" });
      Taro.showToast({ title: "签到成功", icon: "success" });
      loadAll();
    } catch { Taro.showToast({ title: "签到失败", icon: "none" }); }
  };

  // 笔记卡片装饰色
  const cardColors = ["#EFF6FF", "#F5F3FF", "#ECFDF5", "#FFF7ED", "#FEF2F2", "#F0F9FF"];
  const tagColors = [
    { bg: "#DBEAFE", text: "#2563EB" },
    { bg: "#E9D5FF", text: "#7C3AED" },
    { bg: "#D1FAE5", text: "#059669" },
    { bg: "#FED7AA", text: "#EA580C" },
    { bg: "#FECACA", text: "#DC2626" },
    { bg: "#BAE6FD", text: "#0284C7" },
  ];

  /* ========== 未登录 ========== */
  if (!logged) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-6 pb-20"
        style={{ background: "linear-gradient(160deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)" }}>
        <Text className="text-5xl mb-6">📖</Text>
        <Text className="text-2xl font-bold text-white mb-2">学习伴侣</Text>
        <Text className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.7)" }}>签到打卡 · 结交伙伴 · 共同成长</Text>
        <View className="w-full rounded-2xl px-6 py-8 flex flex-col items-center"
          style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
          <Text className="text-lg font-bold mb-1" style={{ color: "#1e293b" }}>开启你的学习之旅</Text>
          <Text className="text-sm mb-6" style={{ color: "#94a3b8" }}>每天进步一点点</Text>
          <Button block round size="large"
            style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", color: "#fff", border: "none", fontWeight: "600", boxShadow: "0 4px 16px rgba(79,70,229,0.4)" }}
            onClick={goLogin}>
            立即登录
          </Button>
        </View>
      </View>
    );
  }

  /* ========== 已登录 ========== */
  return (
    <View className="min-h-screen" style={{ background: "#F1F5F9" }}>

      {/* ===== 渐变头部 ===== */}
      <View style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 60%, #818CF8 100%)", borderRadius: "0 0 28px 28px", padding: "16px 20px 56px" }}>
        {/* 顶部：头像 + 问候 + 消息 */}
        <View className="flex items-center justify-between mb-5">
          <View className="flex items-center gap-3">
            <View style={{ width: "44px", height: "44px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", overflow: "hidden", background: "rgba(255,255,255,0.2)" }}>
              {userInfo?.avatar ? (
                <Avatar src={resolveImageUrl(userInfo.avatar) || ""} style={{ width: "100%", height: "100%" }} />
              ) : (
                <View className="w-full h-full flex items-center justify-center">
                  <Text style={{ fontSize: "20px" }}>👤</Text>
                </View>
              )}
            </View>
            <View>
              <Text className="block text-base font-bold text-white">
                {getGreeting()}，{userInfo?.nickname || "同学"} 👋
              </Text>
              <Text className="block text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                今天也要元气满满哦！
              </Text>
            </View>
          </View>
          <View className="relative" onClick={goMessages}>
            <View className="flex items-center justify-center" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.15)" }}>
              <Bell size="18" color="#fff" />
            </View>
            {unread > 0 && (
              <View className="absolute" style={{ top: "-2px", right: "-2px", width: "8px", height: "8px", borderRadius: "4px", background: "#EF4444" }} />
            )}
          </View>
        </View>

        {/* 签到卡片（嵌在渐变里） */}
        <View className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <View>
            <Text className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>今日学习目标</Text>
            <Text className="block text-base font-semibold text-white mt-0.5">保持专注，突破自我</Text>
          </View>
          <View style={{
            padding: "8px 18px", borderRadius: "999px", fontWeight: "600", fontSize: "13px",
            ...(signStats.todaySigned
              ? { background: "#22C55E", color: "#fff", boxShadow: "0 0 12px rgba(34,197,94,0.5)" }
              : { background: "#fff", color: "#4F46E5" })
          }} onClick={quickSign}>
            <Text>{signStats.todaySigned ? "✓ 已签到" : "立即签到"}</Text>
          </View>
        </View>
      </View>

      {/* ===== 悬浮数据卡片 ===== */}
      <View className="flex items-center justify-between rounded-2xl px-5 py-4 relative"
        style={{ margin: "-28px 20px 0", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", zIndex: 10, border: "1px solid #F1F5F9" }}>
        <View className="text-center flex-1" style={{ borderRight: "1px solid #F1F5F9" }}>
          <View className="flex items-center justify-center gap-1 mb-1">
            <Text style={{ fontSize: "14px" }}>🔥</Text>
            <Text className="text-xl font-bold" style={{ color: "#1e293b" }}>{signStats.streak}</Text>
          </View>
          <Text className="text-xs" style={{ color: "#94a3b8" }}>连续签到(天)</Text>
        </View>
        <View className="text-center flex-1" style={{ borderRight: "1px solid #F1F5F9" }}>
          <Text className="block text-xl font-bold mb-1" style={{ color: "#1e293b" }}>{signStats.totalDuration || 0}</Text>
          <Text className="text-xs" style={{ color: "#94a3b8" }}>学习时长(分)</Text>
        </View>
        <View className="text-center flex-1">
          <Text className="block text-xl font-bold mb-1" style={{ color: "#1e293b" }}>{todayDone}</Text>
          <Text className="text-xs" style={{ color: "#94a3b8" }}>完成任务</Text>
        </View>
      </View>

      {/* ===== 内容区 ===== */}
      <View style={{ padding: "20px 0 16px" }}>

        {/* 今日打卡 */}
        {tasks.length > 0 && (
          <View className="mb-5">
            <View className="flex items-center justify-between px-5 mb-3">
              <Text className="text-base font-bold" style={{ color: "#1e293b" }}>今日打卡</Text>
              <Text className="text-xs flex items-center" style={{ color: "#94a3b8" }} onClick={goCheckinList}>
                查看全部 <Arrow size="12" />
              </Text>
            </View>
            {tasks.slice(0, 3).map((t) => (
              <View key={t.id} className="flex items-center mx-5 mb-2 rounded-xl px-4 py-3"
                style={{ background: "#fff", border: "1px solid #F1F5F9" }}
                onClick={() => goCheckin(t.id)}>
                <View style={{
                  width: "20px", height: "20px", borderRadius: "50%", marginRight: "12px", flexShrink: 0,
                  background: t._joined ? "#22C55E" : "transparent",
                  border: t._joined ? "none" : "2px solid #D1D5DB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {t._joined && <Text style={{ color: "#fff", fontSize: "11px", fontWeight: "700" }}>✓</Text>}
                </View>
                <Text className="flex-1 truncate" style={{
                  fontSize: "14px", fontWeight: "500",
                  color: t._joined ? "#9CA3AF" : "#1e293b",
                  textDecoration: t._joined ? "line-through" : "none",
                }}>{t.title}</Text>
                <Text className="text-xs" style={{ color: "#CBD5E1" }}>{t.join_cnt || 0}人</Text>
                <Arrow size="14" color="#D1D5DB" style={{ marginLeft: "8px" }} />
              </View>
            ))}
          </View>
        )}

        {tasks.length === 0 && (
          <View className="mx-5 mb-5 rounded-xl px-4 py-6 text-center" style={{ background: "#fff", border: "1px solid #F1F5F9" }}
            onClick={goCheckinList}>
            <Text className="block text-sm" style={{ color: "#94a3b8" }}>还没有打卡任务</Text>
            <Text className="block text-xs mt-1" style={{ color: "#6366F1" }}>去看看有哪些任务 →</Text>
          </View>
        )}

        {/* 精选笔记（横向滑动） */}
        {notes.length > 0 && (
          <View className="mb-5">
            <View className="flex items-center justify-between px-5 mb-3">
              <Text className="text-base font-bold" style={{ color: "#1e293b" }}>精选笔记</Text>
              <Text className="text-xs flex items-center" style={{ color: "#94a3b8" }} onClick={goCommunity}>
                查看更多 <Arrow size="12" />
              </Text>
            </View>
            <ScrollView scrollX className="w-full" style={{ whiteSpace: "nowrap" }}>
              <View className="flex gap-3 px-5 pb-2" style={{ display: "inline-flex" }}>
                {notes.map((n, i) => (
                  <View key={n.id} style={{
                    width: "180px", flexShrink: 0, background: "#fff", borderRadius: "16px",
                    padding: "14px", border: "1px solid #F1F5F9", position: "relative", overflow: "hidden",
                  }} onClick={() => goNote(n.id)}>
                    {/* 装饰角 */}
                    <View style={{
                      position: "absolute", top: 0, right: 0, width: "48px", height: "48px",
                      borderBottomLeftRadius: "999px", background: cardColors[i % 6], zIndex: 0,
                    }} />
                    <View style={{ position: "relative", zIndex: 1 }}>
                      <View style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: "4px", marginBottom: "8px",
                        background: tagColors[i % 6].bg, color: tagColors[i % 6].text, fontSize: "10px", fontWeight: "700",
                      }}>
                        <Text>{n.user_name || "匿名"}</Text>
                      </View>
                      <Text className="block line-clamp-2" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", lineHeight: "1.4", marginBottom: "8px" }}>
                        {n.title}
                      </Text>
                      <View className="flex items-center justify-between" style={{ marginTop: "12px" }}>
                        <Text style={{ fontSize: "11px", color: "#94a3b8" }}>❤️ {n.like_cnt || 0}</Text>
                        <Text style={{ fontSize: "11px", color: "#94a3b8" }}>💬 {n.comment_cnt || 0}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 学习动态 */}
        {activities.length > 0 && (
          <View className="mb-4">
            <View className="flex items-center justify-between px-5 mb-3">
              <Text className="text-base font-bold" style={{ color: "#1e293b" }}>学习动态</Text>
            </View>
            <View className="px-5">
              {activities.map((a, i) => (
                <View key={i} className="flex gap-3 mb-3 rounded-xl px-4 py-3"
                  style={{ background: "#fff", border: "1px solid #F1F5F9" }}>
                  {a.avatar ? (
                    <Avatar src={resolveImageUrl(a.avatar) || ""} style={{ width: "36px", height: "36px", flexShrink: 0 }} />
                  ) : (
                    <View style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0, background: a.color || "#6366F1" }} />
                  )}
                  <View className="flex-1 min-w-0">
                    <Text className="block text-sm truncate" style={{ color: "#475569" }}>{a.text}</Text>
                    <Text className="block text-xs mt-1" style={{ color: "#CBD5E1" }}>{a.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: "16px" }} />
      </View>
    </View>
  );
}
