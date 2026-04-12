const DEFAULT_API_BASE_URL = "http://127.0.0.1:3900";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(
    process.env.TARO_APP_API_BASE_URL
      || process.env.TARO_API_BASE_URL
      || DEFAULT_API_BASE_URL,
  );
}

export function joinApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
