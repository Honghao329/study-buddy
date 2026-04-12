import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { Avatar, Button, Cell, Divider, Loading } from "@taroify/core";
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

const MEDAL_COLORS = ["#FF9500", "#A0A0A0", "#CD7F32"];

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
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, signed: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    cells.push({ day: d, signed: signedSet.has(dateStr) });
  }

  return (
    <View className="min-h-screen pb-40" style={{ backgroundColor: "#F7F8FA" }}>
      {/* ====== Stats Header ====== */}
      <View
        className="mx-12 mt-12 rounded-2xl p-28"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 8px 24px rgba(118, 75, 162, 0.3)",
        }}
      >
        <View className="flex items-center justify-around">
          <View className="text-center">
            <Text
              className="block font-bold"
              style={{ fontSize: "36px", color: "#fff" }}
            >
              {stats.streak}
            </Text>
            <Text
              className="block mt-6"
              style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}
            >
              连续签到(天)
            </Text>
          </View>
          <View
            style={{
              width: "1px",
              height: "40px",
              backgroundColor: "rgba(255,255,255,0.25)",
            }}
          />
          <View className="text-center">
            <Text
              className="block font-bold"
              style={{ fontSize: "24px", color: "#fff" }}
            >
              {stats.totalDays}
            </Text>
            <Text
              className="block mt-6"
              style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}
            >
              累计签到(天)
            </Text>
          </View>
          <View
            style={{
              width: "1px",
              height: "40px",
              backgroundColor: "rgba(255,255,255,0.25)",
            }}
          />
          <View className="text-center">
            <Text
              className="block font-bold"
              style={{ fontSize: "24px", color: "#fff" }}
            >
              {stats.totalDuration}
            </Text>
            <Text
              className="block mt-6"
              style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}
            >
              累计时长(分)
            </Text>
          </View>
        </View>
      </View>

      {/* ====== Sign Button ====== */}
      <View className="flex justify-center mt-24 mb-24">
        <Button
          round
          type={stats.todaySigned ? "success" : "primary"}
          size="large"
          loading={signing}
          disabled={stats.todaySigned}
          onClick={doSign}
          style={{
            width: "200px",
            height: "56px",
            fontSize: "17px",
            fontWeight: "bold",
            background: stats.todaySigned ? "#58CC02" : "#1CB0F6",
            borderColor: stats.todaySigned ? "#58CC02" : "#1CB0F6",
            boxShadow: stats.todaySigned
              ? "0 4px 16px rgba(88,204,2,0.35)"
              : "0 4px 16px rgba(28,176,246,0.35)",
          }}
        >
          {stats.todaySigned ? "已签到" : "立即签到"}
        </Button>
      </View>

      {/* ====== Calendar ====== */}
      <View
        className="mx-12 rounded-2xl p-20 mb-12"
        style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        {/* Month header */}
        <View className="flex items-center justify-between mb-16">
          <View
            className="px-16 py-6 rounded-lg active:opacity-60"
            style={{ backgroundColor: "#F7F8FA" }}
            onClick={() => changeMonth(-1)}
          >
            <Text style={{ fontSize: "16px", color: "#999" }}>&lt;</Text>
          </View>
          <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
            {year}年{month}月
          </Text>
          <View
            className="px-16 py-6 rounded-lg active:opacity-60"
            style={{ backgroundColor: "#F7F8FA" }}
            onClick={() => changeMonth(1)}
          >
            <Text style={{ fontSize: "16px", color: "#999" }}>&gt;</Text>
          </View>
        </View>

        {/* Weekday headers */}
        <View className="flex mb-8">
          {WEEK_LABELS.map((w) => (
            <View key={w} className="flex-1 text-center py-4">
              <Text style={{ fontSize: "12px", color: "#aaa", fontWeight: "500" }}>
                {w}
              </Text>
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
                  className="flex items-center justify-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: cell.signed ? "#58CC02" : "transparent",
                    transition: "all 0.2s",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "14px",
                      color: cell.signed ? "#fff" : "#666",
                      fontWeight: cell.signed ? "bold" : "normal",
                    }}
                  >
                    {cell.day}
                  </Text>
                </View>
              ) : (
                <View style={{ width: "36px", height: "36px" }} />
              )}
            </View>
          ))}
        </View>
      </View>

      <Divider style={{ margin: "8px 24px", borderColor: "#eee" }}>
        签到排行榜
      </Divider>

      {/* ====== Leaderboard ====== */}
      <View
        className="mx-12 rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        {rank.length === 0 && (
          <View className="py-40 text-center">
            <Loading type="spinner" style={{ color: "#1CB0F6" }} />
            <Text className="block mt-8" style={{ fontSize: "13px", color: "#999" }}>
              暂无排行数据
            </Text>
          </View>
        )}

        {rank.map((user, idx) => (
          <Cell
            key={user.user_id}
            icon={
              <View className="flex items-center">
                <View
                  className="flex items-center justify-center mr-10"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: idx < 3 ? MEDAL_COLORS[idx] : "#F7F8FA",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: idx < 3 ? "#fff" : "#999",
                    }}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <Avatar
                  src={resolveImageUrl(user.user_pic)}
                  size="medium"
                  style={{ marginRight: "8px" }}
                />
              </View>
            }
            title={user.user_name || "匿名用户"}
            brief={`累计${user.days}天`}
            style={{ paddingLeft: "12px", paddingRight: "12px" }}
          >
            <Text style={{ fontSize: "14px", fontWeight: "bold", color: "#1CB0F6" }}>
              {user.total_duration}分
            </Text>
          </Cell>
        ))}
      </View>
    </View>
  );
}
