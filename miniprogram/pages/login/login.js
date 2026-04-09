const api = require('../../utils/api.js');
const app = getApp();

Page({
	data: {
		nickName: '',
		password: '',
		avatarUrl: '',
		loading: false,
		showPwd: false,
	},

	onLoad() {
		if (api.getToken() && wx.getStorageSync('userInfo')) {
			const pages = getCurrentPages();
			if (pages.length > 1) { wx.navigateBack(); }
			else { wx.switchTab({ url: '/pages/index/index' }); }
		}
	},

	onNickNameInput(e) {
		this.setData({ nickName: e.detail.value });
	},

	onPasswordInput(e) {
		this.setData({ password: e.detail.value });
	},

	togglePwd() {
		this.setData({ showPwd: !this.data.showPwd });
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
		const { nickName, password } = this.data;
		if (!nickName.trim()) {
			wx.showToast({ title: '请输入昵称', icon: 'none' });
			return;
		}
		if (!password || password.length < 4) {
			wx.showToast({ title: '密码至少4位', icon: 'none' });
			return;
		}

		this.setData({ loading: true });

		const doLoginRequest = (avatarUrl) => {
			api.post('/api/user/login', {
				nickname: nickName.trim(),
				password: password,
				avatarUrl: avatarUrl || '',
			}).then(res => {
				this.setData({ loading: false });
				if (res && res.token) {
					wx.setStorageSync('token', res.token);
					wx.setStorageSync('userInfo', res.user);
					app.globalData.isLogin = true;
					app.globalData.userInfo = res.user;
					wx.showToast({ title: '登录成功', icon: 'success' });
					setTimeout(() => {
						// 如果有来源页，返回；否则去首页
						const pages = getCurrentPages();
						if (pages.length > 1) {
							wx.navigateBack();
						} else {
							wx.switchTab({ url: '/pages/index/index' });
						}
					}, 800);
				}
			}).catch(() => { this.setData({ loading: false }); });
		};

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
