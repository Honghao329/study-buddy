import { Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from "@tarojs/taro";
import { useCallback, useRef, useState } from "react";
import { ArrowRight, Plus, Search } from "@taroify/icons";
import { Button, Empty, Loading, Tag } from "@taroify/core";
import CheckinCreateSheet from "~/components/CheckinCreateSheet";
import { api, isLoggedIn } from "~/api/request";


interface CheckinTask {
  id: number;
  title: string;
  description: string;
  join_cnt: number;
  view_cnt: number;
  creator_id: number;
  supervisor_id: number;
  supervisor_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function CheckinListPage() {
  const [list, setList] = useState<CheckinTask[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [paginationError, setPaginationError] = useState("");
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const loadingRef = useRef(false);

  const hasMore = list.length < total;

  const loadList = useCallback(
    async (nextPage: number, append = false, keyword = searchTerm) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await api.get<{ list: CheckinTask[]; total: number }>(
          "/api/checkin/list",
          {
            page: nextPage,
            size: PAGE_SIZE,
            search: keyword || undefined,
          },
        );
        const items = res.list || [];
        setList((prev) => (append ? [...prev, ...items] : items));
        setTotal(res.total || 0);
        setPage(nextPage);
        setLoadError("");
        setPaginationError("");
      } catch (error: any) {
        const message = error?.message || "打卡任务加载失败";
        if (!append) {
          setLoadError(message);
        } else {
          setPaginationError(message);
          Taro.showToast({ title: message, icon: "none" });
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [searchTerm],
  );

  const loadJoinedIds = useCallback(async () => {
    if (!isLoggedIn()) {
      setJoinedIds(new Set());
      return;
    }

    try {
      const ids: number[] = await api.get("/api/checkin/my_joined_ids");
      setJoinedIds(new Set(ids || []));
    } catch {
      setJoinedIds(new Set());
    }
  }, []);

  const reload = useCallback(
    async (keyword = searchTerm) => {
      loadingRef.current = false;
      setLoadError("");
      setPaginationError("");
      await Promise.all([loadList(1, false, keyword), loadJoinedIds()]);
    },
    [loadJoinedIds, loadList, searchTerm],
  );

  useDidShow(() => {
    reload(searchTerm);
  });

  usePullDownRefresh(async () => {
    await reload(searchTerm);
    Taro.stopPullDownRefresh();
  });

  useReachBottom(() => {
    if (hasMore && !loadingRef.current) {
      loadList(page + 1, true, searchTerm);
    }
  });

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/checkin-detail/index?id=${id}` });
  };

  const applySearch = () => {
    const keyword = searchValue.trim();
    setSearchTerm(keyword);
    reload(keyword);
  };

  const resetSearch = () => {
    setSearchValue("");
    setSearchTerm("");
    reload("");
  };

  const openCreateTaskSheet = () => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: "请先登录后再创建", icon: "none" });
      Taro.navigateTo({
        url: `/pages/login/index?redirect=${encodeURIComponent("/pages/checkin-list/index")}`,
      });
      return;
    }

    setCreateError("");
    setCreateTitle("");
    setCreateDescription("");
    setCreateOpen(true);
  };

  const closeCreateTaskSheet = () => {
    if (createSubmitting) {
      return;
    }

    setCreateOpen(false);
    setCreateError("");
  };

  const applyPreset = (preset: { title: string; description: string }) => {
    setCreateTitle(preset.title);
    setCreateDescription(preset.description);
    setCreateError("");
  };

  const submitCreateTask = async () => {
    const title = createTitle.trim();
    const description = createDescription.trim();

    if (!title) {
      setCreateError("请输入任务名称");
      return;
    }

    if (title.length > 40) {
      setCreateError("任务名称建议控制在 40 个字以内");
      return;
    }

    setCreateSubmitting(true);
    setCreateError("");

    try {
      const res = await api.post<{ id: number }>("/api/checkin/create", {
        title,
        description,
      });
      Taro.showToast({ title: "创建成功", icon: "success" });
      setCreateOpen(false);
      setCreateTitle("");
      setCreateDescription("");

      if (res?.id) {
        Taro.navigateTo({ url: `/pages/checkin-detail/index?id=${res.id}` });
      } else {
        reload(searchTerm);
      }
    } catch (error: any) {
      const message = error?.message || "创建失败";
      setCreateError(message);
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <View className="min-h-screen pb-8" style={{ background: "#F8FAFC" }}>
      <View className="px-4 pt-4">
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Text className="text-lg font-bold text-slate-900">打卡任务</Text>
          </View>
          <Button
            round
            size="small"
            style={{
              background: "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
            }}
            onClick={openCreateTaskSheet}
          >
            <Plus size="14" /> 创建
          </Button>
        </View>

        <View className="mt-2 flex items-center rounded-xl bg-white px-3 py-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Search size="16" color="#94a3b8" />
          <Input
            className="ml-2 flex-1 text-sm text-slate-900"
            value={searchValue}
            placeholder="搜索任务"
            placeholderStyle="color: #94a3b8"
            onInput={(e) => setSearchValue(e.detail.value)}
            onConfirm={applySearch}
          />
          {searchValue ? (
            <Text className="text-xs text-slate-400" onClick={resetSearch}>清除</Text>
          ) : null}
        </View>

        <View className="mt-2 px-1">
          <Text className="text-xs text-slate-400">
            共{total || list.length}个任务 · 已加入{list.filter((item) => joinedIds.has(item.id)).length}个
          </Text>
        </View>

        {loadError ? (
          <View className="mt-4 rounded-3xl bg-white p-6 text-center shadow-sm" style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}>
            <Empty>
              <Empty.Image />
              <Empty.Description>{loadError}</Empty.Description>
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
              onClick={() => reload(searchTerm)}
            >
              重试
            </Button>
          </View>
        ) : null}

        {!loadError && list.length === 0 && !loading ? (
          <View className="mt-4 rounded-3xl bg-white p-6 shadow-sm" style={{ boxShadow: "0 1px 10px rgba(15, 23, 42, 0.05)" }}>
            <Empty>
              <Empty.Image />
              <Empty.Description>
                {searchTerm ? "没有找到匹配的任务" : "暂时还没有打卡任务"}
              </Empty.Description>
            </Empty>
            <View className="mt-4 flex justify-center gap-3">
              {searchTerm ? (
                <Button
                  round
                  size="small"
                  style={{
                    background: "#E2E8F0",
                    color: "#334155",
                    border: "none",
                    fontWeight: 700,
                  }}
                  onClick={resetSearch}
                >
                  清除搜索
                </Button>
              ) : null}
              <Button
                round
                size="small"
                style={{
                  background: "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                }}
                  onClick={openCreateTaskSheet}
                >
                  创建第一个任务
                </Button>
            </View>
          </View>
        ) : null}

        <View className="mt-4 space-y-3">
          {list.map((item) => {
            const joined = joinedIds.has(item.id);

            return (
              <View
                key={item.id}
                className="overflow-hidden rounded-2xl bg-white px-4 py-3 active:opacity-80"
                style={{ boxShadow: "0 1px 6px rgba(15, 23, 42, 0.04)" }}
                onClick={() => goDetail(item.id)}
              >
                <View className="flex items-center justify-between gap-2">
                  <View className="min-w-0 flex-1 flex items-center gap-2">
                    <Text className="block truncate text-sm font-semibold text-slate-900">{item.title}</Text>
                    {joined ? (
                      <Tag
                        shape="rounded"
                        size="small"
                        style={{
                          background: "rgba(22,163,74,0.12)",
                          color: "#16A34A",
                          borderColor: "transparent",
                          flexShrink: 0,
                        }}
                      >
                        已加入
                      </Tag>
                    ) : null}
                  </View>
                  <View className="flex items-center gap-2 shrink-0">
                    <Text className="text-xs text-slate-400">{item.join_cnt || 0}人参与</Text>
                    <ArrowRight size="14" color="#cbd5e1" />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {loading && (
          <View className="py-6 flex justify-center">
            <Loading type="spinner" style={{ color: "#0F766E" }}>
              加载中...
            </Loading>
          </View>
        )}

        {!loading && list.length > 0 && !hasMore ? (
          <View className="py-4 text-center">
            <Text className="text-xs text-slate-400">已经到底了</Text>
          </View>
        ) : null}

        {!loading && paginationError ? (
          <View className="pb-4">
            <View className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
              <Text className="block text-sm font-medium text-amber-900">后续任务加载失败</Text>
              <Text className="mt-1 block text-xs leading-5 text-amber-700">{paginationError}</Text>
              <Button
                round
                size="small"
                className="mt-3"
                style={{
                  background: "#fff",
                  color: "#92400E",
                  border: "1px solid rgba(146,64,14,0.12)",
                  fontWeight: 700,
                }}
                onClick={() => loadList(page + 1, true, searchTerm)}
              >
                重试加载更多
              </Button>
            </View>
          </View>
        ) : null}
      </View>

      <CheckinCreateSheet
        open={createOpen}
        title={createTitle}
        description={createDescription}
        submitting={createSubmitting}
        error={createError}
        onClose={closeCreateTaskSheet}
        onTitleChange={(value) => {
          setCreateTitle(value);
          if (createError) {
            setCreateError("");
          }
        }}
        onDescriptionChange={(value) => {
          setCreateDescription(value);
          if (createError) {
            setCreateError("");
          }
        }}
        onSubmit={submitCreateTask}
        onPresetSelect={applyPreset}
      />
    </View>
  );
}
