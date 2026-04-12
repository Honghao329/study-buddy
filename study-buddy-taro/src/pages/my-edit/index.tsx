import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { api } from "~/api/request";
import { joinApiUrl } from "~/utils/apiBase";
import { resolveImageUrl } from "~/utils/imageUrl";

interface UserInfo {
  nickname: string;
  avatar: string;
  bio: string;
}

export default function MyEditPage() {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const res = await api.get<UserInfo>("/api/user/info");
      setNickname(res.nickname || "");
      setBio(res.bio || "");
      setAvatar(resolveImageUrl(res.avatar));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    fetchUserInfo();
  });

  const handleChooseAvatar = async () => {
    try {
      const chooseRes = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });
      const tempPath = chooseRes.tempFilePaths[0];
      if (!tempPath) return;

      Taro.showLoading({ title: "上传中..." });
      const token = Taro.getStorageSync("token") || "";
      const uploadRes = await Taro.uploadFile({
        url: joinApiUrl("/api/upload/image"),
        filePath: tempPath,
        name: "file",
        header: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = JSON.parse(uploadRes.data);
      if (data.code === 200 && data.data?.url) {
        setAvatar(resolveImageUrl(data.data.url));
        Taro.showToast({ title: "上传成功", icon: "success" });
      } else {
        Taro.showToast({ title: "上传失败", icon: "none" });
      }
    } catch {
      Taro.showToast({ title: "上传失败", icon: "none" });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!nickname.trim()) {
      Taro.showToast({ title: "请输入昵称", icon: "none" });
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/user/update", {
        nickname: nickname.trim(),
        bio: bio.trim(),
        avatar,
      });
      Taro.showToast({ title: "保存成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1000);
    } catch {
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-1 flex items-center justify-center">
        <Text className="text-sm text-gray-4">加载中...</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* Avatar section */}
      <View className="bg-white mt-12 mx-12 rounded-xl shadow-sm p-24 flex flex-col items-center">
        <View className="relative" onClick={handleChooseAvatar}>
          <Image
            className="w-80 h-80 rounded-full bg-gray-2"
            src={resolveImageUrl(avatar) || "https://via.placeholder.com/160"}
            mode="aspectFill"
          />
          <View className="absolute inset-0 rounded-full bg-black bg-opacity-30 flex items-center justify-center">
            <Text className="text-xs text-white">更换头像</Text>
          </View>
        </View>
      </View>

      {/* Form fields */}
      <View className="bg-white mt-12 mx-12 rounded-xl shadow-sm">
        {/* Nickname */}
        <View className="px-16 py-16 flex items-center border-b border-gray-1">
          <Text className="text-sm text-gray-6 w-64 shrink-0">昵称</Text>
          <Input
            className="flex-1 text-sm text-gray-8"
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
            placeholder="请输入昵称"
            placeholderClass="text-gray-4"
            maxlength={20}
          />
        </View>

        {/* Bio */}
        <View className="px-16 py-16">
          <Text className="block text-sm text-gray-6 mb-8">个性签名</Text>
          <Textarea
            className="w-full text-sm text-gray-8 min-h-80"
            value={bio}
            onInput={(e) => setBio(e.detail.value)}
            placeholder="介绍一下自己吧"
            placeholderClass="text-gray-4"
            maxlength={200}
            autoHeight
          />
        </View>
      </View>

      {/* Save button */}
      <View className="px-12 mt-24">
        <View
          className={`w-full py-12 rounded-full text-center active:opacity-80 ${
            saving ? "bg-gray-3" : "bg-primary-6"
          }`}
          onClick={handleSave}
        >
          <Text className="text-base font-medium text-white">
            {saving ? "保存中..." : "保存"}
          </Text>
        </View>
      </View>
    </View>
  );
}
