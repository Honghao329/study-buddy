import { View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { Avatar, Badge, Button, Cell, Empty, Loading, Tabs } from "@taroify/core";
import { api } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface Partner {
  id: number;
  partner_id: number;
  partner_name: string;
  partner_avatar: string;
  status: string;
  created_at: string;
}

interface PendingItem {
  id: number;
  from_id: number;
  from_name: string;
  from_avatar: string;
  created_at: string;
}

export default function PartnerPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPartners = useCallback(async () => {
    try {
      const res = await api.get<{ list: Partner[] }>("/api/partner/my_list");
      setPartners(res.list || []);
    } catch {
      // silently fail
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get<{ list: PendingItem[] }>("/api/partner/pending_list");
      setPending(res.list || []);
    } catch {
      // silently fail
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPartners(), fetchPending()]);
    setLoading(false);
  }, [fetchPartners, fetchPending]);

  useDidShow(() => {
    refresh();
  });

  usePullDownRefresh(async () => {
    await refresh();
    Taro.stopPullDownRefresh();
  });

  const handleAccept = async (id: number) => {
    try {
      await api.post("/api/partner/accept", { id });
      Taro.showToast({ title: "已接受", icon: "success" });
      refresh();
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post("/api/partner/reject", { id });
      Taro.showToast({ title: "已拒绝", icon: "none" });
      refresh();
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const goProfile = (userId: number) => {
    Taro.navigateTo({ url: `/pages/user-profile/index?id=${userId}` });
  };

  return (
    <View className="min-h-screen pb-40" style={{ backgroundColor: "#F7F8FA" }}>
      {/* Tabs */}
      <View
        className="sticky top-0 z-10"
        style={{ backgroundColor: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      >
        <Tabs
          value={tabIndex}
          onChange={setTabIndex}
          style={
            {
              "--tabs-active-color": "#1CB0F6",
              "--tabs-line-height": "3px",
            } as any
          }
        >
          <Tabs.TabPane title="我的伙伴" />
          <Tabs.TabPane
            title={
              pending.length > 0 ? (
                <Badge content={pending.length} style={{ "--badge-background-color": "#FF9500" } as any}>
                  待处理
                </Badge>
              ) : (
                "待处理"
              )
            }
          />
        </Tabs>
      </View>

      {/* Loading */}
      {loading && (
        <View className="py-24 flex justify-center">
          <Loading type="spinner" style={{ color: "#1CB0F6" }}>
            加载中...
          </Loading>
        </View>
      )}

      {/* My partners */}
      {!loading && tabIndex === 0 && (
        <View className="px-12 pt-12">
          {partners.length > 0 ? (
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              {partners.map((p) => (
                <Cell
                  key={p.id}
                  clickable
                  isLink
                  onClick={() => goProfile(p.partner_id)}
                  icon={
                    <Avatar
                      src={resolveImageUrl(p.partner_avatar)}
                      style={{ width: "48px", height: "48px", marginRight: "12px" }}
                    />
                  }
                  title={p.partner_name}
                  brief={p.status === "accepted" ? "已结伴" : p.status}
                  style={{ paddingLeft: "16px", paddingRight: "12px" }}
                />
              ))}
            </View>
          ) : (
            <View className="pt-60">
              <Empty>
                <Empty.Image />
                <Empty.Description>还没有学伴，去社区认识更多伙伴吧</Empty.Description>
              </Empty>
            </View>
          )}
        </View>
      )}

      {/* Pending invites */}
      {!loading && tabIndex === 1 && (
        <View className="px-12 pt-12">
          {pending.length > 0 ? (
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              {pending.map((p) => (
                <Cell
                  key={p.id}
                  icon={
                    <Avatar
                      src={resolveImageUrl(p.from_avatar)}
                      style={{
                        width: "48px",
                        height: "48px",
                        marginRight: "12px",
                        cursor: "pointer",
                      }}
                      onClick={() => goProfile(p.from_id)}
                    />
                  }
                  title={p.from_name}
                  brief={formatRelativeTimestamp(p.created_at)}
                  style={{ paddingLeft: "16px", paddingRight: "12px" }}
                >
                  <View className="flex items-center gap-8 shrink-0">
                    <Button
                      size="small"
                      round
                      style={{
                        backgroundColor: "#1CB0F6",
                        borderColor: "#1CB0F6",
                        color: "#fff",
                        fontSize: "12px",
                        padding: "0 16px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(p.id);
                      }}
                    >
                      接受
                    </Button>
                    <Button
                      size="small"
                      round
                      style={{
                        backgroundColor: "#F7F8FA",
                        borderColor: "#eee",
                        color: "#999",
                        fontSize: "12px",
                        padding: "0 16px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(p.id);
                      }}
                    >
                      拒绝
                    </Button>
                  </View>
                </Cell>
              ))}
            </View>
          ) : (
            <View className="pt-60">
              <Empty>
                <Empty.Image />
                <Empty.Description>暂无待处理的邀请</Empty.Description>
              </Empty>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
