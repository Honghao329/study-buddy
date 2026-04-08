/**
 * 管理后台 API 封装
 */
const API_BASE = window.location.origin;

function getAdminToken() {
  return localStorage.getItem('admin_token') || '';
}

function checkAuth() {
  if (!getAdminToken()) {
    window.location.href = './login.html';
    return false;
  }
  return true;
}

async function request(url, method = 'GET', data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() },
  };
  if (data && method !== 'GET') opts.body = JSON.stringify(data);

  const res = await fetch(API_BASE + url, opts);
  const json = await res.json();
  if (json.code === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = './login.html';
    throw new Error('未授权');
  }
  return json;
}

const adminApi = {
  get: (url) => request(url),
  post: (url, data) => request(url, 'POST', data),
  put: (url, data) => request(url, 'PUT', data),
  del: (url) => request(url, 'DELETE'),
};
