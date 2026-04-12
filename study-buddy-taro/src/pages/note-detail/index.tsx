import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { Avatar, Button, Cell, Divider, Empty, Field, Loading, Tag } from "@taroify/core";
import { Like, LikeOutlined, Star, StarOutlined, CommentOutlined, Edit as EditIcon, DeleteOutlined } from "@taroify/icons";
import { api, isLoggedIn } from "~/api/request";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";
import { resolveImageUrl } from "~/utils/imageUrl";

interface NoteDetail {
  id: number;
  title: string;
  content: string;
  user_id: number;
  user_name: string;
  user_pic: string;
  like_cnt: number;
  view_cnt: number;
  comment_cnt: number;
  created_at: string;
  is_public: number;
}

interface CommentItem {
  id: number;
  user_id: number;
  user_name: string;
  user_pic: string;
  content: string;
  created_at: string;
}

const COMMENT_SIZE = 20;

function getCurrentUserId(): number | null {
  try {
    const info = Taro.getStorageSync("userInfo");
    if (info && info.id) return Number(info.id);
  } catch {
    // ignore
  }
  return null;
}

export default function NoteDetailPage() {
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [liked, setLiked] = useState(false);
  const [favored, setFavored] = useState(false);
  const [likeCnt, setLikeCnt] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const noteId = Taro.getCurrentInstance().router?.params?.id || "";

  const isOwner = note ? getCurrentUserId() === Number(note.user_id) : false;

  const fetchNote = useCallback(async () => {
    const id = noteId;
    if (!id) {
      setLoadError("笔记不存在");
      setNote(null);
      return false;
    }
    try {
      const res = await api.get<NoteDetail>(`/api/note/detail/${id}`);
      setNote(res);
      setLikeCnt(res.like_cnt || 0);
      setLoadError("");
      return true;
    } catch {
      setNote(null);
      setLoadError("笔记加载失败");
      Taro.showToast({ title: "加载失败", icon: "none" });
      return false;
    }
  }, [noteId]);

  const fetchLikeStatus = useCallback(async () => {
    const id = noteId;
    if (!id || !isLoggedIn()) return;
    try {
      const res = await api.get<{ isLiked: number }>("/api/like/check", {
        targetType: "note",
        targetId: id,
      });
      setLiked(Boolean(res.isLiked));
    } catch {
      // ignore
    }
  }, [noteId]);

  const fetchFavStatus = useCallback(async () => {
    const id = noteId;
    if (!id || !isLoggedIn()) return;
    try {
      const res = await api.get<Array<{ target_id: number; target_type: string }>>("/api/fav/my_list");
      setFavored((res || []).some((item) => item.target_type === "note" && Number(item.target_id) === Number(id)));
    } catch {
      // ignore
    }
  }, [noteId]);

  const fetchComments = useCallback(
    async (p = 1, append = false) => {
      const id = noteId;
      if (!id || loadingRef.current) return;
      loadingRef.current = true;
      setCommentLoading(true);
      try {
        const res = await api.get<{ list: CommentItem[]; total: number }>(
          "/api/comment/list",
          { noteId: id, page: p, size: COMMENT_SIZE }
        );
        const items = res.list || [];
        setComments((prev) => (append ? [...prev, ...items] : items));
        setCommentTotal(res.total || 0);
        setCommentPage(p);
      } catch {
        // ignore
      } finally {
        loadingRef.current = false;
        setCommentLoading(false);
      }
    },
    [noteId]
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    loadingRef.current = false;
    setComments([]);
    setCommentTotal(0);
    setCommentPage(1);
    setLiked(false);
    setFavored(false);
    setLikeCnt(0);
    setCommentInput("");
    setCommentLoading(false);

    const ok = await fetchNote();
    if (ok) {
      const tasks = [fetchComments(1)];
      if (isLoggedIn()) {
        tasks.push(fetchLikeStatus(), fetchFavStatus());
      }
      await Promise.all(tasks);
    }

    setLoading(false);
  }, [fetchComments, fetchFavStatus, fetchLikeStatus, fetchNote]);

  useDidShow(() => {
    loadPage();
  });

  const toggleLike = async () => {
    const id = noteId;
    if (!id) return;
    if (!isLoggedIn()) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    try {
      await api.post("/api/like/toggle", { targetType: "note", targetId: Number(id) });
      setLiked((prev) => {
        setLikeCnt((cnt) => (prev ? cnt - 1 : cnt + 1));
        return !prev;
      });
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const toggleFav = async () => {
    const id = noteId;
    if (!id) return;
    if (!isLoggedIn()) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    try {
      await api.post("/api/fav/toggle", { targetType: "note", targetId: Number(id) });
      setFavored((prev) => !prev);
      Taro.showToast({ title: favored ? "已取消收藏" : "已收藏", icon: "none" });
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const sendComment = async () => {
    const id = noteId;
    const content = commentInput.trim();
    if (!id || !content || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/api/comment/create", { noteId: Number(id), content });
      setCommentInput("");
      Taro.showToast({ title: "评论成功", icon: "none" });
      fetchComments(1);
    } catch {
      Taro.showToast({ title: "评论失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/note-add/index?id=${noteId}&edit=1` });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: "确认删除",
      content: "删除后无法恢复，确定要删除这篇笔记吗？",
      confirmColor: "#FF4D4F",
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            await api.del(`/api/note/delete/${noteId}`);
            Taro.showToast({ title: "删除成功", icon: "success" });
            setTimeout(() => {
              Taro.navigateBack();
            }, 1200);
          } catch {
            Taro.showToast({ title: "删除失败", icon: "none" });
          }
        }
      },
    });
  };

  const loadMoreComments = () => {
    if (!commentLoading && comments.length < commentTotal) {
      fetchComments(commentPage + 1, true);
    }
  };

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8FA" }}>
        <Loading type="spinner" style={{ color: "#1CB0F6" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  if (loadError || !note) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "#F7F8FA" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>{loadError || "笔记不存在"}</Empty.Description>
        </Empty>
        <Button
          color="primary"
          shape="round"
          size="small"
          style={{ marginTop: "16px", background: "#58CC02", borderColor: "#58CC02" }}
          onClick={loadPage}
        >
          重试
        </Button>
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-32" style={{ background: "#F7F8FA" }}>
      {/* Note content card */}
      <View
        className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      >
        {/* Author header */}
        <View className="px-4 pt-4 pb-3 flex items-center">
          <Avatar
            src={resolveImageUrl(note.user_pic)}
            size="medium"
            shape="circle"
            style={{ marginRight: "12px", flexShrink: 0 }}
          />
          <View className="flex-1 min-w-0">
            <Text className="block text-sm font-semibold truncate" style={{ color: "#333" }}>
              {note.user_name || "匿名用户"}
            </Text>
            <Text className="block text-xs mt-1" style={{ color: "#bbb" }}>
              {formatRelativeTimestamp(note.created_at)}
            </Text>
          </View>
          <Tag
            shape="round"
            size="medium"
            style={{
              background: note.is_public ? "rgba(88,204,2,0.1)" : "rgba(153,153,153,0.1)",
              color: note.is_public ? "#58CC02" : "#999",
              borderColor: "transparent",
            }}
          >
            {note.is_public ? "公开" : "私密"}
          </Tag>
        </View>

        {/* Title */}
        <View className="px-4">
          <Text className="block text-xl font-bold leading-snug mb-3" style={{ color: "#1a1a1a" }}>
            {note.title}
          </Text>
        </View>

        {/* Content body */}
        <View className="px-4 pb-4">
          <Text className="block text-base leading-relaxed whitespace-pre-wrap" style={{ color: "#555", lineHeight: "1.8" }}>
            {note.content}
          </Text>
        </View>

        {/* Stats bar + owner actions */}
        <View
          className="px-4 py-3 flex items-center"
          style={{ borderTop: "1px solid #f5f5f5" }}
        >
          <View className="flex items-center gap-4 flex-1">
            <Text style={{ color: "#999", fontSize: "12px" }}>👁 {note.view_cnt || 0}</Text>
            <Text style={{ color: "#999", fontSize: "12px" }}>💬 {note.comment_cnt || 0}</Text>
          </View>
          {isOwner && (
            <View className="flex items-center gap-2">
              <Button
                variant="text"
                size="mini"
                icon={<EditIcon size="16" />}
                style={{ color: "#1CB0F6", padding: "0 8px" }}
                onClick={handleEdit}
              >
                编辑
              </Button>
              <Button
                variant="text"
                size="mini"
                icon={<DeleteOutlined size="16" />}
                style={{ color: "#FF4D4F", padding: "0 8px" }}
                onClick={handleDelete}
              >
                删除
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* Action bar */}
      <View
        className="mx-3 mt-3 bg-white rounded-2xl flex items-center justify-around py-2"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      >
        <Button
          variant="text"
          icon={liked ? <Like size="22" color="#FF4D4F" /> : <LikeOutlined size="22" />}
          style={{ color: liked ? "#FF4D4F" : "#999" }}
          onClick={toggleLike}
        >
          {likeCnt || "点赞"}
        </Button>
        <View className="w-px h-5" style={{ background: "#eee" }} />
        <Button
          variant="text"
          icon={favored ? <Star size="22" color="#FF9500" /> : <StarOutlined size="22" />}
          style={{ color: favored ? "#FF9500" : "#999" }}
          onClick={toggleFav}
        >
          {favored ? "已收藏" : "收藏"}
        </Button>
        <View className="w-px h-5" style={{ background: "#eee" }} />
        <Button
          variant="text"
          icon={<CommentOutlined size="22" />}
          style={{ color: "#999" }}
        >
          {commentTotal || "评论"}
        </Button>
      </View>

      {/* Comment section */}
      <View
        className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      >
        {/* Section header */}
        <View className="px-4 pt-4 pb-2 flex items-center">
          <View className="w-1 h-4 rounded-full mr-2" style={{ background: "#1CB0F6" }} />
          <Text className="text-base font-bold" style={{ color: "#333" }}>
            评论
          </Text>
          {commentTotal > 0 && (
            <Tag
              shape="round"
              size="small"
              style={{
                marginLeft: "8px",
                background: "rgba(28,176,246,0.1)",
                color: "#1CB0F6",
                borderColor: "transparent",
              }}
            >
              {commentTotal}
            </Tag>
          )}
        </View>

        <Divider style={{ margin: "0 16px", borderColor: "#f5f5f5" }} />

        {/* Comments list */}
        {comments.length === 0 && !commentLoading && (
          <View className="py-6">
            <Empty>
              <Empty.Image />
              <Empty.Description>暂无评论，快来抢沙发吧</Empty.Description>
            </Empty>
          </View>
        )}

        {comments.map((c, idx) => (
          <View key={c.id}>
            <Cell
              style={{ padding: "12px 16px" }}
              title={
                <View className="flex items-start">
                  <Avatar
                    src={resolveImageUrl(c.user_pic)}
                    size="small"
                    shape="circle"
                    style={{ marginRight: "10px", flexShrink: 0, marginTop: "2px" }}
                  />
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center justify-between mb-1">
                      <Text className="text-sm font-medium truncate" style={{ color: "#333" }}>
                        {c.user_name || "匿名"}
                      </Text>
                      <Text className="text-xs shrink-0 ml-2" style={{ color: "#ccc" }}>
                        {formatRelativeTimestamp(c.created_at)}
                      </Text>
                    </View>
                    <Text className="block text-sm leading-relaxed" style={{ color: "#666" }}>
                      {c.content}
                    </Text>
                  </View>
                </View>
              }
            />
            {idx < comments.length - 1 && (
              <Divider style={{ margin: "0 16px 0 56px", borderColor: "#f5f5f5" }} />
            )}
          </View>
        ))}

        {commentLoading && (
          <View className="py-4 flex justify-center">
            <Loading type="spinner" style={{ color: "#1CB0F6" }}>
              加载中...
            </Loading>
          </View>
        )}

        {!commentLoading && comments.length > 0 && comments.length < commentTotal && (
          <View className="py-3 text-center" onClick={loadMoreComments}>
            <Button variant="text" size="small" style={{ color: "#1CB0F6" }}>
              加载更多评论
            </Button>
          </View>
        )}

        {!commentLoading && comments.length > 0 && comments.length >= commentTotal && (
          <Divider style={{ color: "#ccc", fontSize: "12px", margin: "4px 16px 12px" }}>
            已显示全部评论
          </Divider>
        )}
      </View>

      {/* Fixed bottom comment input bar */}
      {isLoggedIn() ? (
        <View
          className="fixed bottom-0 left-0 right-0 bg-white flex items-end px-3 py-2 z-30"
          style={{
            borderTop: "1px solid #f0f0f0",
            paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
            boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <View className="flex-1 mr-2">
            <Field
              type="textarea"
              placeholder="写一条评论..."
              value={commentInput}
              onChange={(e) => setCommentInput(e)}
              autoHeight
              style={{
                background: "#F7F8FA",
                borderRadius: "16px",
                padding: "8px 14px",
                fontSize: "14px",
                maxHeight: "100px",
              }}
            />
          </View>
          <Button
            color="primary"
            shape="round"
            size="small"
            disabled={!commentInput.trim() || submitting}
            style={{
              background: commentInput.trim() ? "#58CC02" : "#e0e0e0",
              borderColor: commentInput.trim() ? "#58CC02" : "#e0e0e0",
              flexShrink: 0,
              marginBottom: "4px",
            }}
            onClick={sendComment}
          >
            发送
          </Button>
        </View>
      ) : (
        <View
          className="fixed bottom-0 left-0 right-0 bg-white flex items-center justify-center px-3 py-3 z-30"
          style={{
            borderTop: "1px solid #f0f0f0",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <Button
            variant="text"
            size="small"
            style={{ color: "#1CB0F6", fontSize: "14px" }}
            onClick={() => Taro.navigateTo({ url: "/pages/login/index" })}
          >
            登录后评论
          </Button>
        </View>
      )}
    </View>
  );
}
