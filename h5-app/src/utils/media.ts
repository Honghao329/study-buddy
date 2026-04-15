const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || 'http://127.0.0.1:3900').replace(/\/$/, '');

export function resolveMediaUrl(url?: string | null) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  if (value.startsWith('//')) return `http:${value}`;
  return `${API_ORIGIN}/${value.replace(/^\//, '')}`;
}

export function resolveMediaList(urls?: string[] | null) {
  return (urls || []).map((url) => resolveMediaUrl(url)).filter(Boolean);
}

export { API_ORIGIN };
