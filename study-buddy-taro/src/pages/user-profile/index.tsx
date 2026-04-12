import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { api, isLoggedIn } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";

interface UserProfile {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
  created_at: string;
}

interface NoteItem {
  id: number;
  title: string;
  like_cnt: number;
  view_cnt: number;
}

type PartnerStatus = "none" | "pending" | "accepted";

export default function UserProfilePage() {
  const router = useRouter();
  const userId = Number(router.params.id || 0);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>("none");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const canInvite = partnerStatus === "none" && !inviting;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profileRes, notesRes, statusRes] = await Promise.all([
        api.get<UserProfile>(`/api/user/profile/${userId}`),
        api.get<{ list: NoteItem[] }>(`/api/user/user_notes/${userId}`, { page: 1, size: 10 }),
        isLoggedIn()
          ? api.post<Record<string, PartnerStatus>>("/api/partner/batch_status", { userIds: [userId] })
          : Promise.resolve<Record<string, PartnerStatus>>({}),
      ]);
      setProfile(profileRes);
      setNotes(notesRes.list || []);
      if (statusRes) {
        setPartnerStatus((statusRes[String(userId)] as PartnerStatus) || "none");
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useDidShow(() => {
    fetchProfile();
  });

  const handleInvite = async () => {
    if (!canInvite) return;
    setInviting(true);
    try {
      await api.post("/api/partner/invite", { targetId: userId });
      Taro.showToast({ title: "已发送邀请", icon: "success" });
      setPartnerStatus("pending");
    } catch {
      Taro.showToast({ title: "邀请失败", icon: "none" });
    } finally {
      setInviting(false);
    }
  };

  const goNoteDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/note-detail/index?id=${id}` });
  };

  const statusLabel = () => {
    switch (partnerStatus) {
      case "accepted":
        return "已是伙伴";
      case "pending":
        return "已发送邀请";
      default:
        return "添加伙伴";
    }
  };

  if (loading && !profile) {
    return (
      <View className="min-h-screen bg-gray-1 flex items-center justify-center">
        <Text className="text-sm text-gray-4">加载中...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="min-h-screen bg-gray-1 flex items-center justify-center">
        <Text className="text-sm text-gray-4">用户不存在</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-1 pb-40">
      {/* Profile header */}
      <View className="bg-white px-16 pt-24 pb-20 shadow-sm">
        <View className="flex items-center mb-16">
          <Image
            className="w-72 h-72 rounded-full mr-16 bg-gray-2 shrink-0"
            src={resolveImageUrl(profile.avatar) || "https://via.placeholder.com/160"}
            mode="aspectFill"
          />
          <View className="flex-1 min-w-0">
            <Text className="block text-lg font-bold text-gray-8 truncate">
              {profile.nickname}
            </Text>
            {profile.bio && (
              <Text className="block text-sm text-gray-5 mt-6 line-clamp-2">
                {profile.bio}
              </Text>
            )}
            <Text className="block text-xs text-gray-4 mt-6">
              加入于 {profile.created_at}
            </Text>
          </View>
        </View>

        {/* Action button */}
        <View
          className={`w-full py-10 rounded-full text-center ${
            canInvite ? "bg-primary-6 active:opacity-80" : "bg-gray-2"
          }`}
          onClick={canInvite ? handleInvite : undefined}
        >
          <Text
            className={`text-sm font-medium ${canInvite ? "text-white" : "text-gray-6"}`}
          >
            {statusLabel()}
          </Text>
        </View>
      </View>

      {/* Notes section */}
      <View className="px-12 pt-16">
        <Text className="block text-base font-bold text-gray-8 mb-12 px-4">
          TA 的笔记
        </Text>

        {notes.map((note) => (
          <View
            key={note.id}
            className="bg-white rounded-xl shadow-sm mb-12 p-16 active:opacity-80"
            onClick={() => goNoteDetail(note.id)}
          >
            <Text className="block text-base font-bold text-gray-8 leading-snug mb-8 line-clamp-2">
              {note.title}
            </Text>
            <View className="flex items-center text-xs text-gray-4 gap-16">
              <Text>👍 {note.like_cnt || 0}</Text>
              <Text>👁 {note.view_cnt || 0}</Text>
            </View>
          </View>
        ))}

        {!loading && notes.length === 0 && (
          <View className="py-40 text-center">
            <Text className="text-sm text-gray-4">暂无公开笔记</Text>
          </View>
        )}
      </View>
    </View>
  );
}
