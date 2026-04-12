import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { Button, Divider, Empty, Loading, Tag } from "@taroify/core";
import { CommentOutlined, Edit, EyeOutlined, LikeOutlined, Plus } from "@taroify/icons";
import LoginGateCard from "~/components/LoginGateCard";
import ContentMetrics from "~/components/ContentMetrics";
import { api, isLoggedIn } from "~/api/request";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  like_cnt: number;
  view_cnt: number;
  comment_cnt: number;
  is_public: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function NoteListPage() {
  const [logged, setLogged] = useState(isLoggedIn());
  const [list, setList] = useState<NoteItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [appendError, setAppendError] = useState("");
  const loadingRef = useRef(false);
  const currentPath = "/pages/note-list/index";

  const hasMore = list.length < total;

  const resetListState = () => {
    setList([]);
    setPage(1);
    setTotal(0);
    setLoading(false);
    setLoadError("");
    setAppendError("");
    loadingRef.current = false;
  };

  const goLogin = () => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent(currentPath)}`,
    });
  };

  const fetchList = useCallback(
    async (p: number, append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      if (append) {
        setAppendError("");
      } else {
        setLoadError("");
        setAppendError("");
      }
      try {
        const res = await api.get<{ list: NoteItem[]; total: number }>(
          "/api/note/my_list",
          { page: p, size: PAGE_SIZE }
        );
        const items = res.list || [];
        setList((prev) => (append ? [...prev, ...items] : items));
        setTotal(res.total || 0);
        setPage(p);
      } catch {
        if (append) {
          setAppendError("更多笔记加载失败，请重试。");
        } else {
          setList([]);
          setTotal(0);
          setPage(1);
          setLoadError("我的笔记加载失败");
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  useDidShow(() => {
    const currentLogged = isLoggedIn();
    setLogged(currentLogged);

    if (!currentLogged) {
      resetListState();
      return;
    }

    loadingRef.current = false;
    fetchList(1);
  });

  usePullDownRefresh(async () => {
    if (!isLoggedIn()) {
      Taro.stopPullDownRefresh();
      return;
    }

    loadingRef.current = false;
    await fetchList(1);
    Taro.stopPullDownRefresh();
  });

  useReachBottom(() => {
    if (!logged) {
      return;
    }

    if (!loading && hasMore) {
      fetchList(page + 1, true);
    }
  });

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/note-detail/index?id=${id}` });
  };

  const goAdd = () => {
    Taro.navigateTo({ url: "/pages/note-add/index" });
  };

  if (!logged) {
    return (
      <View className="min-h-screen px-4 py-4" style={{ background: "#F8FAFC" }}>
        <LoginGateCard
          icon={<Edit size="20" color="#fff" />}
          title="登录后查看我的笔记"
          description="你可以查看、编辑和管理自己的发布记录，也能更快回到未完成的内容。"
          highlights={["草稿管理", "发布记录", "历史回看"]}
          actionText="去登录"
          onAction={goLogin}
        />
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-10" style={{ background: "#F7F8FA" }}>
      {/* Header */}
      <View
        className="px-4 pt-4 pb-5"
        style={{
          background: "linear-gradient(135deg, #58CC02 0%, #46a302 100%)",
          borderRadius: "0 0 24px 24px",
        }}
      >
        <Text className="block text-xl font-bold text-white">我的笔记</Text>
        {total > 0 && (
          <Text className="block text-xs text-white mt-1" style={{ opacity: 0.75 }}>
            共 {total} 篇笔记
          </Text>
        )}
      </View>

      {/* Note cards */}
      <View className="px-3 -mt-3">
        {loading && list.length === 0 && (
          <View
            className="bg-white rounded-2xl py-10"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <View className="flex justify-center">
              <Loading type="spinner" style={{ color: "#1CB0F6" }}>
                正在加载我的笔记...
              </Loading>
            </View>
          </View>
        )}

        {!loading && loadError && list.length === 0 && (
          <View
            className="bg-white rounded-2xl mt-6 px-5 py-8"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <Text className="block text-base font-bold text-center text-[#1a1a1a]">笔记列表加载失败</Text>
            <Text className="block text-sm text-center text-[#999] mt-2">
              当前没有成功拿到你的内容，这不是空列表。
            </Text>
            <View className="flex justify-center mt-4">
              <Button
                color="primary"
                shape="round"
                size="small"
                style={{ background: "#1CB0F6", borderColor: "#1CB0F6" }}
                onClick={() => fetchList(1)}
              >
                重新加载
              </Button>
            </View>
          </View>
        )}

        {list.map((note) => (
          <View
            key={note.id}
            className="bg-white rounded-2xl mb-3 overflow-hidden active:opacity-90"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)", transition: "opacity 0.15s" }}
            onClick={() => goDetail(note.id)}
          >
            {/* Card body */}
            <View className="p-4">
              {/* Title row with badge */}
              <View className="flex items-start mb-2">
                <Text
                  className="flex-1 text-base font-bold leading-snug mr-2"
                  style={{
                    color: "#1a1a1a",
                    display: "-webkit-box",
                    overflow: "hidden",
                    // @ts-ignore
                    "-webkit-line-clamp": "2",
                    "-webkit-box-orient": "vertical",
                  }}
                >
                  {note.title}
                </Text>
                <Tag
                  shape="rounded"
                  size="small"
                  style={{
                    flexShrink: 0,
                    marginTop: "2px",
                    background: note.is_public ? "rgba(88,204,2,0.1)" : "rgba(153,153,153,0.1)",
                    color: note.is_public ? "#58CC02" : "#999",
                    borderColor: "transparent",
                  }}
                >
                  {note.is_public ? "公开" : "私密"}
                </Tag>
              </View>

              {/* Content preview */}
              {note.content && (
                <Text
                  className="block text-sm leading-relaxed mb-3"
                  style={{
                    color: "#888",
                    display: "-webkit-box",
                    overflow: "hidden",
                    // @ts-ignore
                    "-webkit-line-clamp": "2",
                    "-webkit-box-orient": "vertical",
                  }}
                >
                  {note.content}
                </Text>
              )}

              {/* Stats row */}
              <View className="flex items-center justify-between gap-3">
                <View className="flex-1">
                  <ContentMetrics
                    variant="inline"
                    items={[
                      {
                        key: "like",
                        icon: <LikeOutlined size="14" />,
                        label: "点赞",
                        value: note.like_cnt || 0,
                        tone: "danger",
                      },
                      {
                        key: "view",
                        icon: <EyeOutlined size="14" />,
                        label: "阅读",
                        value: note.view_cnt || 0,
                        tone: "info",
                      },
                      {
                        key: "comment",
                        icon: <CommentOutlined size="14" />,
                        label: "评论",
                        value: note.comment_cnt || 0,
                        tone: "primary",
                      },
                    ]}
                  />
                </View>
                <Text className="text-xs shrink-0" style={{ color: "#ccc" }}>
                  {formatRelativeTimestamp(note.created_at)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Loading state */}
        {loading && list.length > 0 && (
          <View className="py-5 flex justify-center">
            <Loading type="spinner" style={{ color: "#1CB0F6" }}>
              加载中...
            </Loading>
          </View>
        )}

        {/* Empty state */}
        {!loading && !loadError && list.length === 0 && (
          <View
            className="bg-white rounded-2xl mt-6 py-10"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <Empty>
              <Empty.Image />
              <Empty.Description>还没有笔记</Empty.Description>
            </Empty>
            <View className="flex justify-center mt-4">
              <Button
                color="primary"
                shape="round"
                size="medium"
                icon={<Plus size="16" />}
                style={{
                  background: "#58CC02",
                  borderColor: "#58CC02",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(88,204,2,0.3)",
                }}
                onClick={goAdd}
              >
                写第一篇笔记
              </Button>
            </View>
          </View>
        )}

        {!loading && appendError && list.length > 0 && (
          <View
            className="rounded-2xl px-4 py-3 mb-3"
            style={{ background: "#FFF7E6", border: "1px solid #FFE7BA" }}
          >
            <Text className="block text-sm text-[#D46B08]">{appendError}</Text>
            <Text
              className="block text-sm font-medium mt-2"
              style={{ color: "#1CB0F6" }}
              onClick={() => fetchList(page + 1, true)}
            >
              继续重试加载更多
            </Text>
          </View>
        )}

        {/* End of list */}
        {!loading && list.length > 0 && !hasMore && (
          <Divider style={{ color: "#ccc", fontSize: "12px", margin: "8px 0 16px" }}>
            已经到底了
          </Divider>
        )}
      </View>

      {/* Floating add button (FAB) */}
      {list.length > 0 && (
        <View
          className="fixed flex items-center justify-center z-20"
          style={{
            right: "20px",
            bottom: "100px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #58CC02 0%, #46a302 100%)",
            boxShadow: "0 6px 20px rgba(88,204,2,0.4)",
            transition: "transform 0.15s",
          }}
          onClick={goAdd}
        >
          <Plus size="28" color="#fff" />
        </View>
      )}
    </View>
  );
}
