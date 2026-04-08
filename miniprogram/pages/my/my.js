const api = require('../../utils/api.js');
const app = getApp();

function normalizeUser(user) {
	if (!user) return null;
	return {
		...user,
		nickname: user.nickname || user.nickName || '',
		nickName: user.nickName || user.nickname || '',
		avatar: user.avatar || user.avatarUrl || '',
		avatarUrl: user.avatarUrl || user.avatar || '',
	};
}

function getOrCreateDemoUid() {
	let demoUid = wx.getStorageSync('demo_uid');
	if (!demoUid) {
		demoUid = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
		wx.setStorageSync('demo_uid', demoUid);
	}
	return demoUid;
}

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
		const user = normalizeUser(wx.getStorageSync('userInfo'));
		if (token) {
			this.setData({ logged: true, user });
			this._loadUserInfo();
		} else {
			this.setData({ logged: false, user: null });
		}
	},

	_loadUserInfo() {
		api.get('/api/user/info').then(user => {
			const normalizedUser = normalizeUser(user);
			if (normalizedUser) {
				wx.setStorageSync('userInfo', normalizedUser);
				app.globalData.userInfo = normalizedUser;
				app.globalData.isLogin = true;
				this.setData({ user: normalizedUser });
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

		const resolveAvatarUrl = () => {
			if (!avatarUrl) return Promise.resolve('');
			if (/^https?:\/\//.test(avatarUrl) || avatarUrl.indexOf('/uploads/') === 0) {
				return Promise.resolve(avatarUrl);
			}
			return api.uploadImage(avatarUrl).catch(() => '');
		};
		const demoUid = getOrCreateDemoUid();

		// 调用 wx.login 获取 code
			wx.login({
				success: (loginRes) => {
					if (!loginRes.code) {
						wx.hideLoading();
						wx.showToast({ title: '微信登录失败，请重试', icon: 'none' });
						return;
					}
					resolveAvatarUrl().then((resolvedAvatarUrl) => {
						return api.post('/api/user/login', {
							code: loginRes.code,
							demoUid,
							nickname: nickName.trim(),
							nickName: nickName.trim(),
							avatarUrl: resolvedAvatarUrl
						});
					}).then(res => {
						wx.hideLoading();
						if (res && res.token) {
							const user = normalizeUser(res.user);
							wx.setStorageSync('token', res.token);
							wx.setStorageSync('demo_uid', demoUid);
							wx.setStorageSync('userInfo', user);
							app.globalData.isLogin = true;
							app.globalData.userInfo = user;
							this._checkLogin();
							wx.showToast({ title: '登录成功', icon: 'success' });
						}
				}).catch(() => {
					wx.hideLoading();
				});
			},
			fail: () => {
				wx.hideLoading();
				wx.showToast({ title: '微信登录失败，请重试', icon: 'none' });
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
		wx.removeStorageSync('token');
		wx.removeStorageSync('userInfo');
		app.globalData.isLogin = false;
		app.globalData.userInfo = null;
		this.setData({ logged: false, user: null, nickName: '', avatarUrl: '', showLogoutModal: false });
		wx.showToast({ title: '已退出', icon: 'success' });
	},
});
