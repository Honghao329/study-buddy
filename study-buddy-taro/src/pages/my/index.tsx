import { View, Text } from "@tarojs/components"
import Taro, { useDidShow } from "@tarojs/taro"
import { useState } from "react"
import { Avatar, Badge, Button, Cell, Image } from "@taroify/core"
import {
  FriendsOutlined,
  StarOutlined,
  BullhornOutlined,
  CalendarOutlined,
  SettingOutlined,
  Arrow,
} from "@taroify/icons"
import { api, isLoggedIn } from "~/api/request"
import { resolveImageUrl } from "~/utils/imageUrl"

interface UserInfo {
  id: number
  nickname: string
  avatar: string
  bio: string
}

interface MyStats {
  note_cnt: number
  checkin_cnt: number
  sign_days: number
  partner_cnt: number
  fav_cnt: number
}

const defaultStats: MyStats = {
  note_cnt: 0,
  checkin_cnt: 0,
  sign_days: 0,
  partner_cnt: 0,
  fav_cnt: 0,
}

export default function MyPage() {
  const [logged, setLogged] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<MyStats>(defaultStats)
  const [unread, setUnread] = useState(0)

  useDidShow(() => {
    const l = isLoggedIn()
    setLogged(l)
    if (l) {
      api.get<UserInfo>("/api/user/info").then(setUser).catch(() => {})
      api
        .get<MyStats>("/api/user/my_stats")
        .then((res) => setStats({ ...defaultStats, ...res }))
        .catch(() => {})
      api
        .get<number>("/api/message/unread_count")
        .then((n) => setUnread(n || 0))
        .catch(() => {})
    }
  })

  const nav = (url: string) => Taro.navigateTo({ url })
  const goLogin = () => nav("/pages/login/index")

  /* ========== Not logged in ========== */
  if (!logged) {
    return (
      <View
        className="min-h-screen flex flex-col items-center justify-center px-8"
        style={{ background: "#F7F8FA" }}
      >
        <View
          className="w-full rounded-2xl px-6 py-12 flex flex-col items-center"
          style={{ background: "#FFF", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <Avatar
            size={64}
            style={{
              background: "linear-gradient(135deg, #E8FAE6 0%, #D0F0C0 100%)",
              marginBottom: "16px",
            }}
          >
            <Text className="text-3xl">👤</Text>
          </Avatar>
          <Text className="text-lg font-bold mb-2" style={{ color: "#1A1A1A" }}>
            登录开启学习之旅
          </Text>
          <Text className="text-sm mb-6" style={{ color: "#999" }}>
            签到打卡、结交伙伴、共同成长
          </Text>
          <Button
            block
            round
            size="large"
            style={{
              background: "linear-gradient(135deg, #58CC02 0%, #46A302 100%)",
              color: "#FFF",
              fontWeight: "bold",
              border: "none",
              boxShadow: "0 4px 16px rgba(88,204,2,0.3)",
            }}
            onClick={goLogin}
          >
            立即登录
          </Button>
        </View>
      </View>
    )
  }

  /* ========== Stats config ========== */
  const statItems: { label: string; value: number; color: string; tap: () => void }[] = [
    {
      label: "笔记",
      value: stats.note_cnt,
      color: "#58CC02",
      tap: () => nav("/pages/note-list/index"),
    },
    {
      label: "打卡",
      value: stats.checkin_cnt,
      color: "#1CB0F6",
      tap: () => Taro.switchTab({ url: "/pages/checkin-list/index" }),
    },
    {
      label: "签到",
      value: stats.sign_days,
      color: "#FF9500",
      tap: () => nav("/pages/sign/index"),
    },
    {
      label: "伙伴",
      value: stats.partner_cnt,
      color: "#FF4B4B",
      tap: () => nav("/pages/partner/index"),
    },
  ]

  return (
    <View className="min-h-screen pb-6" style={{ background: "#F7F8FA" }}>
      {/* ===== User Card ===== */}
      <View
        className="mx-4 mt-4 rounded-2xl px-5 py-5 flex items-center"
        style={{ background: "#FFF", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
        onClick={() => nav("/pages/my-edit/index")}
      >
        <Avatar
          size={64}
          style={{ flexShrink: 0, background: "#F0F0F0" }}
        >
          {user?.avatar ? (
            <Image
              src={resolveImageUrl(user.avatar)}
              mode="aspectFill"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <Text className="text-2xl">👤</Text>
          )}
        </Avatar>

        <View className="ml-4 flex-1 overflow-hidden">
          <Text className="text-lg font-bold block truncate" style={{ color: "#1A1A1A" }}>
            {user?.nickname || "学习达人"}
          </Text>
          <Text className="text-sm mt-1 block truncate" style={{ color: "#999" }}>
            {user?.bio || "这个人很懒，什么都没留下~"}
          </Text>
        </View>

        <Arrow color="#C0C0C0" />
      </View>

      {/* ===== Stats Grid ===== */}
      <View
        className="mx-4 mt-3 rounded-2xl flex items-center py-5"
        style={{ background: "#FFF", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
      >
        {statItems.map((s, i) => (
          <View
            key={s.label}
            className={`flex-1 flex flex-col items-center ${
              i < statItems.length - 1 ? "border-r border-gray-2" : ""
            }`}
            onClick={s.tap}
          >
            <Text className="text-xl font-bold" style={{ color: s.color }}>
              {s.value}
            </Text>
            <Text className="text-xs mt-1" style={{ color: "#999" }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* ===== Menu Group 1: Content ===== */}
      <View className="mx-4 mt-3 rounded-2xl overflow-hidden"
        style={{ background: "#FFF", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
      >
        <Cell.Group>
          <Cell
            icon={<StarOutlined color="#58CC02" />}
            title="我的笔记"
            isLink
            onClick={() => nav("/pages/note-list/index")}
          />
          <Cell
            icon={<StarOutlined color="#FF9500" />}
            title="我的收藏"
            isLink
            onClick={() => nav("/pages/favorite/index")}
          />
          <Cell
            icon={<FriendsOutlined color="#1CB0F6" />}
            title="我的伙伴"
            isLink
            onClick={() => nav("/pages/partner/index")}
          />
        </Cell.Group>
      </View>

      {/* ===== Menu Group 2: Messages ===== */}
      <View className="mx-4 mt-3 rounded-2xl overflow-hidden"
        style={{ background: "#FFF", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
      >
        <Cell.Group>
          <Cell
            icon={<BullhornOutlined color="#FF4B4B" />}
            title="消息通知"
            isLink
            onClick={() => nav("/pages/messages/index")}
            rightIcon={
              unread > 0 ? (
                <View className="flex items-center">
                  <Badge content={unread > 99 ? "99+" : unread}>
                    <View />
                  </Badge>
                  <Arrow className="ml-1" color="#C0C0C0" />
                </View>
              ) : (
                <Arrow color="#C0C0C0" />
              )
            }
          />
        </Cell.Group>
      </View>

      {/* ===== Menu Group 3: Check-in ===== */}
      <View className="mx-4 mt-3 rounded-2xl overflow-hidden"
        style={{ background: "#FFF", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
      >
        <Cell.Group>
          <Cell
            icon={<CalendarOutlined color="#FF9500" />}
            title="签到日历"
            isLink
            onClick={() => nav("/pages/sign/index")}
          />
        </Cell.Group>
      </View>

      {/* ===== Menu Group 4: Settings ===== */}
      <View className="mx-4 mt-3 rounded-2xl overflow-hidden"
        style={{ background: "#FFF", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
      >
        <Cell.Group>
          <Cell
            icon={<SettingOutlined color="#666" />}
            title="设置"
            isLink
            onClick={() =>
              Taro.showToast({ title: "设置页开发中", icon: "none" })
            }
          />
        </Cell.Group>
      </View>
    </View>
  )
}
