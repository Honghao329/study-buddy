import { Button, Input, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { api, setToken } from "~/api/request";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Taro.showToast({ title: "请输入用户名", icon: "none" });
      return;
    }
    if (!password) {
      Taro.showToast({ title: "请输入密码", icon: "none" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: any }>(
        "/api/user/login",
        { username: username.trim(), password }
      );
      setToken(res.token);
      Taro.setStorageSync("userInfo", res.user);
      Taro.showToast({ title: "登录成功", icon: "success", duration: 1000 });
      setTimeout(() => {
        Taro.switchTab({ url: "/pages/index/index" });
      }, 800);
    } catch (err: any) {
      Taro.showToast({
        title: err.message || "登录失败，请重试",
        icon: "none",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-gray-1 flex flex-col items-center px-6 pt-20 pb-10">
      {/* Branding */}
      <View className="flex flex-col items-center mb-10">
        <View className="w-18 h-18 rounded-2xl bg-gradient-to-br from-blue-5 to-primary-6 flex items-center justify-center shadow-md mb-4">
          <Text className="text-3xl text-white">📖</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-8 mb-1">学习伴侣</Text>
        <Text className="text-sm text-gray-5">记录学习，结伴成长</Text>
      </View>

      {/* Login Card */}
      <View className="w-full bg-white rounded-xl shadow-sm p-6 mb-6">
        {/* Username */}
        <View className="mb-4">
          <Text className="text-sm text-gray-6 mb-2 block">用户名</Text>
          <View className="bg-gray-1 rounded-lg px-4 py-3">
            <Input
              className="w-full text-base text-gray-8"
              type="text"
              placeholder="请输入用户名"
              placeholderClass="text-gray-4"
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>
        </View>

        {/* Password */}
        <View className="mb-6">
          <Text className="text-sm text-gray-6 mb-2 block">密码</Text>
          <View className="bg-gray-1 rounded-lg px-4 py-3">
            <Input
              className="w-full text-base text-gray-8"
              type="text"
              password
              placeholder="请输入密码"
              placeholderClass="text-gray-4"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>
        </View>

        {/* Login Button */}
        <Button
          className="w-full h-11 bg-gradient-to-r from-blue-5 to-primary-6 text-white text-base font-bold rounded-lg border-none shadow-sm active:opacity-80"
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? "登录中..." : "登 录"}
        </Button>
      </View>

      {/* Footer note */}
      <View className="flex flex-col items-center mt-4">
        <Text className="text-xs text-gray-4 leading-5">
          测试账号：user1 / 123456
        </Text>
        <Text className="text-xs text-gray-4 leading-5">
          测试账号：user2 / 123456
        </Text>
      </View>
    </View>
  );
}
