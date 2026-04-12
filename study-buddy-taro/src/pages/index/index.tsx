import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
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
      <View className="min-h-100vh bg-gray-1 px-4 pt-10 pb-6">
        <View
          className="flex items-center gap-4 bg-white rounded-2xl p-6 shadow-sm active:bg-gray-1"
          onClick={goLogin}
        >
          <Text className="text-4xl">📖</Text>
          <View className="flex-1">
            <Text className="block text-base font-semibold text-gray-9">登录开启学习之旅</Text>
            <Text className="block text-xs text-gray-5 mt-0.5">签到打卡、结交伙伴、共同成长</Text>
          </View>
          <Text className="text-xl text-gray-4">›</Text>
        </View>
      </View>
    );
  }

  /* ---------- Logged in ---------- */
  return (
    <View className="min-h-100vh bg-gray-1 px-4 pt-3 pb-6">

      {/* ====== Sign-in status card ====== */}
      <View
        className={`flex items-center justify-between rounded-2xl px-4 py-3.5 mb-3 shadow-sm ${
          signStats.todaySigned
            ? "bg-gradient-to-r from-green-1 to-green-2 border-l-4 border-green-5"
            : "bg-gradient-to-r from-orange-1 to-amber-1 border-l-4 border-orange-5"
        }`}
        onClick={onSignTap}
      >
        <View className="flex items-center gap-1 flex-wrap min-w-0">
          <Text className="text-sm">🔥</Text>
          <Text
            className={`text-base font-bold ${
              signStats.todaySigned ? "text-green-6" : "text-orange-6"
            }`}
          >
            {signStats.streak || 0}天连续
          </Text>
          <Text className="text-gray-3 text-xs mx-0.5">·</Text>
          <Text className="text-xs text-gray-5">累计{signStats.totalDays || 0}天</Text>
          {signStats.totalDuration > 0 && (
            <>
              <Text className="text-gray-3 text-xs mx-0.5">·</Text>
              <Text className="text-xs text-gray-5">{signStats.totalDuration}分钟</Text>
            </>
          )}
        </View>

        {!signStats.todaySigned ? (
          <View className="shrink-0 bg-primary-6 text-white text-sm font-semibold px-5 py-1.5 rounded-full shadow-sm">
            签到
          </View>
        ) : (
          <Text className="shrink-0 text-sm text-green-6 font-medium">✓ 已签</Text>
        )}
      </View>

      {/* ====== Unread messages bar ====== */}
      {unread > 0 && (
        <View
          className="flex items-center gap-2 bg-amber-1 rounded-xl px-3.5 py-2.5 mb-3"
          onClick={goMessages}
        >
          <Text className="text-sm">🔔</Text>
          <Text className="flex-1 text-sm text-amber-8">你有 {unread} 条未读消息</Text>
          <Text className="text-base text-gray-4">›</Text>
        </View>
      )}

      {/* ====== Today's checkin tasks ====== */}
      {tasks.length > 0 && (
        <View className="mb-4">
          <View className="flex justify-between items-center mb-2.5">
            <Text className="text-base font-semibold text-gray-9">今日打卡</Text>
            <Text className="text-sm text-primary-6 font-medium">
              {todayDone}/{tasks.length}
            </Text>
          </View>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {tasks.map((t, idx) => (
              <View
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3.5 active:bg-gray-1 ${
                  idx < tasks.length - 1 ? "border-b border-gray-1" : ""
                } ${t._joined ? "opacity-55" : ""}`}
                onClick={() => goCheckin(t.id)}
              >
                {/* Checkbox circle */}
                <View
                  className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${
                    t._joined
                      ? "bg-green-5 border-2 border-green-5"
                      : "border-2 border-gray-4"
                  }`}
                >
                  {t._joined && (
                    <Text className="text-white text-xs font-bold leading-none">✓</Text>
                  )}
                </View>

                {/* Task info */}
                <View className="flex-1 min-w-0">
                  <Text
                    className={`block text-base font-medium truncate ${
                      t._joined ? "text-gray-4 line-through" : "text-gray-9"
                    }`}
                  >
                    {t.title}
                  </Text>
                  <Text className="block text-xs text-gray-5 mt-0.5">
                    {t.join_cnt || 0}人参与
                  </Text>
                </View>

                <Text className="text-lg text-gray-3 shrink-0">›</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ====== Empty state for tasks ====== */}
      {tasks.length === 0 && (
        <View
          className="bg-white rounded-2xl py-8 px-6 mb-4 shadow-sm text-center active:bg-gray-1"
          onClick={goCheckinList}
        >
          <Text className="block text-3xl mb-2">📋</Text>
          <Text className="block text-sm text-gray-6 mb-3">还没有加入打卡任务</Text>
          <Text className="inline-block text-sm text-primary-6 font-medium bg-primary-1 px-4 py-1.5 rounded-full">
            去看看有哪些任务 →
          </Text>
        </View>
      )}

      {/* ====== Recent activity feed ====== */}
      {activities.length > 0 && (
        <View className="mb-4">
          <View className="flex justify-between items-center mb-2.5">
            <Text className="text-base font-semibold text-gray-9">最新动态</Text>
          </View>

          <View className="bg-white rounded-2xl px-4 shadow-sm">
            {activities.map((a, i) => (
              <View
                key={i}
                className={`flex items-center gap-2.5 py-3 ${
                  i < activities.length - 1 ? "border-b border-gray-1" : ""
                }`}
              >
                {a.avatar ? (
                  <Image
                    className="w-7 h-7 rounded-full shrink-0"
                    src={resolveImageUrl(a.avatar) || "https://via.placeholder.com/160"}
                    mode="aspectFill"
                  />
                ) : (
                  <View
                    className="w-7 h-7 rounded-full shrink-0"
                    style={{ background: a.color || "#165dff" }}
                  />
                )}
                <Text className="flex-1 text-sm text-gray-7 truncate">{a.text}</Text>
                <Text className="text-xs text-gray-4 shrink-0">{a.time}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ====== Hot notes ====== */}
      {notes.length > 0 && (
        <View className="mb-4">
          <View className="flex justify-between items-center mb-2.5">
            <Text className="text-base font-semibold text-gray-9">热门笔记</Text>
            <Text
              className="text-sm text-gray-5"
              onClick={() => Taro.switchTab({ url: "/pages/community/index" })}
            >
              更多
            </Text>
          </View>

          {notes.map((n) => (
            <View
              key={n.id}
              className="bg-white rounded-2xl px-4 pt-3.5 pb-3 mb-2.5 shadow-sm active:bg-gray-1"
              onClick={() => goNote(n.id)}
            >
              {/* Author row */}
              <View className="flex items-center gap-2 mb-2">
                <Image
                  className="w-6 h-6 rounded-full shrink-0"
                  src={resolveImageUrl(n.user_pic) || "https://via.placeholder.com/160"}
                  mode="aspectFill"
                />
                <Text className="text-sm text-gray-5">{n.user_name || "匿名"}</Text>
              </View>

              {/* Title - 2 line clamp */}
              <Text className="block text-base font-semibold text-gray-9 leading-relaxed line-clamp-2">
                {n.title}
              </Text>

              {/* Content preview - 3 line clamp */}
              {n.content && (
                <Text className="block text-sm text-gray-5 mt-1.5 leading-relaxed line-clamp-3">
                  {n.content}
                </Text>
              )}

              {/* Stats row */}
              <View className="flex gap-4 mt-2.5">
                <Text className="text-xs text-gray-4">👍 {n.like_cnt || 0}</Text>
                <Text className="text-xs text-gray-4">👁 {n.view_cnt || 0}</Text>
                <Text className="text-xs text-gray-4">💬 {n.comment_cnt || 0}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
