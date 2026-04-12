import { Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useMemo, useState } from "react";
import { Avatar, Button, Cell, Empty, Loading, Tag } from "@taroify/core";
import {
  BarChartOutlined,
  CalendarOutlined,
  ChartTrendingOutlined,
  ClockOutlined,
  TodoListOutlined,
} from "@taroify/icons";
import ContentMetrics from "~/components/ContentMetrics";
import { api } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

interface SignStats {
  streak: number;
  totalDays: number;
  totalDuration: number;
  todaySigned: boolean;
}

interface CalendarDay {
  day: string;
  duration: number;
  status: "efficient" | "normal" | "tired";
}

interface RankUser {
  user_id: number;
  user_name: string;
  user_pic: string;
  days: number;
  total_duration: number;
}

type SignStatus = "efficient" | "normal" | "tired";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const STATUS_OPTIONS: Array<{ value: SignStatus; label: string; hint: string }> = [
  { value: "efficient", label: "高效", hint: "今天状态很好" },
  { value: "normal", label: "正常", hint: "保持节奏" },
  { value: "tired", label: "疲惫", hint: "适合轻量收尾" },
];
const DURATION_PRESETS = [15, 30, 45, 60];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function getDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function statusTone(status: SignStatus): "success" | "warning" | "info" {
  if (status === "efficient") return "success";
  if (status === "tired") return "warning";
  return "info";
}

