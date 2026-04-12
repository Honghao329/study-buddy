import Taro from "@tarojs/taro";
import { joinApiUrl } from "~/utils/apiBase";

interface ApiResponse<T> {
  code?: number;
  msg?: string;
  data?: T;
}

function getToken(): string {
  return Taro.getStorageSync("token") || "";
}

export function setToken(token: string) {
  Taro.setStorageSync("token", token);
}

export function clearToken() {
  Taro.removeStorageSync("token");
  Taro.removeStorageSync("userInfo");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function request<T = any>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
): Promise<T> {
  const header: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  const res = await Taro.request<ApiResponse<T>>({
    url: joinApiUrl(url),
    method,
    data,
    header,
  });

  const body = res.data || {};
  if (body.code === 401) {
    clearToken();
    Taro.navigateTo({ url: "/pages/login/index" });
    throw new Error("未登录");
  }
  if (body.code !== 200) {
    throw new Error(body.msg || "请求失败");
  }
  return body.data as T;
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => {
    const query = params
      ? Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join("&")
      : "";
    return request<T>(query ? `${url}?${query}` : url, "GET");
  },
  post: <T = any>(url: string, data?: any) => request<T>(url, "POST", data),
  put: <T = any>(url: string, data?: any) => request<T>(url, "PUT", data),
  del: <T = any>(url: string) => request<T>(url, "DELETE"),
};
