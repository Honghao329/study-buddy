App({
	globalData: {
		userInfo: null,
		isLogin: false,
		apiBaseUrl: '',
	},
	onLaunch() {
		const token = wx.getStorageSync('token');
		const userInfo = wx.getStorageSync('userInfo');
		this.globalData.apiBaseUrl = wx.getStorageSync('api_base_url') || '';
		if (token && userInfo) {
			this.globalData.isLogin = true;
			this.globalData.userInfo = userInfo;
		}
	}
})
