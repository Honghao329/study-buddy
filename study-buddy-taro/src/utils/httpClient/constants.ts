import { getApiBaseUrl } from "~/utils/apiBase";

// 定义域名配置
const domainConfig = {
  production: {
    v1: getApiBaseUrl(),
  },
  preview: {
    v1: getApiBaseUrl(),
  },
  development: {
    v1: getApiBaseUrl(),
  },
} as const;

// 定义环境类型
export type Environment = keyof typeof domainConfig;

// 定义API版本类型
export type ApiVersion = keyof typeof domainConfig[Environment];

// 定义URL路径类型
export type ApiPath = `/${ApiVersion}${string}`;

// 定义完整URL类型
export type FullUrl = `http://${string}` | `https://${string}`;

export default domainConfig;
