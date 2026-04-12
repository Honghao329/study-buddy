import { Image, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { api, isLoggedIn } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface SignStats { streak: number; totalDays: number; totalDuration: number; todaySigned: boolean }
interface Task { id: number; title: string; join_cnt: number; _joined: boolean }
interface Activity { avatar?: string; text: string; time: string; color?: string }
interface Note { id: number; title: string; content?: string; user_name: string; user_pic: string; like_cnt: number; view_cnt: number; comment_cnt: number }

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

const NOTE_COLORS = [
  { bg: "bg-blue-50", tag: "bg-blue-100 text-blue-600" },
  { bg: "bg-purple-50", tag: "bg-purple-100 text-purple-600" },
  { bg: "bg-green-50", tag: "bg-green-100 text-green-600" },
  { bg: "bg-orange-50", tag: "bg-orange-100 text-orange-600" },
  { bg: "bg-rose-50", tag: "bg-rose-100 text-rose-600" },
  { bg: "bg-cyan-50", tag: "bg-cyan-100 text-cyan-600" },
];

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
    try { setUserInfo(Taro.getStorageSync("userInfo") || null); } catch {}
    const [signR, checkinR, noteR, actR, unreadR] = await Promise.allSettled([
      api.get("/api/sign/stats"),
      api.get("/api/checkin/list", { page: 1, size: 10 }),
      api.get("/api/note/public_list", { page: 1, size: 6, sort: "hot" }),
      api.get("/api/home/activity"),
      api.get("/api/message/unread_count"),
    ]);
    if (signR.status === "fulfilled") {
      const s = signR.value || {};
      setSignStats({ streak: s.streak || 0, totalDays: s.totalDays || 0, totalDuration: s.totalDuration || 0, todaySigned: !!s.todaySigned });
    }
    if (checkinR.status === "fulfilled") {
      const list = checkinR.value?.list || [];
      let doneIds: number[] = [];
      if (list.length) { try { doneIds = await api.get("/api/checkin/today_done_ids"); } catch {} }
      const mapped = list.map((t: any) => ({ ...t, _joined: (doneIds || []).includes(t.id) }));
      setTasks(mapped); setTodayDone(mapped.filter((t: Task) => t._joined).length);
    }
    if (noteR.status === "fulfilled") setNotes(noteR.value?.list || []);
    if (actR.status === "fulfilled") setActivities(Array.isArray(actR.value) ? actR.value : []);
    if (unreadR.status === "fulfilled") setUnread(Number(unreadR.value) || 0);
  }, []);

  useDidShow(() => { const l = isLoggedIn(); setLogged(l); if (l) loadAll(); });

  const goLogin = () => Taro.navigateTo({ url: "/pages/login/index" });
  const goMessages = () => Taro.navigateTo({ url: "/pages/messages/index" });
  const goCheckin = (id: number) => Taro.navigateTo({ url: `/pages/checkin-detail/index?id=${id}` });
  const goNote = (id: number) => Taro.navigateTo({ url: `/pages/note-detail/index?id=${id}` });
  const goSign = () => Taro.navigateTo({ url: "/pages/sign/index" });
  const goCommunity = () => Taro.switchTab({ url: "/pages/community/index" });
  const goCheckinList = () => Taro.switchTab({ url: "/pages/checkin-list/index" });

  const handleCheckIn = async () => {
    if (signStats.todaySigned) { goSign(); return; }
    try {
      await api.post("/api/sign/do", { duration: 30, status: "normal", content: "" });
      Taro.showToast({ title: "签到成功", icon: "success" });
      loadAll();
    } catch { Taro.showToast({ title: "签到失败", icon: "none" }); }
  };

  /* ===== 未登录 ===== */
  if (!logged) {
    return (
      <View className="flex justify-center bg-gray-100 min-h-screen font-sans text-slate-800">
        <View className="w-full bg-gray-50 min-h-screen relative overflow-hidden flex flex-col">
          <View className="flex-1 flex flex-col items-center justify-center px-6 pb-20"
            style={{ background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)" }}>
            <Text className="text-5xl mb-6">📖</Text>
            <Text className="text-2xl font-bold text-white mb-2">学习伴侣</Text>
            <Text className="text-sm text-blue-200 mb-10">签到打卡 · 结交伙伴 · 共同成长</Text>
            <View className="w-full bg-white rounded-2xl px-6 py-8 flex flex-col items-center"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
              <Text className="text-lg font-bold text-slate-800 mb-1">开启你的学习之旅</Text>
              <Text className="text-sm text-gray-400 mb-6">每天进步一点点</Text>
              <View className="w-full bg-blue-600 rounded-full py-3 flex items-center justify-center"
                style={{ boxShadow: "0 4px 16px rgba(79,70,229,0.4)" }}
                onClick={goLogin}>
                <Text className="text-white text-base font-semibold">立即登录</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  /* ===== 已登录 ===== */
  return (
    <View className="w-full bg-gray-50 min-h-screen text-slate-800">

      {/* 1. 顶部区域：渐变背景 + 问候语 + 打卡 */}
      <View className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-4 pb-16 text-white relative"
        style={{ borderRadius: "0 0 40rpx 40rpx" }}>
        <View className="flex justify-between items-center mb-6">
          <View className="flex items-center gap-3">
            <View className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }}>
              {userInfo?.avatar ? (
                <Image className="w-full h-full" src={resolveImageUrl(userInfo.avatar) || ""} mode="aspectFill" />
              ) : (
                <Text className="text-xl">👤</Text>
              )}
            </View>
            <View>
              <Text className="text-lg font-bold text-white">{getGreeting()}，{userInfo?.nickname || "同学"} 👋</Text>
              <Text className="text-blue-100 text-sm">今天也要元气满满哦！</Text>
            </View>
          </View>
          <View className="w-10 h-10 rounded-full flex items-center justify-center relative"
            style={{ background: "rgba(255,255,255,0.1)" }}
            onClick={goMessages}>
            <Text className="text-white text-lg">🔔</Text>
            {unread > 0 && (
              <View className="absolute w-2 h-2 bg-red-400 rounded-full" style={{ top: "8rpx", right: "8rpx" }} />
            )}
          </View>
        </View>

        <View className="flex items-center justify-between rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <View>
            <Text className="text-sm text-blue-100 mb-1 block">今日学习目标</Text>
            <Text className="text-xl font-semibold text-white">保持专注，突破自我</Text>
          </View>
          <View className={`flex items-center gap-1 px-4 py-2 rounded-full font-medium ${
            signStats.todaySigned
              ? "text-white"
              : "bg-white text-indigo-600"
          }`}
            style={signStats.todaySigned ? { background: "#4ADE80", boxShadow: "0 0 15px rgba(74,222,128,0.5)" } : { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            onClick={handleCheckIn}>
            <Text className="text-sm font-medium">{signStats.todaySigned ? "✓ 已打卡" : "立即打卡"}</Text>
          </View>
        </View>
      </View>

      {/* 2. 数据悬浮卡片 */}
      <View className="bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center relative z-10 border border-gray-100"
        style={{ margin: "-32px 24px 0" }}>
        <View className="text-center flex-1 border-r border-gray-100">
          <View className="flex items-center justify-center gap-1 text-orange-500 mb-1">
            <Text>🔥</Text>
            <Text className="text-xl font-bold text-slate-800">{signStats.streak}</Text>
          </View>
          <Text className="text-xs text-gray-500">连续打卡(天)</Text>
        </View>
        <View className="text-center flex-1 border-r border-gray-100">
          <Text className="text-xl font-bold text-slate-800 mb-1 block">{signStats.totalDuration || 0}</Text>
          <Text className="text-xs text-gray-500">今日学习(分)</Text>
        </View>
        <View className="text-center flex-1">
          <Text className="text-xl font-bold text-slate-800 mb-1 block">{todayDone}</Text>
          <Text className="text-xs text-gray-500">完成任务</Text>
        </View>
      </View>

      {/* 3. 今日打卡 */}
      {tasks.length > 0 && (
        <View className="mt-6">
          <View className="px-6 flex justify-between items-center mb-3">
            <Text className="text-lg font-bold text-slate-800">今日打卡</Text>
            <Text className="text-sm text-gray-400 flex items-center" onClick={goCheckinList}>查看全部 ›</Text>
          </View>
          <View className="px-6">
            {tasks.slice(0, 4).map((t) => (
              <View key={t.id} className="bg-white p-3 rounded-xl border border-gray-100 mb-2 flex items-center gap-3"
                onClick={() => goCheckin(t.id)}>
                <View className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: t._joined ? "#22C55E" : "transparent",
                    border: t._joined ? "none" : "2px solid #D1D5DB",
                  }}>
                  {t._joined && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
                <Text className={`flex-1 text-sm truncate ${t._joined ? "text-gray-400 line-through" : "font-medium text-slate-800"}`}>{t.title}</Text>
                <Text className="text-xs text-gray-400 shrink-0">{t.join_cnt || 0}人</Text>
                <Text className="text-gray-300 text-sm">›</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 4. 精选笔记 (横向滑动) */}
      {notes.length > 0 && (
        <View className="mt-6">
          <View className="px-6 flex justify-between items-center mb-4">
            <Text className="text-lg font-bold text-slate-800">精选笔记</Text>
            <Text className="text-sm text-gray-400 flex items-center" onClick={goCommunity}>查看更多 ›</Text>
          </View>

          <ScrollView scrollX className="w-full" style={{ whiteSpace: "nowrap" }}>
            <View className="flex px-6 pb-4 gap-4" style={{ display: "inline-flex" }}>
              {notes.map((n, i) => {
                const c = NOTE_COLORS[i % NOTE_COLORS.length];
                return (
                  <View key={n.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden"
                    style={{ width: "200px", flexShrink: 0 }}
                    onClick={() => goNote(n.id)}>
                    <View className={`absolute top-0 right-0 w-16 h-16 ${c.bg} rounded-bl-full`} />
                    <View className="relative z-10">
                      <Text className={`inline-block px-2 py-1 ${c.tag} text-xs font-bold rounded-md mb-2`}>
                        {n.user_name || "匿名"}
                      </Text>
                      <Text className="block font-semibold text-slate-800 mb-2 line-clamp-2" style={{ fontSize: "14px" }}>
                        {n.title}
                      </Text>
                      <View className="flex items-center justify-between text-xs text-gray-400 mt-4">
                        <Text className="flex items-center">❤️ {n.like_cnt || 0}</Text>
                        <Text>💬 {n.comment_cnt || 0}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 5. 学习动态 */}
      {activities.length > 0 && (
        <View className="mt-4 px-6 mb-8">
          <View className="flex justify-between items-center mb-4">
            <Text className="text-lg font-bold text-slate-800">学习动态</Text>
          </View>

          {activities.map((a, i) => (
            <View key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex gap-3 mb-3">
              {a.avatar ? (
                <Image className="w-10 h-10 rounded-full shrink-0 bg-blue-100" src={resolveImageUrl(a.avatar) || ""} mode="aspectFill" />
              ) : (
                <View className="w-10 h-10 rounded-full shrink-0" style={{ background: a.color || "#6366F1" }} />
              )}
              <View className="flex-1 min-w-0">
                <Text className="text-sm text-gray-600 block">{a.text}</Text>
                <Text className="text-xs text-gray-400 mt-1 block">{a.time}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: "24px" }} />
    </View>
  );
}
