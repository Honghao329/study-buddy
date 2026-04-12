import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { api } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

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

type Tab = "my" | "pending";

export default function PartnerPage() {
  const [tab, setTab] = useState<Tab>("my");
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
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* Tab switcher */}
      <View className="sticky top-0 z-10 bg-white flex items-center px-16 py-12 shadow-sm">
        <View
          className={`px-20 py-8 rounded-full mr-12 text-sm font-medium ${
            tab === "my" ? "bg-primary-6 text-white" : "bg-gray-2 text-gray-6"
          }`}
          onClick={() => setTab("my")}
        >
          <Text>我的伙伴</Text>
        </View>
        <View
          className={`px-20 py-8 rounded-full text-sm font-medium ${
            tab === "pending" ? "bg-primary-6 text-white" : "bg-gray-2 text-gray-6"
          }`}
          onClick={() => setTab("pending")}
        >
          <Text>待处理</Text>
          {pending.length > 0 && (
            <Text className="ml-4 text-xs">({pending.length})</Text>
          )}
        </View>
      </View>

      {/* My partners */}
      {tab === "my" && (
        <View className="px-12 pt-12">
          {partners.map((p) => (
            <View
              key={p.id}
              className="bg-white rounded-xl shadow-sm mb-12 p-16 flex items-center active:opacity-80"
              onClick={() => goProfile(p.partner_id)}
            >
              <Image
                className="w-48 h-48 rounded-full mr-12 bg-gray-2 shrink-0"
                src={resolveImageUrl(p.partner_avatar) || "https://via.placeholder.com/160"}
                mode="aspectFill"
              />
              <View className="flex-1 min-w-0">
                <Text className="block text-base font-bold text-gray-8 truncate">
                  {p.partner_name}
                </Text>
                <Text className="block text-xs text-gray-4 mt-4">
                  {p.status === "accepted" ? "已结伴" : p.status}
                </Text>
              </View>
              <Text className="text-xs text-gray-4 shrink-0">查看</Text>
            </View>
          ))}

          {!loading && partners.length === 0 && (
            <View className="py-60 text-center">
              <Text className="block text-sm text-gray-4 mb-8">还没有学伴</Text>
              <Text className="text-sm text-gray-4">去社区认识更多伙伴吧</Text>
            </View>
          )}
        </View>
      )}

      {/* Pending invites */}
      {tab === "pending" && (
        <View className="px-12 pt-12">
          {pending.map((p) => (
            <View
              key={p.id}
              className="bg-white rounded-xl shadow-sm mb-12 p-16 flex items-center"
            >
              <Image
                className="w-48 h-48 rounded-full mr-12 bg-gray-2 shrink-0"
                src={resolveImageUrl(p.from_avatar) || "https://via.placeholder.com/160"}
                mode="aspectFill"
                onClick={() => goProfile(p.from_id)}
              />
              <View className="flex-1 min-w-0">
                <Text className="block text-base font-bold text-gray-8 truncate">
                  {p.from_name}
                </Text>
                <Text className="block text-xs text-gray-4 mt-4">
                  {p.created_at}
                </Text>
              </View>
              <View className="flex items-center gap-8 shrink-0">
                <View
                  className="px-16 py-6 rounded-full bg-primary-6 active:opacity-80"
                  onClick={() => handleAccept(p.id)}
                >
                  <Text className="text-xs text-white">接受</Text>
                </View>
                <View
                  className="px-16 py-6 rounded-full bg-gray-2 active:opacity-80"
                  onClick={() => handleReject(p.id)}
                >
                  <Text className="text-xs text-gray-6">拒绝</Text>
                </View>
              </View>
            </View>
          ))}

          {!loading && pending.length === 0 && (
            <View className="py-60 text-center">
              <Text className="text-sm text-gray-4">暂无待处理的邀请</Text>
            </View>
          )}
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View className="py-20 text-center">
          <Text className="text-sm text-gray-4">加载中...</Text>
        </View>
      )}
    </View>
  );
}