function statusLabel(status: SignStatus) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || "正常";
}

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
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [calendarError, setCalendarError] = useState("");
  const [rankError, setRankError] = useState("");
  const [duration, setDuration] = useState("30");
  const [status, setStatus] = useState<SignStatus>("normal");
  const [content, setContent] = useState("");

  const todayKey = getDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const todayRecord = useMemo(
    () => calendarDays.find((item) => item.day === todayKey),
    [calendarDays, todayKey],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<SignStats>("/api/sign/stats");
      setStats({
        streak: Number(res?.streak || 0),
        totalDays: Number(res?.totalDays || 0),
        totalDuration: Number(res?.totalDuration || 0),
        todaySigned: Boolean(res?.todaySigned),
      });
      setStatsError("");
    } catch (error: any) {
      setStatsError(error?.message || "签到统计加载失败");
      throw error;
    }
  }, []);

  const fetchCalendar = useCallback(async (y: number, m: number) => {
    setCalendarLoading(true);
    try {
      const res = await api.get<Array<CalendarDay>>("/api/sign/calendar", {
        year: y,
        month: m,
      });
      setCalendarDays(Array.isArray(res) ? res : []);
      setCalendarError("");
    } catch (error: any) {
      setCalendarError(error?.message || "签到日历加载失败");
      throw error;
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  const fetchRank = useCallback(async () => {
    try {
      const res = await api.get<RankUser[]>("/api/sign/rank");
      setRank(Array.isArray(res) ? res : []);
      setRankError("");
    } catch (error: any) {
      setRankError(error?.message || "签到排行榜加载失败");
      throw error;
    }
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([fetchStats(), fetchCalendar(year, month), fetchRank()]);
    setLoading(false);
  }, [fetchCalendar, fetchRank, fetchStats, month, year]);

  useDidShow(() => {
    loadPage();
  });

  const doSign = async () => {
    if (stats.todaySigned || signing) {
      return;
    }

    const safeDuration = Math.max(0, Math.min(1440, Number(duration) || 0));
    if (safeDuration < 5) {
      Taro.showToast({ title: "签到时长至少 5 分钟", icon: "none" });
      return;
    }

    setSigning(true);
    try {
      await api.post("/api/sign/do", {
        duration: safeDuration,
        status,
        content: content.trim(),
      });
      Taro.showToast({ title: "签到成功", icon: "success" });
      await Promise.all([fetchStats(), fetchCalendar(year, month), fetchRank()]);
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
    fetchCalendar(newYear, newMonth).catch(() => undefined);
  };

  const jumpToCurrentMonth = () => {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    setYear(currentYear);
    setMonth(currentMonth);
    fetchCalendar(currentYear, currentMonth).catch(() => undefined);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const signedMap = new Map(calendarDays.map((item) => [item.day, item]));

  const cells: Array<{
    day: number;
    signed: boolean;
    dateKey?: string;
    duration?: number;
    status?: SignStatus;
    isToday?: boolean;
  }> = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, signed: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = getDateKey(year, month, d);
    const signed = signedMap.get(dateKey);
    cells.push({
      day: d,
      signed: Boolean(signed),
      dateKey,
      duration: signed?.duration,
      status: signed?.status,
      isToday: dateKey === todayKey,
    });
  }

  const topMetrics = [
    {
      key: "streak",
      icon: <ChartTrendingOutlined size="16" />,
      label: "连续签到",
      value: `${stats.streak} 天`,
      tone: "success" as const,
    },
    {
      key: "days",
      icon: <TodoListOutlined size="16" />,
      label: "累计签到",
      value: `${stats.totalDays} 天`,
      tone: "info" as const,
    },
    {
      key: "duration",
      icon: <ClockOutlined size="16" />,
      label: "总时长",
      value: `${stats.totalDuration} 分钟`,
      tone: "warning" as const,
    },
  ];

  const durationValue = Math.max(0, Math.min(1440, Number(duration) || 0));
  const hasStatsData = stats.streak > 0 || stats.totalDays > 0 || stats.totalDuration > 0 || stats.todaySigned;

  if (loading && !calendarDays.length && !rank.length) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loading type="spinner" style={{ color: "#0F766E" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-10" style={{ background: "#F8FAFC" }}>
      <View className="px-4 pt-4">
        <View
          className="relative overflow-hidden rounded-[28px] px-5 py-5"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #0F766E 52%, #16A34A 120%)",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)",
          }}
        >
          <View className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <View className="absolute bottom-0 left-6 h-16 w-16 rounded-full bg-emerald-300/10" />

          <View className="flex items-start justify-between">
            <View className="min-w-0 flex-1">
              <Text className="block text-xl font-semibold text-white">签到日历</Text>
              <Text className="mt-1 block text-sm leading-6 text-white/70">
                用时长和状态记录今天，而不是只记一个“已签到”。
              </Text>
            </View>
            <View
              className="ml-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <CalendarOutlined size="20" color="#fff" />
            </View>
          </View>

          <View className="mt-4 flex gap-3">
            <Button
              round
              size="small"
              style={{
                background: "#fff",
                color: "#0F172A",
                border: "none",
                fontWeight: 700,
              }}
              onClick={doSign}
              disabled={stats.todaySigned}
            >
              {stats.todaySigned ? "今日已签到" : "立即签到"}
            </Button>
            <Button
              round
              size="small"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.16)",
                fontWeight: 700,
              }}
              onClick={jumpToCurrentMonth}
            >
              回到本月
            </Button>
          </View>
        </View>

        <View className="mt-4">
          {statsError && !hasStatsData ? (
            <View className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm" style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}>
              <Text className="block text-sm font-semibold text-rose-900">签到统计加载失败</Text>
              <Text className="mt-1 block text-xs leading-5 text-rose-700">{statsError}</Text>
              <Button
                round
                size="small"
                className="mt-3"
                style={{
                  background: "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                }}
                onClick={() => fetchStats().catch(() => undefined)}
              >
                重试统计
              </Button>
            </View>
          ) : (
            <ContentMetrics variant="tiles" items={topMetrics} />
          )}
        </View>

        <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm" style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}>
          <View className="flex items-center justify-between">
            <View>
              <Text className="block text-sm font-semibold text-slate-900">今日记录</Text>
              <Text className="mt-1 block text-xs text-slate-500">
                填写时长、状态和备注，记录今天真正做了什么。
              </Text>
            </View>
            <Tag
              shape="rounded"
              size="small"
              style={{
                background: stats.todaySigned ? "rgba(22,163,74,0.12)" : "rgba(14,165,233,0.10)",
                color: stats.todaySigned ? "#16A34A" : "#0EA5E9",
                borderColor: "transparent",
              }}
            >
              {stats.todaySigned ? "已完成" : "待签到"}
            </Tag>
          </View>

          <View className="mt-4">
            <Text className="mb-2 block text-xs font-medium text-slate-500">学习时长（分钟）</Text>
            <View className="flex items-center rounded-2xl bg-slate-50 px-3 py-3">
              <ClockOutlined size="16" color="#94a3b8" />
              <Input
                className="ml-2 flex-1 text-sm text-slate-900"
                type="number"
                value={duration}
                placeholder="例如 30"
                placeholderStyle="color: #94a3b8"
                onInput={(e) => setDuration(e.detail.value)}
              />
              <Text className="text-xs text-slate-400">分钟</Text>
            </View>
            <Text className="mt-2 block text-[11px] text-slate-400">建议填写真实学习时长，最少 5 分钟。</Text>
            <View className="mt-3 flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  round
                  size="small"
                  style={{
                    background: Number(duration) === preset ? "#0F766E" : "#E2E8F0",
                    color: Number(duration) === preset ? "#fff" : "#334155",
                    border: "none",
                    fontWeight: 700,
                  }}
                  onClick={() => setDuration(String(preset))}
                >
                  {preset} 分钟
                </Button>
              ))}
            </View>
          </View>

          <View className="mt-4">
            <Text className="mb-2 block text-xs font-medium text-slate-500">今日状态</Text>
            <View className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const active = option.value === status;
                return (
                  <Button
                    key={option.value}
                    round
                    size="small"
                    style={{
                      background: active ? "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)" : "#F1F5F9",
                      color: active ? "#fff" : "#334155",
                      border: "none",
                      fontWeight: 700,
                    }}
                    onClick={() => setStatus(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </View>
          </View>

          <View className="mt-4">
            <Text className="mb-2 block text-xs font-medium text-slate-500">签到备注</Text>
            <Textarea
              className="w-full rounded-2xl bg-slate-50 p-3 text-sm text-slate-900"
              value={content}
              placeholder="写一句今天的收获、状态或难点"
              placeholderStyle="color: #94a3b8"
              maxlength={500}
              autoHeight
              onInput={(e) => setContent(e.detail.value)}
            />
          </View>

          <Button
            block
            round
            size="large"
            className="mt-5"
            loading={signing}
            disabled={stats.todaySigned || durationValue < 5}
            style={{
              background: stats.todaySigned || durationValue < 5
                ? "#CBD5E1"
                : "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              boxShadow: stats.todaySigned || durationValue < 5 ? "none" : "0 10px 22px rgba(15, 118, 110, 0.22)",
            }}
            onClick={doSign}
          >
            {stats.todaySigned ? "今天已签到" : durationValue < 5 ? "至少签到 5 分钟" : "提交签到"}
          </Button>

          {todayRecord ? (
            <View className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <Text className="block text-xs font-medium text-slate-500">日历记录</Text>
              <Text className="mt-1 block text-sm font-semibold text-slate-900">
                {todayRecord.duration} 分钟 · {statusLabel(todayRecord.status)}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm" style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}>
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-2">
              <Text className="text-base font-semibold text-slate-900">
                {year}年{month}月
              </Text>
              <View className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                日历视图
              </View>
            </View>
            <View className="flex items-center gap-2">
              <Button
                round
                size="small"
                style={{ background: "#F1F5F9", color: "#334155", border: "none" }}
                onClick={() => changeMonth(-1)}
              >
                上月
              </Button>
              <Button
                round
                size="small"
                style={{ background: "#F1F5F9", color: "#334155", border: "none" }}
                onClick={() => changeMonth(1)}
              >
                下月
              </Button>
            </View>
          </View>

          <View className="mt-4 flex items-center justify-between">
            {WEEK_LABELS.map((week) => (
              <Text key={week} className="flex-1 text-center text-[11px] font-medium text-slate-400">
                {week}
              </Text>
            ))}
          </View>

          {calendarError && !calendarDays.length ? (
            <View className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5">
              <Text className="block text-sm font-medium text-rose-900">本月签到日历加载失败</Text>
              <Text className="mt-1 block text-xs leading-5 text-rose-700">{calendarError}</Text>
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
                onClick={() => fetchCalendar(year, month).catch(() => undefined)}
              >
                重试日历
              </Button>
            </View>
          ) : (
            <View className="mt-2 flex flex-wrap">
              {cells.map((cell, idx) => {
                const tone = cell.status ? statusTone(cell.status) : "neutral";
                const isSigned = cell.signed;
                return (
                  <View
                    key={`${cell.dateKey || idx}`}
                    className="flex items-center justify-center py-2"
                    style={{ width: "14.2857%" }}
                  >
                    {cell.day > 0 ? (
                      <View
                        className={`flex w-full flex-col items-center justify-center rounded-2xl border ${
                          cell.isToday && !isSigned ? "border-sky-300" : "border-slate-100"
                        }`}
                        style={{
                          minHeight: "62px",
                          background: isSigned
                            ? tone === "success"
                              ? "rgba(16,185,129,0.12)"
                              : tone === "warning"
                                ? "rgba(245,158,11,0.12)"
                                : "rgba(14,165,233,0.12)"
                            : cell.isToday
                              ? "#F8FAFC"
                              : "#fff",
                        }}
                      >
                        <Text
                          className="block text-sm font-semibold"
                          style={{ color: isSigned ? "#0F172A" : cell.isToday ? "#0F766E" : "#334155" }}
                        >
                          {cell.day}
                        </Text>
                        {isSigned ? (
                          <Text
                            className="mt-1 block text-[10px] font-medium"
                            style={{
                              color:
                                tone === "success"
                                  ? "#16A34A"
                                  : tone === "warning"
                                    ? "#D97706"
                                    : "#0EA5E9",
                            }}
                          >
                            {cell.duration}m
                          </Text>
                        ) : (
                          <Text className="mt-1 block text-[10px] text-slate-300">未签</Text>
                        )}
                      </View>
                    ) : (
                      <View style={{ minHeight: "62px", width: "100%" }} />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {calendarLoading ? (
            <View className="mt-4 flex justify-center">
              <Loading type="spinner" style={{ color: "#0F766E" }}>
                日历更新中...
              </Loading>
            </View>
          ) : null}

          {calendarError && calendarDays.length > 0 ? (
            <View className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
              <Text className="block text-sm font-medium text-amber-900">当前显示的是上次成功加载的日历</Text>
              <Text className="mt-1 block text-xs leading-5 text-amber-700">{calendarError}</Text>
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
                onClick={() => fetchCalendar(year, month).catch(() => undefined)}
              >
                重新加载日历
              </Button>
            </View>
          ) : null}

          <View className="mt-4 flex flex-wrap gap-2">
            <View className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">高效</View>
            <View className="rounded-full bg-sky-50 px-3 py-1 text-[11px] text-sky-700">正常</View>
            <View className="rounded-full bg-amber-50 px-3 py-1 text-[11px] text-amber-700">疲惫</View>
          </View>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm" style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}>
          <View className="mb-3 flex items-center justify-between">
            <Text className="text-base font-semibold text-slate-900">签到排行榜</Text>
            <View className="flex items-center gap-2 text-xs text-slate-400">
              <BarChartOutlined size="14" />
              <Text className="text-xs text-slate-400">按签到天数排序</Text>
            </View>
          </View>

          {rankError && rank.length === 0 ? (
            <View className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5">
              <Text className="block text-sm font-medium text-rose-900">排行榜加载失败</Text>
              <Text className="mt-1 block text-xs leading-5 text-rose-700">{rankError}</Text>
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
                onClick={() => fetchRank().catch(() => undefined)}
              >
                重试排行榜
              </Button>
            </View>
          ) : rank.length > 0 ? (
            <Cell.Group>
              {rank.map((user, index) => {
                const medalTone =
                  index === 0 ? "#F59E0B" : index === 1 ? "#94A3B8" : index === 2 ? "#B45309" : "#CBD5E1";

                return (
                  <Cell
                    key={user.user_id}
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                    icon={
                      <Avatar
                        src={resolveImageUrl(user.user_pic)}
                        style={{ width: "44px", height: "44px", marginRight: "12px" }}
                      />
                    }
                    title={
                      <View className="flex items-center gap-2">
                        <Text className="text-sm font-medium text-slate-900">{user.user_name || "匿名"}</Text>
                        <Tag
                          shape="rounded"
                          size="small"
                          style={{
                            background: `${medalTone}20`,
                            color: medalTone,
                            borderColor: "transparent",
                          }}
                        >
                          #{index + 1}
                        </Tag>
                      </View>
                    }
                    brief={`${user.days || 0} 天 · ${user.total_duration || 0} 分钟`}
                  />
                );
              })}
            </Cell.Group>
          ) : (
            <Empty>
              <Empty.Image />
              <Empty.Description>暂无排行榜数据</Empty.Description>
            </Empty>
          )}

          {rankError && rank.length > 0 ? (
            <View className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
              <Text className="block text-sm font-medium text-amber-900">排行榜未刷新成功</Text>
              <Text className="mt-1 block text-xs leading-5 text-amber-700">{rankError}</Text>
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
                onClick={() => fetchRank().catch(() => undefined)}
              >
                重新加载排行榜
              </Button>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
