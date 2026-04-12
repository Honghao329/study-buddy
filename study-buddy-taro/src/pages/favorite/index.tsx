import { View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { Button, Cell, Empty, Loading, Tag } from "@taroify/core";
import { StarOutlined } from "@taroify/icons";
import LoginGateCard from "~/components/LoginGateCard";
import { api, isLoggedIn } from "~/api/request";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface FavItem {
  id: number;
  target_type: string;
  target_id: number;
  title: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  note: "笔记",
  checkin: "打卡",
  post: "帖子",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  note: { bg: "#E8F7FE", text: "#1CB0F6" },
  checkin: { bg: "#E8F9E0", text: "#58CC02" },
  post: { bg: "#FFF3E0", text: "#FF9500" },
};

function navigateToTarget(item: FavItem) {
  switch (item.target_type) {
    case "note":
      Taro.navigateTo({ url: `/pages/note-detail/index?id=${item.target_id}` });
      break;
    case "checkin":
      Taro.navigateTo({
        url: `/pages/checkin-detail/index?id=${item.target_id}`,
      });
      break;
    default:
      Taro.showToast({ title: "暂不支持查看", icon: "none" });
  }
}

/* ---------- component ---------- */

export default function FavoritePage() {
  const [logged, setLogged] = useState(isLoggedIn());
  const [list, setList] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadingRef = useRef(false);
  const currentPath = "/pages/favorite/index";

  const goLogin = () => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent(currentPath)}`,
    });
  };

  const fetchList = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get<FavItem[]>("/api/fav/my_list");
      setList(Array.isArray(res) ? res : []);
    } catch (error: any) {
      setList([]);
      setLoadError(error?.message || "收藏内容加载失败");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    const currentLogged = isLoggedIn();
    setLogged(currentLogged);

    if (!currentLogged) {
      setList([]);
      setLoadError("");
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    fetchList();
  });

  if (!logged) {
    return (
      <View className="min-h-screen px-4 py-4" style={{ background: "#F8FAFC" }}>
        <LoginGateCard
          icon={<StarOutlined size="20" color="#fff" />}
          title="登录后查看收藏"
          description="收藏内容只对当前账号可见，登录后可以继续回看你保存过的笔记和打卡。"
          highlights={["收藏夹同步", "快速回看", "跨页跳转"]}
          actionText="去登录"
          onAction={goLogin}
        />
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-40" style={{ backgroundColor: "#F7F8FA" }}>
      <View className="px-12 pt-12">
        {loadError && list.length === 0 ? (
          <View
            className="rounded-2xl bg-white px-5 py-8"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <Empty>
              <Empty.Image />
              <Empty.Description>{loadError}</Empty.Description>
            </Empty>
            <View className="flex justify-center mt-4">
              <Button
                round
                size="small"
                style={{
                  background: "#1CB0F6",
                  color: "#fff",
                  border: "none",
                }}
                onClick={fetchList}
              >
                重试加载
              </Button>
            </View>
          </View>
        ) : null}

        {list.length > 0 && (
          <View
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "#fff",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
            }}
          >
            {list.map((item) => {
              const typeStyle = TYPE_COLORS[item.target_type] || {
                bg: "#F7F8FA",
                text: "#999",
              };
              return (
                <Cell
                  key={item.id}
                  clickable
                  isLink
                  onClick={() => navigateToTarget(item)}
                  title={item.title || "无标题"}
                  brief={formatRelativeTimestamp(item.created_at)}
                  style={{ paddingLeft: "16px", paddingRight: "16px" }}
                >
                  <Tag
                    style={{
                      backgroundColor: typeStyle.bg,
                      color: typeStyle.text,
                      borderColor: "transparent",
                      fontWeight: "500",
                    }}
                  >
                    {TYPE_LABELS[item.target_type] || item.target_type}
                  </Tag>
                </Cell>
              );
            })}
          </View>
        )}

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
              <Empty.Description>暂无收藏内容</Empty.Description>
            </Empty>
          </View>
        )}
      </View>
    </View>
  );
}
