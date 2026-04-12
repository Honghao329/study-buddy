import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useCallback, useState } from "react";
import { Avatar, Button, Empty, Loading, Tag } from "@taroify/core";
import {
  CalendarOutlined,
  FireOutlined,
  FriendsOutlined,
  LikeOutlined,
  StarOutlined,
  UserCircleOutlined,
  EyeOutlined,
  CommentOutlined,
} from "@taroify/icons";
import ContentMetrics from "~/components/ContentMetrics";
import { api, isLoggedIn } from "~/api/request";
import { resolveImageUrl } from "~/utils/imageUrl";
import { formatRelativeTimestamp } from "~/utils/timeFormatter";

interface UserProfile {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
  created_at: string;
  tags: string[];
  note_cnt: number;
  sign_days: number;
  checkin_cnt: number;
  partner_status: "none" | "pending" | "accepted";
  is_self: boolean;
}

interface NoteItem {
  id: number;
  title: string;
  content: string;
  like_cnt: number;
  view_cnt: number;
  comment_cnt: number;
  created_at: string;
}

export default function UserProfilePage() {
  const router = useRouter();
  const userId = Number(router.params.id || 0);
  const currentPath = `/pages/user-profile/index?id=${userId}`;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [partnerStatus, setPartnerStatus] = useState<"none" | "pending" | "accepted">("none");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");

  const fetchNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setNotesError("用户不存在");
      return;
    }

    setNotesLoading(true);
    setNotesError("");
    try {
      const notesRes = await api.get<{ list: NoteItem[] }>(`/api/user/user_notes/${userId}`, {
        page: 1,
        size: 10,
      });
      setNotes(notesRes.list || []);
    } catch (error: any) {
      setNotes([]);
      setNotesError(error?.message || "公开笔记加载失败");
    } finally {
      setNotesLoading(false);
    }
  }, [userId]);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoadError("用户不存在");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const profileRes = await api.get<UserProfile>(`/api/user/profile/${userId}`);
      setProfile(profileRes);
      setPartnerStatus(profileRes.partner_status || "none");
    } catch (error: any) {
      setProfile(null);
      setLoadError(error?.message || "资料加载失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useDidShow(() => {
    fetchProfile();
    fetchNotes();
  });

  const goLogin = () => {
    Taro.navigateTo({ url: `/pages/login/index?redirect=${encodeURIComponent(currentPath)}` });
  };

  const handleInvite = async () => {
    if (!profile || profile.is_self || partnerStatus !== "none" || inviting) return;

    if (!isLoggedIn()) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      goLogin();
      return;
    }

    setInviting(true);
    try {
      await api.post("/api/partner/invite", { targetId: userId });
      Taro.showToast({ title: "已发送邀请", icon: "success" });
      setPartnerStatus("pending");
    } catch (error: any) {
      Taro.showToast({ title: error?.message || "邀请失败", icon: "none" });
    } finally {
      setInviting(false);
    }
  };

  const goNoteDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/note-detail/index?id=${id}` });
  };

  const actionLabel = (() => {
    if (!profile) return "添加伙伴";
    if (profile.is_self) return "这是你自己";
    if (!isLoggedIn()) return "登录后添加伙伴";
    if (partnerStatus === "accepted") return "已是伙伴";
    if (partnerStatus === "pending") return "邀请处理中";
    return "添加伙伴";
  })();

  const actionDisabled = !profile || profile.is_self || partnerStatus !== "none" || inviting;

  if (loading && !profile) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
        <Loading type="spinner" style={{ color: "#0F766E" }}>
          加载中...
        </Loading>
      </View>
    );
  }

  if (loadError && !profile) {
    return (
      <View className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#F8FAFC" }}>
        <Empty>
          <Empty.Image />
          <Empty.Description>{loadError || "用户不存在"}</Empty.Description>
        </Empty>
        <Button
          round
          size="small"
          className="mt-4"
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)",
            color: "#fff",
            border: "none",
            fontWeight: 700,
          }}
          onClick={fetchProfile}
        >
          重试
        </Button>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <View className="min-h-screen pb-10" style={{ background: "#F8FAFC" }}>
      <View className="px-4 pt-4">
        <View
          className="relative overflow-hidden rounded-[28px] px-5 py-5"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #134E4A 52%, #0F766E 120%)",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)",
          }}
        >
          <View className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <View className="absolute bottom-0 left-6 h-16 w-16 rounded-full bg-emerald-300/10" />

          <View className="flex items-start justify-between gap-4">
            <View className="flex-1 min-w-0">
              <View className="flex items-center gap-2">
                <Text className="block text-xl font-semibold text-white">
                  {profile.nickname || "匿名用户"}
                </Text>
                {partnerStatus !== "none" ? (
                  <Tag
                    shape="rounded"
                    size="small"
                    style={{
                      background: "rgba(255,255,255,0.14)",
                      color: "#fff",
                      borderColor: "transparent",
                    }}
                  >
                    {partnerStatus === "accepted" ? "伙伴" : "邀请中"}
                  </Tag>
                ) : null}
              </View>
              <Text className="mt-2 block text-sm leading-6 text-white/75">
                {profile.bio || "TA 还没有留下个性签名。"}
              </Text>
              <Text className="mt-3 block text-xs text-white/55">
                加入于 {formatRelativeTimestamp(profile.created_at)}
              </Text>
            </View>

            <Avatar
              src={resolveImageUrl(profile.avatar)}
              size="large"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {!profile.avatar ? <UserCircleOutlined size="40" color="#fff" /> : null}
            </Avatar>
          </View>

          {profile.tags && profile.tags.length > 0 ? (
            <View className="mt-4 flex flex-wrap gap-2">
              {profile.tags.slice(0, 4).map((tag) => (
                <View
                  key={tag}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/80"
                >
                  {tag}
                </View>
              ))}
            </View>
          ) : null}

          <Button
            block
            round
            size="large"
            className="mt-5"
            loading={inviting}
            disabled={actionDisabled}
            style={{
              background: actionDisabled
                ? "rgba(255,255,255,0.12)"
                : "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)",
              color: actionDisabled ? "#fff" : "#0F172A",
              border: "none",
              fontWeight: 700,
            }}
            onClick={isLoggedIn() ? handleInvite : goLogin}
          >
            {actionLabel}
          </Button>
        </View>

        <View className="mt-4">
          <ContentMetrics
            variant="tiles"
            items={[
              {
                key: "notes",
                icon: <StarOutlined size="16" />,
                label: "公开笔记",
                value: profile.note_cnt || 0,
                tone: "primary",
              },
              {
                key: "sign",
                icon: <CalendarOutlined size="16" />,
                label: "签到天数",
                value: profile.sign_days || 0,
                tone: "warning",
              },
              {
                key: "checkin",
                icon: <FireOutlined size="16" />,
                label: "打卡次数",
                value: profile.checkin_cnt || 0,
                tone: "success",
              },
            ]}
          />
        </View>
      </View>

      <View className="px-4 mt-4">
        <View
          className="rounded-3xl bg-white p-4 shadow-sm"
          style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}
        >
          <View className="flex items-center justify-between">
            <Text className="block text-sm font-semibold text-slate-900">TA 的公开笔记</Text>
            <View className="flex items-center gap-2 text-xs text-slate-400">
              <FriendsOutlined size="14" />
              <Text className="text-xs text-slate-400">{notes.length} 篇展示中</Text>
            </View>
          </View>

          {notesError ? (
            <View className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4">
              <Text className="block text-sm font-semibold text-rose-900">公开笔记暂时无法加载</Text>
              <Text className="mt-1 block text-xs leading-5 text-rose-700">{notesError}</Text>
              <Button
                round
                size="small"
                className="mt-3"
                style={{
                  background: "#fff",
                  color: "#BE123C",
                  border: "1px solid rgba(190,24,93,0.10)",
                  fontWeight: 700,
                }}
                onClick={fetchNotes}
              >
                重试加载
              </Button>
            </View>
          ) : notesLoading ? (
            <View className="py-10 flex justify-center">
              <Loading type="spinner" style={{ color: "#0F766E" }}>
                加载中...
              </Loading>
            </View>
          ) : notes.length > 0 ? (
            <View className="mt-4 space-y-3">
              {notes.map((note) => (
                <View
                  key={note.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 active:opacity-80"
                  style={{ boxShadow: "0 1px 6px rgba(15, 23, 42, 0.04)" }}
                  onClick={() => goNoteDetail(note.id)}
                >
                  <Text className="block text-base font-semibold text-slate-900">{note.title}</Text>
                  <Text className="mt-2 block text-sm leading-6 text-slate-600 line-clamp-2">
                    {note.content}
                  </Text>

                  <View className="mt-3">
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

                  <Text className="mt-3 block text-xs text-slate-400">
                    {formatRelativeTimestamp(note.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="py-10">
              <Empty>
                <Empty.Image />
                <Empty.Description>暂无公开笔记</Empty.Description>
              </Empty>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
