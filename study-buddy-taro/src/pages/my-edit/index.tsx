import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { Avatar, Button, Cell, Empty, Field, Loading } from "@taroify/core";
import { api, isLoggedIn } from "~/api/request";
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
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loadError, setLoadError] = useState("");

  const fetchUserInfo = async () => {
    if (!isLoggedIn()) {
      setRequiresLogin(true);
      setLoadError("");
      setLoading(false);
      return;
    }

    setRequiresLogin(false);
    setLoading(true);
    try {
      const res = await api.get<UserInfo>("/api/user/info");
      setNickname(res.nickname || "");
      setBio(res.bio || "");
      setAvatar(resolveImageUrl(res.avatar));
      setLoadError("");
    } catch (error: any) {
      setLoadError(error?.message || "资料加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    fetchUserInfo();
  });

  const handleChooseAvatar = async () => {
    if (!isLoggedIn()) {
      goLogin();
      return;
    }
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
    if (!isLoggedIn()) {
      goLogin();
      return;
    }
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

  const goLogin = () => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent("/pages/my-edit/index")}`,
    });
  };

  if (loading) {
    return (
      <View
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F7F8FA" }}
      >
        <Loading type="spinner" style={{ color: "#1CB0F6" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  if (requiresLogin) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#F7F8FA" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>登录后才能编辑个人资料</Empty.Description>
        </Empty>
        <Button
          round
          size="small"
          className="mt-4"
          style={{ backgroundColor: "#1CB0F6", color: "#fff", border: "none", fontWeight: "bold" }}
          onClick={goLogin}
        >
          去登录
        </Button>
      </View>
    );
  }

  if (loadError) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#F7F8FA" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>{loadError}</Empty.Description>
        </Empty>
        <Button
          round
          size="small"
          className="mt-4"
          style={{ backgroundColor: "#1CB0F6", color: "#fff", border: "none", fontWeight: "bold" }}
          onClick={fetchUserInfo}
        >
          重试
        </Button>
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-40" style={{ backgroundColor: "#F7F8FA" }}>
      {/* Avatar section */}
      <View
        className="mt-12 mx-12 rounded-2xl flex flex-col items-center py-28"
        style={{
          backgroundColor: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <View
          className="relative"
          onClick={handleChooseAvatar}
          style={{ cursor: "pointer" }}
        >
          <Avatar
            src={resolveImageUrl(avatar)}
            style={{
              width: "80px",
              height: "80px",
              border: "3px solid #fff",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}
          />
          <View
            className="absolute inset-0 flex items-center justify-center"
            style={{
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <Text style={{ fontSize: "11px", color: "#fff", fontWeight: "500" }}>
              更换头像
            </Text>
          </View>
        </View>
        <Text
          className="mt-10"
          style={{ fontSize: "12px", color: "#bbb" }}
        >
          点击更换头像
        </Text>
      </View>

      {/* Form fields */}
      <View
        className="mt-12 mx-12 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <Cell.Group>
          <Field
            label="昵称"
            value={nickname}
            placeholder="请输入昵称"
            maxlength={20}
            onChange={(e) => setNickname(e)}
          />
          <Field
            label="个性签名"
            type="textarea"
            value={bio}
            placeholder="介绍一下自己吧"
            maxlength={200}
            autoHeight
            onChange={(e) => setBio(e)}
            style={{ minHeight: "100px" }}
          />
        </Cell.Group>
      </View>

      {/* Save button */}
      <View className="px-24 mt-28">
        <Button
          type="primary"
          block
          round
          size="large"
          loading={saving}
          disabled={saving}
          onClick={handleSave}
          style={{
            backgroundColor: "#1CB0F6",
            borderColor: "#1CB0F6",
            fontWeight: "bold",
            fontSize: "16px",
            boxShadow: "0 4px 16px rgba(28,176,246,0.35)",
          }}
        >
          {saving ? "保存中..." : "保存"}
        </Button>
      </View>
    </View>
  );
}
