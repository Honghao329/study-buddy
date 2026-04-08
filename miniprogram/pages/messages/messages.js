const api = require('../../utils/api.js');

Page({
	data: {
		list: [],
		loading: false,
	},

	onShow() {
		if (!api.getToken()) return;
		this.loadMessages();
		// 全部标记已读
		api.post('/api/message/read', {}).catch(() => {});
	},

	loadMessages() {
		this.setData({ loading: true });
		api.get('/api/message/list', { page: 1, size: 50 }).then(res => {
			this.setData({ list: (res && res.list) || [], loading: false });
		}).catch(() => { this.setData({ loading: false }); });
	},

	goCheckin(e) {
		const id = e.currentTarget.dataset.id;
		if (id) wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + id });
	},

	onPullDownRefresh() {
		this.loadMessages();
		wx.stopPullDownRefresh();
	},
});
