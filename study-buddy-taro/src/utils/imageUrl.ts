import { getApiBaseUrl } from "~/utils/apiBase";

export function resolveImageUrl(url?: string) {
  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://")
    || url.startsWith("https://")
    || url.startsWith("data:")
    || url.startsWith("wxfile://")
  ) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
