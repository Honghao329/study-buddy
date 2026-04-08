const DEFAULT_BASE_URL = 'http://127.0.0.1:3900';

function resolveBaseUrl({ storageValue = '', appBaseUrl = '' } = {}) {
  return storageValue || appBaseUrl || DEFAULT_BASE_URL;
}

function getRuntimeBaseUrl() {
  const storageValue = typeof wx !== 'undefined' && wx.getStorageSync
    ? wx.getStorageSync('api_base_url')
    : '';

  const appBaseUrl = typeof getApp === 'function'
    ? (((getApp() || {}).globalData || {}).apiBaseUrl || '')
    : '';

  return resolveBaseUrl({ storageValue, appBaseUrl });
}

module.exports = {
  DEFAULT_BASE_URL,
  resolveBaseUrl,
  getRuntimeBaseUrl,
};
