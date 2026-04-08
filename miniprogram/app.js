App({
	globalData: {
		userInfo: null,
		isLogin: false,
	},
	onLaunch() {
		const token = wx.getStorageSync('token');
		const userInfo = wx.getStorageSync('userInfo');
		if (token && userInfo) {
			this.globalData.isLogin = true;
			this.globalData.userInfo = userInfo;
		}
	}
})
