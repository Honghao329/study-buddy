import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import {
  Bell,
  Edit,
  Lock,
  StarOutlined,
  UserCircleOutlined,
} from "@taroify/icons";
import { Avatar, Badge, Button, Cell, Loading } from "@taroify/core";
import { api, clearToken, isLoggedIn } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

interface UserInfo {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
}

interface MyStats {
  noteCount: number;
  checkinCount: number;
  signDays: number;
  partnerCount: number;
}

const defaultStats: MyStats = {
  noteCount: 0,
  checkinCount: 0,
  signDays: 0,
  partnerCount: 0,
};

/** Small colored circle behind a menu icon, iOS-settings style */
function IconCircle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </View>
  );
}

export default function MyPage() {
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<MyStats>(defaultStats);
  const [unread, setUnread] = useState(0);
  const [dashboardError, setDashboardError] = useState("");
  const [partialWarning, setPartialWarning] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setDashboardError("");
    setPartialWarning("");
    try {
      const [userResult, statsResult, unreadResult] = await Promise.allSettled([
        api.get<UserInfo>("/api/user/info"),
        api.get<MyStats>("/api/user/my_stats"),
        api.get<number>("/api/message/unread_count"),
      ]);

      if (userResult.status === "rejected") {
        const message = userResult.reason instanceof Error ? userResult.reason.message : "个人中心加载失败";
        setUser(null);
        setStats(defaultStats);
        setUnread(0);
        setDashboardError(message || "个人中心加载失败");
        return;
      }

      setUser(userResult.value);
      setStats(
        statsResult.status === "fulfilled"
          ? { ...defaultStats, ...statsResult.value }
          : defaultStats,
      );
      setUnread(
        unreadResult.status === "fulfilled"
          ? Number(unreadResult.value || 0)
          : 0,
      );

      const failedParts = [
        statsResult.status === "rejected" ? "统计数据" : "",
        unreadResult.status === "rejected" ? "消息提醒" : "",
      ].filter(Boolean);

      if (failedParts.length > 0) {
        setPartialWarning(`${failedParts.join("、")}加载失败，当前展示的是可用信息。`);
      }
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    const currentLogged = isLoggedIn();
    setLogged(currentLogged);

    if (currentLogged) {
      loadDashboard();
    } else {
      setLoading(false);
      setUser(null);
      setStats(defaultStats);
      setUnread(0);
      setDashboardError("");
      setPartialWarning("");
    }
  });

  const nav = (url: string) => Taro.navigateTo({ url });
  const goLogin = () => nav("/pages/login/index");
  const goCheckinList = () => Taro.switchTab({ url: "/pages/checkin-list/index" });
  const goMessages = () => nav("/pages/messages/index");
  const goSign = () => nav("/pages/sign/index");
  const goEdit = () => nav("/pages/my-edit/index");
  const goMyNotes = () => nav("/pages/note-list/index");
  const goFavorite = () => nav("/pages/favorite/index");
  const goPartner = () => nav("/pages/partner/index");

  const handleLogout = () => {
    Taro.showModal({
      title: "退出登录",
      content: "确定要退出当前账号吗？",
      confirmColor: "#EF4444",
      success: (res) => {
        if (!res.confirm) return;
        clearToken();
        setLogged(false);
        setUser(null);
        setStats(defaultStats);
        setUnread(0);
        Taro.showToast({ title: "已退出登录", icon: "success" });
      },
    });
  };

  const statItems: { label: string; value: number; color: string; onClick: () => void }[] = [
    { label: "笔记", value: stats.noteCount, color: "#3B82F6", onClick: goMyNotes },
    { label: "打卡", value: stats.checkinCount, color: "#22C55E", onClick: goCheckinList },
    { label: "签到", value: stats.signDays, color: "#F59E0B", onClick: goSign },
    { label: "学伴", value: stats.partnerCount, color: "#A855F7", onClick: goPartner },
  ];

  const handleChangePassword = () => {
    nav("/pages/change-password/index");
  };

  /* ─── Not logged in ─── */
  if (!logged) {
    return (
      <View className="min-h-screen px-4 py-4" style={{ background: "#F7F8FA" }}>
        <View
          className="relative overflow-hidden rounded-[28px] px-5 py-8"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #134E4A 55%, #1D4ED8 140%)",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
          }}
        >
          <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
          <View className="absolute bottom-2 left-6 h-16 w-16 rounded-full bg-emerald-300/10" />

          <View className="flex items-center">
            <Avatar
              size="large"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                flexShrink: 0,
              }}
            >
              <UserCircleOutlined size="40" color="#fff" />
            </Avatar>
            <View className="ml-4 flex-1 min-w-0">
              <Text className="block text-xl font-semibold text-white">登录开启学习之旅</Text>
              <Text className="mt-1 block text-sm leading-6 text-white/70">
                登录后可以统一查看笔记、打卡、签到和学伴状态。
              </Text>
            </View>
          </View>

          <View className="mt-5 flex flex-wrap gap-2 text-xs text-white/80">
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">笔记管理</View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">打卡任务</View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">签到日历</View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">伙伴邀请</View>
          </View>

          <Button
            block
            round
            size="large"
            className="mt-6"
            style={{
              background: "#fff",
              color: "#0F172A",
              border: "none",
              fontWeight: 700,
              boxShadow: "0 8px 24px rgba(255,255,255,0.14)",
            }}
            onClick={goLogin}
          >
            立即登录
          </Button>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="block text-sm font-semibold text-slate-900">你登录后会得到什么</Text>
          <View className="mt-4 space-y-3">
            <View className="flex items-start gap-3">
              <View className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
              <Text className="flex-1 text-sm leading-6 text-slate-600">统一查看今天的打卡任务和签到入口。</Text>
            </View>
            <View className="flex items-start gap-3">
              <View className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <Text className="flex-1 text-sm leading-6 text-slate-600">管理自己的笔记、收藏和学伴关系。</Text>
            </View>
            <View className="flex items-start gap-3">
              <View className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
              <Text className="flex-1 text-sm leading-6 text-slate-600">查看消息提醒与连续签到统计。</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  /* ─── Loading ─── */
  if (loading && !user) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8FA" }}>
        <Loading type="spinner" style={{ color: "#0F766E" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  /* ─── Dashboard error ─── */
  if (dashboardError && !user) {
    return (
      <View className="min-h-screen px-4 py-4" style={{ background: "#F7F8FA" }}>
        <View
          className="relative overflow-hidden rounded-[28px] px-5 py-5"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #7F1D1D 55%, #B91C1C 130%)",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.16)",
          }}
        >
          <View className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <View className="absolute bottom-0 left-8 h-16 w-16 rounded-full bg-rose-200/10" />

          <Text className="block text-xl font-semibold text-white">个人中心暂时不可用</Text>
          <Text className="mt-2 block text-sm leading-6 text-white/75">
            {dashboardError}
          </Text>

          <View className="mt-5 flex gap-3">
            <Button
              round
              size="small"
              style={{
                background: "#fff",
                color: "#0F172A",
                border: "none",
                fontWeight: 700,
              }}
              onClick={loadDashboard}
            >
              重新加载
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
              onClick={handleLogout}
            >
              退出当前账号
            </Button>
          </View>
        </View>
      </View>
    );
  }

  /* ─── Main logged-in view ─── */
  return (
    <View className="min-h-screen pb-8" style={{ background: "#F7F8FA" }}>
      {/* ── User card with gradient ── */}
      <View className="px-4 pt-4">
        <View
          className="relative overflow-hidden rounded-2xl px-5 py-5"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #134E4A 52%, #0F766E 120%)",
          }}
        >
          <View className="flex items-start">
            <Avatar
              size="large"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {user?.avatar ? (
                <Image
                  src={resolveImageUrl(user.avatar)}
                  mode="aspectFill"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <UserCircleOutlined size="40" color="#fff" />
              )}
            </Avatar>

            <View className="ml-4 flex-1 min-w-0">
              <View className="flex items-center gap-2">
                <Text className="text-xl font-semibold text-white">
                  {user?.nickname || "学习达人"}
                </Text>
                {unread > 0 ? (
                  <Badge content={unread > 99 ? "99+" : unread}>
                    <View className="size-1" />
                  </Badge>
                ) : null}
              </View>
              <Text className="mt-1 block text-sm leading-6 text-white/70">
                {user?.bio || "给自己留一句简介，方便伙伴更快认识你。"}
              </Text>
            </View>
          </View>

          <View className="mt-5 flex gap-3">
            <Button
              round
              size="small"
              style={{
                background: "#fff",
                color: "#0F172A",
                border: "none",
                fontWeight: 700,
              }}
              onClick={goEdit}
            >
              编辑资料
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
              onClick={goMessages}
            >
              消息通知
            </Button>
          </View>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View
        className="mx-4 mt-3 flex rounded-xl overflow-hidden"
        style={{ background: "#fff" }}
      >
        {statItems.map((s, i) => (
          <View
            key={s.label}
            className="flex-1 flex flex-col items-center py-4"
            style={{ borderRight: i < 3 ? "1px solid #F2F3F5" : "none" }}
            onClick={s.onClick}
          >
            <Text style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</Text>
            <Text className="mt-1" style={{ fontSize: 12, color: "#999" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Partial warning ── */}
      {partialWarning ? (
        <View className="mx-4 mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <View className="flex items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="block text-sm font-semibold text-amber-900">部分信息暂未同步</Text>
              <Text className="mt-1 block text-xs leading-5 text-amber-700">
                {partialWarning}
              </Text>
            </View>
            <Button
              round
              size="small"
              style={{
                background: "#fff",
                color: "#92400E",
                border: "1px solid rgba(146,64,14,0.10)",
                fontWeight: 700,
                flexShrink: 0,
              }}
              onClick={loadDashboard}
            >
              重试
            </Button>
          </View>
        </View>
      ) : null}

      {/* ── Menu sections ── */}
      <View className="mt-5 px-4">
        <Cell.Group inset style={{ borderRadius: 12, overflow: "hidden" }}>
          <Cell
            icon={
              <IconCircle color="#3B82F6">
                <Edit size="16" color="#fff" />
              </IconCircle>
            }
            title="我的笔记"
            isLink
            onClick={goMyNotes}
          />
          <Cell
            icon={
              <IconCircle color="#F59E0B">
                <StarOutlined size="16" color="#fff" />
              </IconCircle>
            }
            title="我的收藏"
            isLink
            onClick={goFavorite}
          />
        </Cell.Group>
      </View>

      <View className="mt-3 px-4">
        <Cell.Group inset style={{ borderRadius: 12, overflow: "hidden" }}>
          <Cell
            icon={
              <IconCircle color="#EF4444">
                <Bell size="16" color="#fff" />
              </IconCircle>
            }
            title="消息通知"
            isLink
            onClick={goMessages}
            rightIcon={
              unread > 0 ? (
                <Badge content={unread > 99 ? "99+" : unread}>
                  <View className="size-1" />
                </Badge>
              ) : undefined
            }
          />
        </Cell.Group>
      </View>

      <View className="mt-3 px-4">
        <Cell.Group inset style={{ borderRadius: 12, overflow: "hidden" }}>
          <Cell
            icon={
              <IconCircle color="#0F766E">
                <UserCircleOutlined size="16" color="#fff" />
              </IconCircle>
            }
            title="编辑资料"
            isLink
            onClick={goEdit}
          />
          <Cell
            icon={
              <IconCircle color="#6366F1">
                <Lock size="16" color="#fff" />
              </IconCircle>
            }
            title="修改密码"
            isLink
            onClick={handleChangePassword}
          />
        </Cell.Group>
      </View>

      <View className="mt-3 px-4">
        <Cell.Group inset style={{ borderRadius: 12, overflow: "hidden" }}>
          <Cell
            icon={
              <IconCircle color="#9CA3AF">
                <Lock size="16" color="#fff" />
              </IconCircle>
            }
            title="退出登录"
            isLink
            onClick={handleLogout}
          />
        </Cell.Group>
      </View>
    </View>
  );
}
