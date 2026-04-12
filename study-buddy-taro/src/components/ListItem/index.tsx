import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";

type ListItemTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<ListItemTone, { shell: string; icon: string; text: string }> = {
  neutral: {
    shell: "bg-slate-50",
    icon: "text-slate-600",
    text: "text-slate-900",
  },
  primary: {
    shell: "bg-sky-50",
    icon: "text-sky-600",
    text: "text-slate-900",
  },
  success: {
    shell: "bg-emerald-50",
    icon: "text-emerald-600",
    text: "text-slate-900",
  },
  warning: {
    shell: "bg-amber-50",
    icon: "text-amber-600",
    text: "text-slate-900",
  },
  danger: {
    shell: "bg-rose-50",
    icon: "text-rose-600",
    text: "text-slate-900",
  },
  info: {
    shell: "bg-indigo-50",
    icon: "text-indigo-600",
    text: "text-slate-900",
  },
};

interface ListItemProps {
  icon?: ReactNode | string;
  label: ReactNode;
  description?: ReactNode;
  tone?: ListItemTone;
  onClick?: () => void;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  iconContainerClassName?: string;
  rightIcon?: ReactNode;
}

function ListItem({
  icon,
  label,
  description,
  tone = "primary",
  onClick,
  className = "",
  labelClassName = "",
  descriptionClassName = "",
  iconContainerClassName = "",
  rightIcon,
}: ListItemProps) {
  const toneStyles = TONE_STYLES[tone] || TONE_STYLES.primary;

  return (
    <View
      className={`flex items-center justify-between py-3 active:opacity-80 ${className}`}
      onClick={onClick}
    >
      <View className="mx-4 flex min-w-0 flex-1 items-center">
        {icon && (
          <View
            className={`mr-4 flex size-10 items-center justify-center rounded-2xl ${toneStyles.shell} ${iconContainerClassName}`}
          >
            {typeof icon === "string" ? (
              <View className={`${icon} text-lg ${toneStyles.icon}`} />
            ) : (
              icon
            )}
          </View>
        )}
        <View className="min-w-0">
          <Text className={`block font-semibold ${toneStyles.text} ${labelClassName}`}>
            {label}
          </Text>
          {description && (
            <Text className={`mt-1 block text-sm text-slate-500 ${descriptionClassName}`}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <View className="mx-4 flex items-center justify-center rounded-full">
        {rightIcon ?? <View className="i-tabler-chevron-right size-5 text-slate-400" />}
      </View>
    </View>
  );
}

export default ListItem;
