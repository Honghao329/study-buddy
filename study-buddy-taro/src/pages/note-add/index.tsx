import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useRef, useState } from "react";
import { Button, Cell, Empty, Field, Loading, Switch } from "@taroify/core";
import { Edit } from "@taroify/icons";
import { api, isLoggedIn } from "~/api/request";

const MAX_CONTENT = 5000;
const MAX_TITLE = 100;

interface NoteData {
  title: string;
  content: string;
  visibility: string;
}

export default function NoteAddPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadedRef = useRef(false);
  const routeKeyRef = useRef("");

  const editMode = !!editId;
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const fetchEditNote = async (id: string) => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get<NoteData>(`/api/note/detail/${id}`);
      setTitle(res.title || "");
      setContent(res.content || "");
      setIsPublic(res.visibility === "public");
      loadedRef.current = true;
    } catch {
      setLoadError("笔记加载失败，请重新进入或稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    const id = params.id || "";
    const isEdit = params.edit === "1" && !!id;
    const routeKey = `${isEdit ? "edit" : "create"}:${id || "new"}`;

    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey;
      loadedRef.current = false;
      setLoadError("");
      setSubmitting(false);
    }

    if (!isLoggedIn()) {
      setRequiresLogin(true);
      setLoading(false);
      setLoadError("");
      setEditId("");
      setTitle("");
      setContent("");
      setIsPublic(true);
      Taro.setNavigationBarTitle({ title: isEdit ? "编辑笔记" : "发布笔记" });
      return;
    }

    setRequiresLogin(false);

    if (isEdit && !loadedRef.current) {
      setEditId(id);
      Taro.setNavigationBarTitle({ title: "编辑笔记" });
      fetchEditNote(id);
    } else if (!isEdit) {
      setEditId("");
      setTitle("");
      setContent("");
      setIsPublic(true);
      setLoading(false);
      setLoadError("");
      loadedRef.current = true;
      Taro.setNavigationBarTitle({ title: "发布笔记" });
    }
  });

  const goLogin = () => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent("/pages/note-add/index")}`,
    });
  };

  const reloadEdit = () => {
    loadedRef.current = false;
    setLoadError("");
    const id = Taro.getCurrentInstance().router?.params?.id || "";
    if (id) {
      setEditId(id);
      fetchEditNote(id);
    }
  };

  const handlePublish = async () => {
    if (!isLoggedIn()) {
      goLogin();
      return;
    }
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      if (editMode && editId) {
        await api.put(`/api/note/update/${editId}`, {
          title: title.trim(),
          content: content.trim(),
          visibility: isPublic ? "public" : "private",
        });
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await api.post("/api/note/create", {
          title: title.trim(),
          content: content.trim(),
          visibility: isPublic ? "public" : "private",
        });
        Taro.showToast({ title: "发布成功", icon: "success" });
      }
      setTimeout(() => {
        Taro.navigateBack();
      }, 1200);
    } catch {
      Taro.showToast({ title: editMode ? "更新失败" : "发布失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  if (requiresLogin) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#F7F8FA" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>登录后才能发布或编辑笔记</Empty.Description>
        </Empty>
        <Button
          round
          size="small"
          className="mt-4"
          style={{ background: "#58CC02", color: "#fff", border: "none", fontWeight: 700 }}
          onClick={goLogin}
        >
          去登录
        </Button>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8FA" }}>
        <Loading type="spinner" style={{ color: "#58CC02" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  if (loadError) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#F7F8FA" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>{loadError}</Empty.Description>
        </Empty>
        <Button
          round
          size="small"
          className="mt-4"
          style={{ background: "#58CC02", color: "#fff", border: "none", fontWeight: 700 }}
          onClick={reloadEdit}
        >
          重试
        </Button>
      </View>
    );
  }

  return (
    <View className="min-h-screen" style={{ background: "#F7F8FA" }}>
      {/* Header illustration */}
      <View
        className="px-4 pt-5 pb-6 flex items-center"
        style={{
          background: "linear-gradient(135deg, #58CC02 0%, #46a302 100%)",
          borderRadius: "0 0 24px 24px",
        }}
      >
        <Edit size="28" color="#fff" style={{ marginRight: "12px", opacity: 0.9 }} />
        <View>
          <Text className="block text-lg font-bold text-white">
            {editMode ? "编辑笔记" : "写笔记"}
          </Text>
          <Text className="block text-xs text-white mt-1" style={{ opacity: 0.75 }}>
            {editMode ? "修改你的学习笔记" : "记录学习心得，分享知识"}
          </Text>
        </View>
      </View>

      {/* Title field */}
      <View
        className="mx-3 -mt-3 bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
      >
        <Field
          value={title}
          onChange={(val) => setTitle(val)}
          placeholder="输入笔记标题"
          maxlength={MAX_TITLE}
          style={{
            padding: "16px",
            fontSize: "18px",
            fontWeight: 600,
          }}
        />
        <View className="px-4 pb-2 flex justify-end">
          <Text className="text-xs" style={{ color: title.length >= MAX_TITLE ? "#FF4D4F" : "#ccc" }}>
            {title.length}/{MAX_TITLE}
          </Text>
        </View>
      </View>

      {/* Content textarea field */}
      <View
        className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        <Field
          type="textarea"
          value={content}
          onChange={(val) => setContent(val)}
          placeholder="写下你的学习笔记..."
          maxlength={MAX_CONTENT}
          autoHeight
          style={{
            padding: "16px",
            fontSize: "15px",
            lineHeight: "1.8",
            minHeight: "240px",
          }}
        />
        <View className="px-4 pb-3 flex justify-end">
          <Text
            className="text-xs"
            style={{
              color: content.length >= MAX_CONTENT * 0.9
                ? content.length >= MAX_CONTENT
                  ? "#FF4D4F"
                  : "#FF9500"
                : "#ccc",
            }}
          >
            {content.length}/{MAX_CONTENT}
          </Text>
        </View>
      </View>

      {/* Visibility toggle */}
      <View
        className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        <Cell
          title={
            <View>
              <Text className="block text-base font-medium" style={{ color: "#333" }}>
                公开可见
              </Text>
              <Text className="block text-xs mt-1" style={{ color: isPublic ? "#58CC02" : "#999" }}>
                {isPublic ? "所有人可看到这篇笔记" : "仅自己可见"}
              </Text>
            </View>
          }
          style={{ padding: "16px" }}
        >
          <Switch
            checked={isPublic}
            onChange={setIsPublic}
            size={24}
            style={{
              // @ts-ignore custom css var
              "--switch-background-color": "#ddd",
              "--switch-checked-background-color": "#58CC02",
            }}
          />
        </Cell>
      </View>

      {/* Publish button */}
      <View className="mx-3 mt-6 mb-6">
        <Button
          color="primary"
          shape="round"
          block
          size="large"
          loading={submitting}
          disabled={!canSubmit || submitting}
          style={{
            background: canSubmit && !submitting ? "#58CC02" : "#ccc",
            borderColor: canSubmit && !submitting ? "#58CC02" : "#ccc",
            fontWeight: 600,
            fontSize: "16px",
            boxShadow: canSubmit && !submitting ? "0 4px 16px rgba(88,204,2,0.3)" : "none",
          }}
          onClick={handlePublish}
        >
          {submitting
            ? editMode ? "更新中..." : "发布中..."
            : editMode ? "更新笔记" : "发布笔记"}
        </Button>
      </View>
    </View>
  );
}
