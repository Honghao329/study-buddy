const DEFAULT_API_BASE_URL = "http://127.0.0.1:3900";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  let envUrl = "";
  try {
    envUrl = typeof TARO_APP_API_BASE_URL !== "undefined"
      ? TARO_APP_API_BASE_URL
      : "";
  } catch {
    // ignore
  }
  return normalizeBaseUrl(envUrl || DEFAULT_API_BASE_URL);
}

export function joinApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

declare const TARO_APP_API_BASE_URL: string;
