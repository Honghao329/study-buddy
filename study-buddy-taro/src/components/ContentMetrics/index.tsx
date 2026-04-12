import type { ReactNode, CSSProperties } from "react";
import { Text, View } from "@tarojs/components";

export type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface MetricItem {
  key: string;
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: MetricTone;
  active?: boolean;
  onClick?: () => void;
}

interface ContentMetricsProps {
  items: MetricItem[];
  variant?: "inline" | "tiles";
  className?: string;
  style?: CSSProperties;
}

type ToneStyles = {
  shell: string;
  icon: string;
  label: string;
  value: string;
  border: string;
};

const TONE_STYLES: Record<MetricTone, ToneStyles> = {
  neutral: {
    shell: "bg-slate-50 text-slate-700",
    icon: "bg-slate-200 text-slate-600",
    label: "text-slate-500",
    value: "text-slate-900",
    border: "border-slate-100",
  },
  primary: {
    shell: "bg-sky-50 text-sky-700",
    icon: "bg-sky-100 text-sky-600",
    label: "text-sky-500",
    value: "text-sky-950",
    border: "border-sky-100",
  },
  success: {
    shell: "bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-100 text-emerald-600",
    label: "text-emerald-500",
    value: "text-emerald-950",
    border: "border-emerald-100",
  },
  warning: {
    shell: "bg-amber-50 text-amber-700",
    icon: "bg-amber-100 text-amber-600",
    label: "text-amber-500",
    value: "text-amber-950",
    border: "border-amber-100",
  },
  danger: {
    shell: "bg-rose-50 text-rose-700",
    icon: "bg-rose-100 text-rose-600",
    label: "text-rose-500",
    value: "text-rose-950",
    border: "border-rose-100",
  },
  info: {
    shell: "bg-indigo-50 text-indigo-700",
    icon: "bg-indigo-100 text-indigo-600",
    label: "text-indigo-500",
    value: "text-indigo-950",
    border: "border-indigo-100",
  },
};

function formatValue(value: number | string) {
  if (typeof value === "number") {
    return value.toLocaleString("zh-CN");
  }
  return value;
}

function getToneStyles(tone: MetricTone = "neutral") {
  return TONE_STYLES[tone] || TONE_STYLES.neutral;
}

export default function ContentMetrics({
  items,
  variant = "inline",
  className = "",
  style,
}: ContentMetricsProps) {
  if (!items.length) {
    return null;
  }

  if (variant === "tiles") {
    return (
      <View className={`flex flex-wrap gap-3 ${className}`} style={style}>
        {items.map((item) => {
          const toneStyles = getToneStyles(item.tone);
          const clickable = typeof item.onClick === "function";

          return (
            <View
              key={item.key}
              className={`flex min-w-[96px] flex-1 flex-col rounded-2xl border p-3 transition-opacity ${
                clickable ? "active:opacity-80" : ""
              } ${toneStyles.shell} ${toneStyles.border} ${item.active ? "ring-2 ring-offset-1" : ""}`}
              style={{ boxShadow: item.active ? "0 8px 24px rgba(0,0,0,0.06)" : "0 1px 8px rgba(0,0,0,0.04)" }}
              onClick={item.onClick}
            >
              <View className={`mb-2 flex h-10 w-10 items-center justify-center rounded-2xl ${toneStyles.icon}`}>
                {item.icon}
              </View>
              <Text className={`block text-xs ${toneStyles.label}`}>{item.label}</Text>
              <Text className={`mt-1 block text-xl font-semibold leading-6 ${toneStyles.value}`}>
                {formatValue(item.value)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View className={`flex flex-wrap gap-2 ${className}`} style={style}>
      {items.map((item) => {
        const toneStyles = getToneStyles(item.tone);
        const clickable = typeof item.onClick === "function";

        return (
          <View
            key={item.key}
            className={`flex items-center rounded-full border px-3 py-2 transition-opacity ${
              clickable ? "active:opacity-80" : ""
            } ${toneStyles.shell} ${toneStyles.border} ${item.active ? "ring-1 ring-offset-1" : ""}`}
            onClick={item.onClick}
          >
            <View className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full ${toneStyles.icon}`}>
              {item.icon}
            </View>
            <View className="min-w-0">
              <Text className={`block text-[10px] leading-4 ${toneStyles.label}`}>{item.label}</Text>
              <Text className={`block text-sm font-semibold leading-5 ${toneStyles.value}`}>
                {formatValue(item.value)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
