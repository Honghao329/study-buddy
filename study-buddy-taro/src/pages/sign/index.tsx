import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { api } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

/* ---------- types ---------- */

interface SignStats {
  streak: number;
  totalDays: number;
  totalDuration: number;
  todaySigned: boolean;
}

interface CalendarDay {
  date: string;
  signed: boolean;
}

interface RankUser {
  user_id: number;
  user_name: string;
  user_pic: string;
  days: number;
  total_duration: number;
}

/* ---------- helpers ---------- */

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/* ---------- component ---------- */

export default function SignPage() {
  const now = new Date();
  const [stats, setStats] = useState<SignStats>({
    streak: 0,
    totalDays: 0,
    totalDuration: 0,
    todaySigned: false,
  });
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [rank, setRank] = useState<RankUser[]>([]);
  const [signing, setSigning] = useState(false);

  /* ---- data fetching ---- */

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<SignStats>("/api/sign/stats");
      setStats({
        ...res,
        todaySigned: Boolean((res as any).todaySigned),
      });
    } catch {
      /* ignore */
    }
  }, []);

  const fetchCalendar = useCallback(async (y: number, m: number) => {
    try {
      const res = await api.get<Array<{ day: string }>>("/api/sign/calendar", {
        year: y,
        month: m,
      });
      setCalendarDays((res || []).map((item) => ({ date: item.day, signed: true })));
    } catch {
      setCalendarDays([]);
    }
  }, []);

  const fetchRank = useCallback(async () => {
    try {
      const res = await api.get<RankUser[]>("/api/sign/rank");
      setRank(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
  }, []);

  useDidShow(() => {
    Promise.all([fetchStats(), fetchCalendar(year, month), fetchRank()]);
  });

  /* ---- actions ---- */

  const doSign = async () => {
    if (stats.todaySigned || signing) return;
    setSigning(true);
    try {
      await api.post("/api/sign/do");
      Taro.showToast({ title: "签到成功", icon: "success" });
      await Promise.all([fetchStats(), fetchCalendar(year, month)]);
    } catch {
      Taro.showToast({ title: "签到失败", icon: "none" });
    } finally {
      setSigning(false);
    }
  };

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    fetchCalendar(newYear, newMonth);
  };

  /* ---- calendar grid ---- */

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const signedSet = new Set(calendarDays.filter((d) => d.signed).map((d) => d.date));

  const cells: { day: number; signed: boolean }[] = [];
  // leading blanks
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, signed: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    cells.push({ day: d, signed: signedSet.has(dateStr) });
  }

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* ====== Stats Header ====== */}
      <View className="mx-12 mt-12 rounded-xl p-24 text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <View className="flex items-center justify-around">
          <View className="text-center">
            <Text className="block text-4xl font-bold">{stats.streak}</Text>
            <Text className="block text-xs opacity-80 mt-4">连续签到(天)</Text>
          </View>
          <View className="text-center">
            <Text className="block text-2xl font-bold">{stats.totalDays}</Text>
            <Text className="block text-xs opacity-80 mt-4">累计签到(天)</Text>
          </View>
          <View className="text-center">
            <Text className="block text-2xl font-bold">{stats.totalDuration}</Text>
            <Text className="block text-xs opacity-80 mt-4">累计时长(分)</Text>
          </View>
        </View>
      </View>

      {/* ====== Sign Button ====== */}
      <View className="flex justify-center mt-20 mb-20">
        <View
          className={`w-140 h-140 rounded-full flex items-center justify-center shadow-lg active:opacity-80 ${
            stats.todaySigned ? "bg-green-6" : "bg-primary-6"
          }`}
          onClick={doSign}
        >
          <Text className="text-white text-xl font-bold">
            {stats.todaySigned ? "已签到 ✓" : "签到"}
          </Text>
        </View>
      </View>

      {/* ====== Calendar ====== */}
      <View className="mx-12 bg-white rounded-xl shadow-sm p-16 mb-12">
        {/* Month header */}
        <View className="flex items-center justify-between mb-12">
          <View className="px-12 py-4 active:opacity-60" onClick={() => changeMonth(-1)}>
            <Text className="text-lg text-gray-6">&lt;</Text>
          </View>
          <Text className="text-base font-bold text-gray-8">
            {year}年{month}月
          </Text>
          <View className="px-12 py-4 active:opacity-60" onClick={() => changeMonth(1)}>
            <Text className="text-lg text-gray-6">&gt;</Text>
          </View>
        </View>

        {/* Weekday headers */}
        <View className="flex">
          {WEEK_LABELS.map((w) => (
            <View key={w} className="flex-1 text-center py-4">
              <Text className="text-xs text-gray-4">周{w}</Text>
            </View>
          ))}
        </View>

        {/* Day cells */}
        <View className="flex flex-wrap">
          {cells.map((cell, idx) => (
            <View
              key={idx}
              className="flex items-center justify-center py-6"
              style={{ width: "14.2857%" }}
            >
              {cell.day > 0 ? (
                <View
                  className={`w-36 h-36 rounded-full flex items-center justify-center ${
                    cell.signed ? "bg-green-6" : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      cell.signed ? "text-white font-bold" : "text-gray-6"
                    }`}
                  >
                    {cell.day}
                  </Text>
                </View>
              ) : (
                <View className="w-36 h-36" />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ====== Leaderboard ====== */}
      <View className="mx-12 bg-white rounded-xl shadow-sm p-16">
        <Text className="block text-base font-bold text-gray-8 mb-12">
          签到排行榜
        </Text>

        {rank.length === 0 && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">暂无排行数据</Text>
          </View>
        )}

        {rank.map((user, idx) => (
          <View
            key={user.user_id}
            className="flex items-center py-10 border-b border-gray-1 last:border-none"
          >
            <Text
              className={`w-28 text-center font-bold mr-10 ${
                idx < 3 ? "text-orange-5" : "text-gray-4"
              }`}
            >
              {idx + 1}
            </Text>
            <Image
              className="w-40 h-40 rounded-full mr-10 bg-gray-2 shrink-0"
              src={resolveImageUrl(user.user_pic) || "https://via.placeholder.com/160"}
              mode="aspectFill"
            />
            <View className="flex-1 min-w-0">
              <Text className="text-sm text-gray-8 truncate block">
                {user.user_name || "匿名用户"}
              </Text>
              <Text className="text-xs text-gray-4">
                累计{user.days}天
              </Text>
            </View>
            <Text className="text-sm font-bold text-primary-6">
              {user.total_duration}分
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
