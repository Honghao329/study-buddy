import { Input, Text, Textarea, View } from "@tarojs/components";
import { Button } from "@taroify/core";
import { Edit } from "@taroify/icons";
import KeyboardAdaptivePopup from "~/components/KeyboardAdaptivePopup";

interface QuickPreset {
  title: string;
  description: string;
}

interface CheckinCreateSheetProps {
  open: boolean;
  title: string;
  description: string;
  submitting?: boolean;
  error?: string;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onPresetSelect: (preset: QuickPreset) => void;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    title: "7天晨读挑战",
    description: "每天阅读 20 分钟，写下今天的一条收获。",
  },
  {
    title: "晚间复盘计划",
    description: "记录今天完成了什么、卡在哪里、明天怎么继续。",
  },
  {
    title: "每日运动打卡",
    description: "完成一次运动，并把时长和状态写清楚。",
  },
];

function CheckinCreateSheet({
  open,
  title,
  description,
  submitting = false,
  error = "",
  onClose,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onPresetSelect,
}: CheckinCreateSheetProps) {
  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !submitting;

  return (
    <KeyboardAdaptivePopup
      open={open}
      onClose={onClose}
      placement="bottom"
      rounded
      style={{ backgroundColor: "#F8FAFC" }}
    >
      <View className="mx-auto w-full max-w-md px-4 pb-6 pt-3">
        <View className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300/80" />

        <View
          className="overflow-hidden rounded-[28px] bg-white"
          style={{ boxShadow: "0 18px 44px rgba(15, 23, 42, 0.10)" }}
        >
          <View
            className="relative overflow-hidden px-5 py-5"
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #0F766E 58%, #16A34A 120%)",
            }}
          >
            <View className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10" />
            <View className="absolute bottom-0 left-0 h-16 w-16 rounded-full bg-emerald-300/10" />

            <View className="flex items-center gap-3">
              <View className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Edit size="20" color="#fff" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="block text-lg font-semibold text-white">创建打卡任务</Text>
                <Text className="mt-1 block text-sm leading-6 text-white/70">
                  先把目标说清楚，后续搜索、加入和打卡才会更顺。
                </Text>
              </View>
            </View>

            <View className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
              <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                公开展示
              </View>
              <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                支持搜索
              </View>
              <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                可随时加入
              </View>
            </View>
          </View>

          <View className="px-4 py-4">
            <View className="rounded-3xl bg-slate-50 p-4">
              <View className="flex items-center justify-between">
                <Text className="block text-sm font-semibold text-slate-900">任务名称</Text>
                <Text className="text-xs text-slate-400">{title.length}/40</Text>
              </View>
              <View className="mt-3 rounded-2xl bg-white px-4 py-3">
                <Input
                  className="w-full text-sm text-slate-900"
                  value={title}
                  placeholder="例如：21天晨读挑战"
                  placeholderStyle="color: #94A3B8"
                  maxlength={40}
                  confirmType="done"
                  onInput={(e) => onTitleChange(e.detail.value)}
                />
              </View>

              <View className="mt-4 flex items-center justify-between">
                <Text className="block text-sm font-semibold text-slate-900">任务说明</Text>
                <Text className="text-xs text-slate-400">{description.length}/200</Text>
              </View>
              <View className="mt-3 rounded-2xl bg-white px-4 py-3">
                <Textarea
                  className="h-28 w-full text-sm leading-6 text-slate-900"
                  value={description}
                  placeholder="补充一点任务说明，帮助别人理解并加入"
                  placeholderStyle="color: #94A3B8"
                  maxlength={200}
                  autoHeight
                  adjustPosition={false}
                  onInput={(e) => onDescriptionChange(e.detail.value)}
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="block text-xs font-medium tracking-wide text-slate-500">
                快速填充
              </Text>
              <View className="mt-2 flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset) => (
                  <Button
                    key={preset.title}
                    round
                    size="small"
                    style={{
                      background: "#fff",
                      color: "#0F172A",
                      border: "1px solid #E2E8F0",
                      fontWeight: 700,
                    }}
                    onClick={() => onPresetSelect(preset)}
                  >
                    {preset.title}
                  </Button>
                ))}
              </View>
            </View>

            {error ? (
              <View className="mt-4 rounded-2xl bg-rose-50 px-4 py-3">
                <Text className="block text-sm leading-6 text-rose-600">{error}</Text>
              </View>
            ) : null}

            <View className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3">
              <Text className="block text-xs font-medium text-emerald-600">创建后会怎么展示</Text>
              <Text className="mt-1 block text-sm leading-6 text-emerald-900/80">
                新任务会立刻出现在打卡列表中，支持搜索、查看详情和加入参与。
              </Text>
            </View>

            <Button
              block
              round
              size="large"
              loading={submitting}
              disabled={!canSubmit}
              className="mt-5"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, #0F766E 0%, #16A34A 100%)"
                  : "#CBD5E1",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                boxShadow: canSubmit ? "0 10px 22px rgba(15, 118, 110, 0.22)" : "none",
              }}
              onClick={onSubmit}
            >
              {submitting ? "创建中..." : "创建任务"}
            </Button>

            <Button
              block
              round
              size="large"
              className="mt-3"
              style={{
                background: "#F1F5F9",
                color: "#334155",
                border: "none",
                fontWeight: 700,
              }}
              onClick={onClose}
            >
              取消
            </Button>

            <Text className="mt-3 block text-center text-[11px] leading-5 text-slate-400">
              标题建议控制在 4-20 个字，说明建议写清目标和参与方式。
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAdaptivePopup>
  );
}

export default CheckinCreateSheet;
