import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { Avatar, Button, Cell, Empty, Loading, Tag } from "@taroify/core";
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

  const statusTagColor = (): string => {
    switch (partnerStatus) {
      case "accepted":
        return "#58CC02";
      case "pending":
        return "#FF9500";
      default:
        return "#ccc";
    }
  };

  if (loading && !profile) {
    return (
      <View
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F7F8FA" }}
      >
        <Loading type="spinner" style={{ color: "#1CB0F6" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        className="min-h-screen"
        style={{ backgroundColor: "#F7F8FA", paddingTop: "80px" }}
      >
        <Empty>
          <Empty.Image />
          <Empty.Description>用户不存在</Empty.Description>
        </Empty>
      </View>
    );
  }

  return (
    <View className="min-h-screen pb-40" style={{ backgroundColor: "#F7F8FA" }}>
      {/* Profile header */}
      <View
        className="flex flex-col items-center pt-36 pb-28 px-20"
        style={{
          backgroundColor: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          borderBottomLeftRadius: "24px",
          borderBottomRightRadius: "24px",
        }}
      >
        <Avatar
          src={resolveImageUrl(profile.avatar)}
          style={{
            width: "80px",
            height: "80px",
            border: "3px solid #fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}
        />

        <View className="flex items-center mt-16 mb-4">
          <Text style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
            {profile.nickname}
          </Text>
          {partnerStatus !== "none" && (
            <Tag
              style={{
                marginLeft: "8px",
                backgroundColor: statusTagColor(),
                color: "#fff",
                borderColor: "transparent",
                fontSize: "10px",
              }}
            >
              {partnerStatus === "accepted" ? "伙伴" : "邀请中"}
            </Tag>
          )}
        </View>

        {profile.bio && (
          <Text
            style={{
              fontSize: "14px",
              color: "#888",
              textAlign: "center",
              lineHeight: "1.5",
              marginBottom: "4px",
              maxWidth: "280px",
            }}
          >
            {profile.bio}
          </Text>
        )}

        <Text style={{ fontSize: "12px", color: "#bbb", marginTop: "8px" }}>
          加入于 {profile.created_at}
        </Text>

        {/* Action button */}
        <View className="w-full px-20 mt-20">
          <Button
            block
            round
            size="large"
            loading={inviting}
            disabled={!canInvite}
            onClick={canInvite ? handleInvite : undefined}
            style={{
              backgroundColor: canInvite
                ? "#1CB0F6"
                : partnerStatus === "accepted"
                ? "#58CC02"
                : "#e0e0e0",
              borderColor: "transparent",
              color: canInvite ? "#fff" : partnerStatus === "accepted" ? "#fff" : "#999",
              fontWeight: "bold",
              fontSize: "15px",
              boxShadow: canInvite ? "0 4px 16px rgba(28,176,246,0.3)" : "none",
            }}
          >
            {statusLabel()}
          </Button>
        </View>
      </View>

      {/* Notes section */}
      <View className="px-12 pt-20">
        <Text
          className="block mb-12 px-8"
          style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}
        >
          TA 的笔记
        </Text>

        {notes.length > 0 ? (
          <Cell.Group
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            {notes.map((note) => (
              <Cell
                key={note.id}
                clickable
                isLink
                onClick={() => goNoteDetail(note.id)}
                title={note.title}
                brief={`${note.like_cnt || 0} 赞  ${note.view_cnt || 0} 阅读`}
                style={{ paddingLeft: "16px", paddingRight: "12px" }}
              />
            ))}
          </Cell.Group>
        ) : (
          !loading && (
            <View className="pt-20">
              <Empty>
                <Empty.Image />
                <Empty.Description>暂无公开笔记</Empty.Description>
              </Empty>
            </View>
          )
        )}
      </View>
    </View>
  );
}
