import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
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

  const loadMoreComments = () => {
    if (!commentLoading && comments.length < commentTotal) {
      fetchComments(commentPage + 1, true);
    }
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-1 flex items-center justify-center">
        <Text className="text-sm text-gray-4">加载中...</Text>
      </View>
    );
  }

  if (loadError || !note) {
    return (
      <View className="min-h-screen bg-gray-1 flex flex-col items-center justify-center px-8">
        <Text className="text-sm text-gray-4 mb-4">{loadError || "笔记不存在"}</Text>
        <View
          className="rounded-full bg-primary-6 px-5 py-2 active:opacity-80"
          onClick={loadPage}
        >
          <Text className="text-sm font-medium text-white">重试</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-1 pb-120">
      {/* Note content card */}
      <View className="bg-white rounded-xl shadow-sm mx-12 mt-12 p-16">
        {/* Author info */}
        <View className="flex items-center mb-16">
          <Image
            className="w-48 h-48 rounded-full mr-10 bg-gray-2 shrink-0"
            src={resolveImageUrl(note.user_pic) || "https://via.placeholder.com/160"}
            mode="aspectFill"
          />
          <View className="flex-1 min-w-0">
            <Text className="block text-sm font-medium text-gray-8 truncate">
              {note.user_name || "匿名用户"}
            </Text>
            <Text className="block text-xs text-gray-4 mt-2">
              {formatRelativeTimestamp(note.created_at)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text className="block text-xl font-bold text-gray-8 leading-snug mb-12">
          {note.title}
        </Text>

        {/* Content */}
        <Text className="block text-base text-gray-6 leading-relaxed whitespace-pre-wrap">
          {note.content}
        </Text>

        {/* Stats */}
        <View className="flex items-center text-xs text-gray-4 gap-16 mt-16 pt-12 border-t border-gray-1">
          <Text>浏览 {note.view_cnt || 0}</Text>
          <Text>评论 {note.comment_cnt || 0}</Text>
        </View>
      </View>

      {/* Action bar */}
      <View className="bg-white rounded-xl shadow-sm mx-12 mt-12 p-12 flex items-center justify-around">
        <View
          className="flex flex-col items-center active:opacity-60"
          onClick={toggleLike}
        >
          <Text className={`text-xl ${liked ? "text-red-5" : "text-gray-4"}`}>
            {liked ? "❤️" : "🤍"}
          </Text>
          <Text className={`text-xs mt-2 ${liked ? "text-red-5" : "text-gray-4"}`}>
            {likeCnt || "点赞"}
          </Text>
        </View>
        <View
          className="flex flex-col items-center active:opacity-60"
          onClick={toggleFav}
        >
          <Text className={`text-xl ${favored ? "text-yellow-5" : "text-gray-4"}`}>
            {favored ? "⭐" : "☆"}
          </Text>
          <Text className={`text-xs mt-2 ${favored ? "text-yellow-5" : "text-gray-4"}`}>
            {favored ? "已收藏" : "收藏"}
          </Text>
        </View>
        <View className="flex flex-col items-center">
          <Text className="text-xl text-gray-4">💬</Text>
          <Text className="text-xs mt-2 text-gray-4">
            {commentTotal || "评论"}
          </Text>
        </View>
      </View>

      {/* Comment section */}
      <View className="bg-white rounded-xl shadow-sm mx-12 mt-12 p-16">
        <Text className="block text-base font-bold text-gray-8 mb-12">
          评论 ({commentTotal})
        </Text>

        {comments.length === 0 && !commentLoading && (
          <View className="py-20 text-center">
            <Text className="text-sm text-gray-4">暂无评论，快来抢沙发吧</Text>
          </View>
        )}

        {comments.map((c) => (
          <View key={c.id} className="flex mb-16 last:mb-0">
            <Image
              className="w-40 h-40 rounded-full mr-10 bg-gray-2 shrink-0"
              src={resolveImageUrl(c.user_pic) || "https://via.placeholder.com/160"}
              mode="aspectFill"
            />
            <View className="flex-1 min-w-0">
              <View className="flex items-center justify-between mb-4">
                <Text className="text-sm font-medium text-gray-8 truncate">
                  {c.user_name || "匿名"}
                </Text>
                <Text className="text-xs text-gray-4 shrink-0 ml-8">
                  {formatRelativeTimestamp(c.created_at)}
                </Text>
              </View>
              <Text className="block text-sm text-gray-6 leading-relaxed">
                {c.content}
              </Text>
            </View>
          </View>
        ))}

        {commentLoading && (
          <View className="py-12 text-center">
            <Text className="text-sm text-gray-4">加载中...</Text>
          </View>
        )}

        {!commentLoading && comments.length > 0 && comments.length < commentTotal && (
          <View
            className="py-12 text-center active:opacity-60"
            onClick={loadMoreComments}
          >
            <Text className="text-sm text-primary-6">加载更多评论</Text>
          </View>
        )}

        {!commentLoading && comments.length > 0 && comments.length >= commentTotal && (
          <View className="py-12 text-center">
            <Text className="text-xs text-gray-4">— 已显示全部评论 —</Text>
          </View>
        )}
      </View>

      {/* Fixed bottom comment input bar */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-2 px-12 py-10 flex items-center z-30 safe-area-bottom">
        <Input
          className="flex-1 h-40 bg-gray-1 rounded-full px-16 text-sm text-gray-8"
          placeholder="写一条评论..."
          value={commentInput}
          onInput={(e) => setCommentInput(e.detail.value)}
          confirmType="send"
          onConfirm={sendComment}
        />
        <View
          className={`ml-10 px-16 py-8 rounded-full text-sm font-medium shrink-0 ${
            commentInput.trim()
              ? "bg-primary-6 text-white active:opacity-80"
              : "bg-gray-2 text-gray-4"
          }`}
          onClick={sendComment}
        >
          <Text>发送</Text>
        </View>
      </View>
    </View>
  );
}
