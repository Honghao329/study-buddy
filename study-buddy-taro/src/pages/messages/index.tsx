import { View } from "@tarojs/components";
import Taro, { useDidShow, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { Avatar, Badge, Button, Cell, Empty, Loading, Popup } from "@taroify/core";
import { Bell, Cross } from "@taroify/icons";
import LoginGateCard from "~/components/LoginGateCard";
import { api, isLoggedIn } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface MessageItem {
  id: number;
  type: string;
  content: string;
  from_name: string;
  from_avatar: string;
  is_read: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function MessagesPage() {
  const [logged, setLogged] = useState(isLoggedIn());
  const [list, setList] = useState<MessageItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [appendError, setAppendError] = useState("");
  const loadingRef = useRef(false);
  const [detail, setDetail] = useState<MessageItem | null>(null);
  const currentPath = "/pages/messages/index";

  const hasMore = list.length < total;

  const goLogin = () => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent(currentPath)}`,
    });
  };

  const resetState = () => {
    setList([]);
    setPage(1);
    setTotal(0);
    setLoading(false);
    setLoadError("");
    setAppendError("");
    setDetail(null);
    loadingRef.current = false;
  };

  const fetchList = useCallback(
    async (p: number, append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setLoadError("");
      if (append) {
        setAppendError("");
      } else {
        setAppendError("");
      }
      try {
        const res = await api.get<{ list: MessageItem[]; total: number }>(
          "/api/message/list",
          { page: p, size: PAGE_SIZE }
        );
        const items = res.list || [];
        setList((prev) => (append ? [...prev, ...items] : items));
        setTotal(res.total || 0);
        setPage(p);
      } catch (error: any) {
        if (append) {
          setAppendError(error?.message || "更多消息加载失败");
        } else {
          setList([]);
          setTotal(0);
          setPage(1);
          setLoadError(error?.message || "消息加载失败");
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
      resetState();
      return;
    }

    fetchList(1);
  });

  useReachBottom(() => {
    if (!logged) {
      return;
    }

    if (!loading && hasMore) {
      fetchList(page + 1, true);
    }
  });

  /* ---- actions ---- */

  const openMessage = async (msg: MessageItem) => {
    if (!msg.is_read) {
      try {
        await api.post("/api/message/read", { id: msg.id });
        setList((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
      } catch {
        /* ignore */
      }
    }
    setDetail(msg);
  };

  const closeDetail = () => {
    setDetail(null);
  };

  if (!logged) {
    return (
      <View className="min-h-screen px-4 py-4" style={{ background: "#F8FAFC" }}>
        <LoginGateCard
          icon={<Bell size="20" color="#fff" />}
          title="登录后查看消息"
          description="未读通知、评论提醒和伙伴邀请都只会出现在当前账号下。"
          highlights={["未读提醒", "评论通知", "伙伴邀请"]}
          actionText="去登录"
          onAction={goLogin}
        />
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-40" style={{ backgroundColor: "#F7F8FA" }}>
      {/* Message list */}
      <View className="px-12 pt-12">
        {loadError && list.length === 0 ? (
          <View
            className="mb-4 rounded-2xl bg-white px-5 py-8"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <Empty>
              <Empty.Image />
              <Empty.Description>{loadError}</Empty.Description>
            </Empty>
            <View className="flex justify-center mt-4">
              <Button
                size="small"
                round
                style={{ background: "#1CB0F6", color: "#fff", border: "none" }}
                onClick={() => fetchList(1)}
              >
                重新加载
              </Button>
            </View>
          </View>
        ) : null}

        <View
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
        >
          {list.map((msg) => (
            <Cell
              key={msg.id}
              clickable
              onClick={() => openMessage(msg)}
              icon={
                <Badge dot={!msg.is_read} style={{ "--badge-dot-background-color": "#FF4D4F" } as any}>
                  <Avatar
                    src={resolveImageUrl(msg.from_avatar)}
                    style={{ width: "44px", height: "44px" }}
                  />
                </Badge>
              }
              title={
                <View className="flex items-center justify-between">
                  <View
                    style={{
                      fontSize: "15px",
                      fontWeight: msg.is_read ? "normal" : "bold",
                      color: "#333",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {msg.from_name || "系统通知"}
                  </View>
                  <View
                    className="shrink-0 ml-8"
                    style={{ fontSize: "11px", color: "#bbb" }}
                  >
                    {formatRelativeTimestamp(msg.created_at)}
                  </View>
                </View>
              }
              brief={msg.content}
              style={{ paddingLeft: "16px", paddingRight: "16px" }}
            />
          ))}
        </View>

        {/* Loading */}
        {loading && (
          <View className="py-24 flex justify-center">
            <Loading type="spinner" style={{ color: "#1CB0F6" }}>
              加载中...
            </Loading>
          </View>
        )}

        {/* Empty */}
        {!loading && !loadError && list.length === 0 && (
          <View className="pt-60">
            <Empty>
              <Empty.Image />
              <Empty.Description>暂无消息</Empty.Description>
            </Empty>
          </View>
        )}

        {/* No more */}
        {!loading && list.length > 0 && !hasMore && (
          <View
            className="py-20 text-center"
            style={{ fontSize: "13px", color: "#ccc" }}
          >
            -- 已经到底了 --
          </View>
        )}

        {!loading && appendError && list.length > 0 && (
          <View className="mt-4 rounded-2xl bg-[#FFF7E6] px-4 py-3" style={{ border: "1px solid #FFE7BA" }}>
            <View style={{ fontSize: "13px", color: "#D46B08" }}>{appendError}</View>
            <View
              className="mt-2"
              style={{ fontSize: "12px", color: "#1CB0F6" }}
              onClick={() => fetchList(page + 1, true)}
            >
              继续重试加载更多
            </View>
          </View>
        )}
      </View>

      {/* ====== Detail Popup ====== */}
      <Popup
        open={!!detail}
        rounded
        placement="bottom"
        style={{ maxHeight: "70vh" }}
        onClose={closeDetail}
      >
        {detail && (
          <View style={{ padding: "24px 20px 40px" }}>
            {/* Close icon */}
            <View
              className="flex justify-end mb-12"
              onClick={closeDetail}
            >
              <Cross size="20px" color="#999" />
            </View>

            {/* Header */}
            <View className="flex items-center mb-20">
              <Avatar
                src={resolveImageUrl(detail.from_avatar)}
                style={{ width: "48px", height: "48px", marginRight: "12px" }}
              />
              <View className="flex-1 min-w-0">
                <View
                  style={{ fontSize: "17px", fontWeight: "bold", color: "#333" }}
                >
                  {detail.from_name || "系统通知"}
                </View>
                <View style={{ fontSize: "12px", color: "#bbb", marginTop: "4px" }}>
                  {formatRelativeTimestamp(detail.created_at)}
                </View>
              </View>
            </View>

            {/* Body */}
            <View
              style={{
                fontSize: "15px",
                color: "#555",
                lineHeight: "1.7",
                marginBottom: "28px",
              }}
            >
              {detail.content}
            </View>

            {/* Close button */}
            <Button
              block
              round
              style={{
                backgroundColor: "#F7F8FA",
                borderColor: "#F7F8FA",
                color: "#666",
              }}
              onClick={closeDetail}
            >
              关闭
            </Button>
          </View>
        )}
      </Popup>
    </View>
  );
}
