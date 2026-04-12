import { View, Text } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { useState } from "react"
import { Button, Field, Toast } from "@taroify/core"
import { api, setToken } from "~/api/request"

export default function LoginPage() {
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastOpen(true)
  }

  const handleLogin = async () => {
    if (!nickname.trim()) {
      showToast("请输入昵称")
      return
    }
    if (!password) {
      showToast("请输入密码")
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: any }>(
        "/api/user/login",
        { nickname: nickname.trim(), password }
      )
      setToken(res.token)
      Taro.setStorageSync("userInfo", res.user)
      Taro.showToast({ title: "登录成功", icon: "success", duration: 1000 })
      setTimeout(() => {
        Taro.switchTab({ url: "/pages/index/index" })
      }, 800)
    } catch (err: any) {
      showToast(err.message || "登录失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen flex flex-col items-center px-6 pt-24 pb-10"
      style={{ background: "linear-gradient(180deg, #E8FAE6 0%, #F7F8FA 40%)" }}
    >
      {/* ===== App Icon ===== */}
      <View
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{
          background: "linear-gradient(135deg, #58CC02 0%, #46A302 100%)",
          boxShadow: "0 8px 24px rgba(88,204,2,0.35)",
        }}
      >
        <Text className="text-4xl">📖</Text>
      </View>

      {/* ===== Branding ===== */}
      <Text className="text-2xl font-bold mb-1" style={{ color: "#1A1A1A" }}>
        学习伴侣
      </Text>
      <Text className="text-sm mb-10" style={{ color: "#999" }}>
        记录学习，结伴成长
      </Text>

      {/* ===== Login Card ===== */}
      <View
        className="w-full rounded-2xl px-5 pt-6 pb-7 mb-6"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <Field
          label="昵称"
          placeholder="请输入昵称"
          value={nickname}
          onChange={(val) => setNickname(val)}
        />

        <Field
          label="密码"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(val) => setPassword(val)}
          className="mt-2"
        />

        <View className="mt-7">
          <Button
            block
            round
            size="large"
            loading={loading}
            style={{
              background: "linear-gradient(135deg, #58CC02 0%, #46A302 100%)",
              color: "#FFFFFF",
              fontWeight: "bold",
              fontSize: "16px",
              border: "none",
              boxShadow: "0 4px 16px rgba(88,204,2,0.3)",
            }}
            onClick={handleLogin}
          >
            登 录
          </Button>
        </View>
      </View>

      {/* ===== Test account hints ===== */}
      <View className="flex flex-col items-center mt-4">
        <Text className="text-xs leading-6" style={{ color: "#C0C0C0" }}>
          测试账号：user1 / 123456
        </Text>
        <Text className="text-xs leading-6" style={{ color: "#C0C0C0" }}>
          测试账号：user2 / 123456
        </Text>
      </View>

      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        {toastMsg}
      </Toast>
    </View>
  )
}
