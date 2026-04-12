import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";
import { Button } from "@taroify/core";

interface LoginGateCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  highlights?: string[];
  actionText?: string;
  onAction: () => void;
}

export default function LoginGateCard({
  icon,
  title,
  description,
  highlights = [],
  actionText = "立即登录",
  onAction,
}: LoginGateCardProps) {
  return (
    <View
      className="relative overflow-hidden rounded-[28px] px-5 py-6"
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #134E4A 56%, #0F766E 120%)",
        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.16)",
      }}
    >
      <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <View className="absolute bottom-0 left-6 h-16 w-16 rounded-full bg-emerald-300/10" />

      <View className="flex items-start gap-3">
        <View className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          {icon}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="block text-lg font-semibold text-white">{title}</Text>
          <Text className="mt-1 block text-sm leading-6 text-white/70">
            {description}
          </Text>
        </View>
      </View>

      {highlights.length > 0 ? (
        <View className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
          {highlights.map((item) => (
            <View
              key={item}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1"
            >
              {item}
            </View>
          ))}
        </View>
      ) : null}

      <Button
        block
        round
        size="large"
        className="mt-6"
        style={{
          background: "#fff",
          color: "#0F172A",
          border: "none",
          fontWeight: 700,
          boxShadow: "0 8px 24px rgba(255,255,255,0.14)",
        }}
        onClick={onAction}
      >
        {actionText}
      </Button>
    </View>
  );
}
