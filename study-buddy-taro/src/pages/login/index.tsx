import { Input, Text, View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { useRef, useState } from "react"
import { Button } from "@taroify/core"
import { api, setToken } from "~/api/request"

export default function LoginPage() {
  const nicknameRef = useRef("")
  const passwordRef = useRef("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const nickname = nicknameRef.current.trim()
    const password = passwordRef.current

    if (!nickname) {
      Taro.showToast({ title: "请输入昵称", icon: "none" })
      return
    }
    if (!password) {
      Taro.showToast({ title: "请输入密码", icon: "none" })
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: any }>(
        "/api/user/login",
        { nickname, password }
      )
      setToken(res.token)
      Taro.setStorageSync("userInfo", res.user)
      Taro.showToast({ title: "登录成功", icon: "success", duration: 1000 })
      setTimeout(() => {
        Taro.switchTab({ url: "/pages/index/index" })
      }, 800)
    } catch (err: any) {
      Taro.showToast({
        title: err.message || "登录失败，请重试",
        icon: "none",
        duration: 2000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View
      className="min-h-screen flex flex-col items-center px-6 pt-24 pb-10"
      style={{ background: "linear-gradient(180deg, #E8FAE6 0%, #F7F8FA 40%)" }}
    >
      <View
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{
          background: "linear-gradient(135deg, #58CC02 0%, #46A302 100%)",
          boxShadow: "0 8px 24px rgba(88,204,2,0.35)",
        }}
      >
        <Text className="text-4xl">📖</Text>
      </View>

      <Text className="text-2xl font-bold mb-1" style={{ color: "#1A1A1A" }}>
        学习伴侣
      </Text>
      <Text className="text-sm mb-10" style={{ color: "#999" }}>
        记录学习，结伴成长
      </Text>

      <View
        className="w-full rounded-2xl px-5 pt-6 pb-7 mb-6"
        style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
      >
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2 block" style={{ color: "#666" }}>昵称</Text>
          <Input
            className="w-full text-base"
            style={{
              background: "#F7F8FA",
              borderRadius: "10px",
              padding: "12px 16px",
              color: "#333",
            }}
            placeholder="请输入昵称"
            placeholderStyle="color: #C0C0C0"
            onInput={(e) => { nicknameRef.current = e.detail.value }}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium mb-2 block" style={{ color: "#666" }}>密码</Text>
          <Input
            className="w-full text-base"
            style={{
              background: "#F7F8FA",
              borderRadius: "10px",
              padding: "12px 16px",
              color: "#333",
            }}
            password
            placeholder="请输入密码"
            placeholderStyle="color: #C0C0C0"
            onInput={(e) => { passwordRef.current = e.detail.value }}
          />
        </View>

        <Button
          block
          round
          size="large"
          loading={loading}
          style={{
            background: "linear-gradient(135deg, #58CC02 0%, #46A302 100%)",
            color: "#fff",
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

      <View className="flex flex-col items-center mt-4">
        <Text className="text-xs leading-6" style={{ color: "#C0C0C0" }}>
          测试账号：user1 / 123456
        </Text>
        <Text className="text-xs leading-6" style={{ color: "#C0C0C0" }}>
          测试账号：user2 / 123456
        </Text>
      </View>
    </View>
  )
}
