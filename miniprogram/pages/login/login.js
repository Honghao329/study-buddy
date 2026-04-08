const api = require('../../utils/api.js');
const app = getApp();

Page({
	data: {
		nickName: '',
		avatarUrl: '',
		loading: false,
	},

	onLoad() {
		// 已登录直接回去
		if (api.getToken() && wx.getStorageSync('userInfo')) {
			wx.switchTab({ url: '/pages/my/my' });
		}
	},

	onNickNameInput(e) {
		this.setData({ nickName: e.detail.value });
	},

	onPickAvatar() {
		wx.chooseMedia({
			count: 1,
			mediaType: ['image'],
			sourceType: ['album', 'camera'],
			success: (res) => {
				this.setData({ avatarUrl: res.tempFiles[0].tempFilePath });
			}
		});
	},

	doLogin() {
		const { nickName } = this.data;
		if (!nickName.trim()) {
			wx.showToast({ title: '请输入昵称', icon: 'none' });
			return;
		}

		this.setData({ loading: true });

		// 先上传头像（如果有）
		const doLoginRequest = (avatarUrl) => {
			const demoUid = wx.getStorageSync('demo_uid') || ('user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
			wx.setStorageSync('demo_uid', demoUid);

			wx.login({
				success: (loginRes) => {
					api.post('/api/user/login', {
						code: loginRes.code || demoUid,
						demoUid,
						nickName: nickName.trim(),
						avatarUrl: avatarUrl || '',
					}).then(res => {
						this.setData({ loading: false });
						if (res && res.token) {
							wx.setStorageSync('token', res.token);
							wx.setStorageSync('userInfo', res.user);
							app.globalData.isLogin = true;
							app.globalData.userInfo = res.user;
							wx.showToast({ title: '登录成功', icon: 'success' });
							setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 800);
						}
					}).catch(() => { this.setData({ loading: false }); });
				},
				fail: () => {
					// wx.login 失败降级
					api.post('/api/user/login', {
						code: demoUid,
						demoUid,
						nickName: nickName.trim(),
						avatarUrl: avatarUrl || '',
					}).then(res => {
						this.setData({ loading: false });
						if (res && res.token) {
							wx.setStorageSync('token', res.token);
							wx.setStorageSync('userInfo', res.user);
							app.globalData.isLogin = true;
							app.globalData.userInfo = res.user;
							wx.showToast({ title: '登录成功', icon: 'success' });
							setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 800);
						}
					}).catch(() => { this.setData({ loading: false }); });
				}
			});
		};

		// 如果有本地头像先上传
		if (this.data.avatarUrl && !this.data.avatarUrl.startsWith('http')) {
			api.uploadImage(this.data.avatarUrl).then(url => {
				doLoginRequest(url);
			}).catch(() => {
				doLoginRequest('');
			});
		} else {
			doLoginRequest(this.data.avatarUrl);
		}
	},
});
