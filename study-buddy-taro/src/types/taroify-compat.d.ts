import type { AvatarSize } from "@taroify/core/avatar/avatar.shared";

declare module "@taroify/core/button/button" {
  interface ButtonProps {
    round?: boolean;
    type?: string;
  }
}

declare module "@taroify/core/tag/tag" {
  interface TagProps {
    round?: boolean;
  }
}

declare module "@taroify/core/avatar/avatar" {
  interface AvatarProps {
    size?: AvatarSize | number;
  }
}

declare module "@taroify/core/field/field" {
  interface FieldProps {
    value?: unknown;
    type?: string;
    onChange?: (value: any) => void;
    placeholder?: string;
    placeholderStyle?: string;
    maxlength?: number;
    autoHeight?: boolean;
  }
}
