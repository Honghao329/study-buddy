import { Input, Text, Textarea, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { api } from "~/api/request";

export default function NoteAddPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const handlePublish = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/api/note/create", {
        title: title.trim(),
        content: content.trim(),
        is_public: isPublic ? 1 : 0,
      });
      Taro.showToast({ title: "发布成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1200);
    } catch {
      Taro.showToast({ title: "发布失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="min-h-screen bg-gray-1">
      {/* Title input */}
      <View className="bg-white mx-12 mt-12 rounded-xl shadow-sm px-16 py-12">
        <Input
          className="w-full text-lg font-bold text-gray-8"
          placeholder="输入笔记标题"
          placeholderClass="text-gray-4"
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
          maxlength={100}
        />
      </View>

      {/* Content textarea */}
      <View className="bg-white mx-12 mt-12 rounded-xl shadow-sm px-16 py-12">
        <Textarea
          className="w-full text-base text-gray-6 leading-relaxed"
          placeholder="写下你的学习笔记..."
          placeholderClass="text-gray-4"
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={5000}
          autoHeight
          style={{ minHeight: "240px" }}
        />
        <View className="flex justify-end mt-8">
          <Text className="text-xs text-gray-4">{content.length}/5000</Text>
        </View>
      </View>

      {/* Visibility toggle */}
      <View className="bg-white mx-12 mt-12 rounded-xl shadow-sm px-16 py-14 flex items-center justify-between">
        <View className="flex items-center">
          <Text className="text-base text-gray-8 mr-8">公开可见</Text>
          <Text className="text-xs text-gray-4">
            {isPublic ? "所有人可看到这篇笔记" : "仅自己可见"}
          </Text>
        </View>
        <View
          className={`w-48 h-28 rounded-full flex items-center px-2 transition-all ${
            isPublic ? "bg-primary-6" : "bg-gray-3"
          }`}
          onClick={() => setIsPublic((prev) => !prev)}
        >
          <View
            className={`w-24 h-24 rounded-full bg-white shadow-sm transition-all ${
              isPublic ? "ml-18" : "ml-0"
            }`}
          />
        </View>
      </View>

      {/* Publish button */}
      <View className="mx-12 mt-24">
        <View
          className={`w-full py-14 rounded-xl text-center text-base font-medium ${
            canSubmit && !submitting
              ? "bg-primary-6 text-white active:opacity-80"
              : "bg-gray-2 text-gray-4"
          }`}
          onClick={handlePublish}
        >
          <Text>{submitting ? "发布中..." : "发布笔记"}</Text>
        </View>
      </View>
    </View>
  );
}
