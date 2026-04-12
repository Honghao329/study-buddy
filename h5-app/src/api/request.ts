import axios from 'axios';

const http = axios.create({ baseURL: '/api', timeout: 10000 });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body.code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.hash = '#/login';
      throw new Error('未登录');
    }
    if (body.code !== 200) throw new Error(body.msg || '请求失败');
    return body.data;
  },
  (err) => { throw err; }
);

export const api = {
  get: <T = any>(url: string, params?: any) => http.get<any, T>(url, { params }),
  post: <T = any>(url: string, data?: any) => http.post<any, T>(url, data),
  put: <T = any>(url: string, data?: any) => http.put<any, T>(url, data),
  del: <T = any>(url: string) => http.delete<any, T>(url),
};

export const setToken = (t: string) => localStorage.setItem('token', t);
export const clearToken = () => { localStorage.removeItem('token'); localStorage.removeItem('userInfo'); };
export const isLoggedIn = () => !!localStorage.getItem('token');
export const getUserInfo = () => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; } };
