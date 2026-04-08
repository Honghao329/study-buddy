const api = require('../../utils/api.js');
const app = getApp();

Page({
	data: {
		logged: false,
		user: null,
		showLogoutModal: false,
		// 登录表单
		nickName: '',
		avatarUrl: '',
	},

	onShow() {
		this._checkLogin();
	},

	_checkLogin() {
		const token = wx.getStorageSync('token');
		const user = wx.getStorageSync('userInfo');
		if (token && user) {
			this.setData({ logged: true, user });
			this._loadUserInfo();
		} else {
			this.setData({ logged: false, user: null });
		}
	},

	_loadUserInfo() {
		api.get('/api/user/info').then(user => {
			if (user) {
				wx.setStorageSync('userInfo', user);
				app.globalData.userInfo = user;
				app.globalData.isLogin = true;
				this.setData({ user });
			}
		}).catch(() => {});
	},

	// 头像选择 - 使用 chooseImage 从相册/相机选取，兼容开发工具
	onPickAvatar() {
		wx.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera'],
			success: (res) => {
				const tempPath = res.tempFilePaths[0];
				this.setData({ avatarUrl: tempPath });
			}
		});
	},

	// 昵称输入
	onNickNameInput(e) {
		this.setData({ nickName: e.detail.value });
	},

	// 登录
	doLogin() {
		const { nickName, avatarUrl } = this.data;
		if (!nickName.trim()) {
			wx.showToast({ title: '请输入昵称', icon: 'none' });
			return;
		}

		wx.showLoading({ title: '登录中...' });

		// 调用 wx.login 获取 code
		wx.login({
			success: (loginRes) => {
				const code = loginRes.code || ('user_' + Date.now());
				api.post('/api/user/login', {
					code,
					nickName: nickName.trim(),
					avatarUrl: avatarUrl || ''
				}).then(res => {
					wx.hideLoading();
					if (res && res.token) {
						wx.setStorageSync('token', res.token);
						wx.setStorageSync('userInfo', res.user);
						app.globalData.isLogin = true;
						app.globalData.userInfo = res.user;
						this._checkLogin();
						wx.showToast({ title: '登录成功', icon: 'success' });
					}
				}).catch(() => {
					wx.hideLoading();
				});
			},
			fail: () => {
				wx.hideLoading();
				// 降级方案
				const code = 'user_' + Date.now();
				api.post('/api/user/login', {
					code,
					nickName: nickName.trim(),
					avatarUrl: avatarUrl || ''
				}).then(res => {
					if (res && res.token) {
						wx.setStorageSync('token', res.token);
						wx.setStorageSync('userInfo', res.user);
						this._checkLogin();
						wx.showToast({ title: '登录成功', icon: 'success' });
					}
				});
			}
		});
	},

	// 菜单导航
	goNotes() { wx.switchTab({ url: '/pages/note_list/note_list' }); },
	goSign() { wx.navigateTo({ url: '/pages/sign/sign' }); },
	goPartner() { wx.navigateTo({ url: '/pages/partner/partner' }); },
	goFavorite() { wx.navigateTo({ url: '/pages/favorite/favorite' }); },
	goEdit() { wx.navigateTo({ url: '/pages/my_edit/my_edit' }); },
	goAdmin() { wx.navigateTo({ url: '/pages/admin_login/admin_login' }); },

	// 退出登录
	showLogout() { this.setData({ showLogoutModal: true }); },
	hideLogout() { this.setData({ showLogoutModal: false }); },
	doLogout() {
		wx.clearStorageSync();
		app.globalData.isLogin = false;
		app.globalData.userInfo = null;
		this.setData({ logged: false, user: null, nickName: '', avatarUrl: '', showLogoutModal: false });
		wx.showToast({ title: '已退出', icon: 'success' });
	},
});
