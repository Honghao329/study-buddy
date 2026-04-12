import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { api, isLoggedIn } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

interface UserInfo {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
  created_at: string;
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

export default function MyPage() {
  const [logged, setLogged] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<MyStats>(defaultStats);
  const [unread, setUnread] = useState(0);

  useDidShow(() => {
    const l = isLoggedIn();
    setLogged(l);
    if (l) {
      api.get<UserInfo>("/api/user/info").then(setUser).catch(() => {});
      api.get<MyStats>("/api/user/my_stats").then((res) => setStats({ ...defaultStats, ...res })).catch(() => {});
      api.get<number>("/api/message/unread_count").then((n) => setUnread(n || 0)).catch(() => {});
    }
  });

  const nav = (url: string) => Taro.navigateTo({ url });
  const goLogin = () => nav("/pages/login/index");

  /* ---------- Not logged in ---------- */
  if (!logged) {
    return (
      <View className="min-h-screen bg-gray-1 flex flex-col items-center justify-center px-8">
        <View
          className="w-full bg-white rounded-2xl shadow-sm px-6 py-10 flex flex-col items-center"
          onClick={goLogin}
        >
          <View className="w-16 h-16 rounded-full bg-blue-1 flex items-center justify-center mb-4">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="text-lg font-bold text-gray-8 mb-2">登录开启学习之旅</Text>
          <Text className="text-sm text-gray-5">签到打卡、结交伙伴、共同成长</Text>
        </View>
      </View>
    );
  }

  /* ---------- Stats row config ---------- */
  const statItems = [
    { label: "笔记", value: stats.noteCount, tap: () => nav("/pages/note-list/index") },
    { label: "打卡", value: stats.checkinCount, tap: () => Taro.switchTab({ url: "/pages/checkin-list/index" }) },
    { label: "签到", value: stats.signDays, tap: () => nav("/pages/sign/index") },
    { label: "伙伴", value: stats.partnerCount, tap: () => nav("/pages/partner/index") },
  ];

  /* ---------- Menu config ---------- */
  const menuGroups: {
    items: { icon: string; label: string; badge?: number; tap: () => void }[];
  }[] = [
    {
      items: [
        { icon: "📝", label: "我的笔记", tap: () => nav("/pages/note-list/index") },
        { icon: "⭐", label: "我的收藏", tap: () => nav("/pages/favorite/index") },
        { icon: "🤝", label: "我的伙伴", tap: () => nav("/pages/partner/index") },
      ],
    },
    {
      items: [
        { icon: "🔔", label: "消息通知", badge: unread, tap: () => nav("/pages/messages/index") },
      ],
    },
    {
      items: [
        { icon: "📅", label: "签到日历", tap: () => nav("/pages/sign/index") },
      ],
    },
    {
      items: [
        {
          icon: "⚙️",
          label: "设置",
          tap: () => Taro.showToast({ title: "设置页开发中", icon: "none" }),
        },
      ],
    },
  ];

  return (
    <View className="min-h-screen bg-gray-1 pb-6">
      {/* ===== User Info Card ===== */}
      <View
        className="mx-4 mt-4 bg-white rounded-2xl shadow-sm px-5 py-6 flex items-center"
        onClick={() => nav("/pages/my-edit/index")}
      >
        <Image
          className="w-16 h-16 rounded-full bg-gray-2 flex-shrink-0"
          src={resolveImageUrl(user?.avatar) || "https://via.placeholder.com/160"}
          mode="aspectFill"
        />
        <View className="ml-4 flex-1 overflow-hidden">
          <Text className="text-lg font-bold text-gray-8 block truncate">
            {user?.nickname || "学习达人"}
          </Text>
          <Text className="text-sm text-gray-5 mt-1 block truncate">
            {user?.bio || "这个人很懒，什么都没留下~"}
          </Text>
        </View>
        <Text className="text-gray-4 text-xl ml-2">›</Text>
      </View>

      {/* ===== Stats Row ===== */}
      <View className="mx-4 mt-3 bg-white rounded-2xl shadow-sm flex items-center py-4">
        {statItems.map((s, i) => (
          <View
            key={s.label}
            className={`flex-1 flex flex-col items-center ${
              i < statItems.length - 1 ? "border-r border-gray-2" : ""
            }`}
            onClick={s.tap}
          >
            <Text className="text-xl font-bold text-gray-8">{s.value}</Text>
            <Text className="text-xs text-gray-5 mt-1">{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ===== Menu Groups ===== */}
      {menuGroups.map((group, gi) => (
        <View key={gi} className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          {group.items.map((item, ii) => (
            <View
              key={item.label}
              className={`flex items-center px-5 py-4 ${
                ii < group.items.length - 1 ? "border-b border-gray-1" : ""
              }`}
              onClick={item.tap}
            >
              <Text className="text-xl mr-3">{item.icon}</Text>
              <Text className="flex-1 text-base text-gray-8">{item.label}</Text>
              {!!item.badge && item.badge > 0 && (
                <View className="bg-red-5 rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 mr-2">
                  <Text className="text-white text-xs font-bold">
                    {item.badge > 99 ? "99+" : item.badge}
                  </Text>
                </View>
              )}
              <Text className="text-gray-4 text-lg">›</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
