/**
 * API 请求封装
 */
const { getRuntimeBaseUrl } = require('./config');
const { parseUploadResponse } = require('./normalizers');

const BASE = getRuntimeBaseUrl();

function getToken() { return wx.getStorageSync('token') || ''; }
function getAdminToken() { return wx.getStorageSync('admin_token') || ''; }
function getBaseUrl() { return getRuntimeBaseUrl(); }

let _redirectingToLogin = false;
function requireLogin() {
	if (_redirectingToLogin) return;
	const pages = getCurrentPages();
	const cur = pages[pages.length - 1];
	const route = cur ? '/' + cur.route : '';
	if (route === '/pages/login/login') return;
	_redirectingToLogin = true;
	wx.navigateTo({
		url: '/pages/login/login',
		complete() { _redirectingToLogin = false; }
	});
}

function request(url, method = 'GET', data = {}, isAdmin = false) {
	return new Promise((resolve, reject) => {
		const header = { 'Content-Type': 'application/json' };
		if (isAdmin) header['x-admin-token'] = getAdminToken();
		else header['x-token'] = getToken();

		wx.request({
			url: getBaseUrl() + url,
			method,
			data,
			header,
			success(res) {
				if (res.data && res.data.code === 200) {
					resolve(res.data.data);
				} else if (res.data && res.data.code === 401) {
					wx.removeStorageSync('token');
					wx.removeStorageSync('userInfo');
					requireLogin();
					reject(res.data);
				} else {
					const msg = (res.data && res.data.msg) || '请求失败';
					wx.showToast({ title: msg, icon: 'none' });
					reject(res.data);
				}
			},
			fail(err) {
				wx.showToast({ title: '网络错误，请检查连接', icon: 'none' });
				reject(err);
			}
		});
	});
}

function get(url, data) {
	let query = '';
	if (data) {
		const pairs = Object.entries(data).filter(([k,v]) => v !== undefined && v !== null && v !== '');
		if (pairs.length) query = '?' + pairs.map(([k,v]) => k + '=' + encodeURIComponent(v)).join('&');
	}
	return request(url + query, 'GET');
}

function post(url, data) { return request(url, 'POST', data); }
function put(url, data) { return request(url, 'PUT', data); }
function del(url) { return request(url, 'DELETE'); }

function adminGet(url, data) {
	let query = '';
	if (data) {
		const pairs = Object.entries(data).filter(([k,v]) => v !== undefined && v !== null && v !== '');
		if (pairs.length) query = '?' + pairs.map(([k,v]) => k + '=' + encodeURIComponent(v)).join('&');
	}
	return request(url + query, 'GET', {}, true);
}
function adminPost(url, data) { return request(url, 'POST', data, true); }
function adminDel(url) { return request(url, 'DELETE', {}, true); }

	function uploadImage(filePath) {
		return new Promise((resolve, reject) => {
			wx.uploadFile({
				url: getBaseUrl() + '/api/upload/image',
				filePath,
				name: 'file',
				header: { 'x-token': getToken() },
				success(res) {
					const data = parseUploadResponse(res.data);
					if (data && data.code === 200 && data.data && data.data.url) {
						resolve(getBaseUrl() + data.data.url);
					} else {
						reject(data || { code: 500, msg: '上传失败' });
					}
				},
				fail: reject
			});
		});
	}

module.exports = { BASE, getBaseUrl, get, post, put, del, adminGet, adminPost, adminDel, uploadImage, getToken, requireLogin };
