const api = require('../../utils/api.js');

Page({
	data: { list: [], loading: false },

	onShow() {
		if (!api.getToken()) return;
		this.loadMessages();
	},

	loadMessages() {
		this.setData({ loading: true });
		api.get('/api/message/list', { page: 1, size: 50 }).then(res => {
			this.setData({ list: (res && res.list) || [], loading: false });
		}).catch(() => { this.setData({ loading: false }); });
	},

	onMsgTap(e) {
		const { type, id } = e.currentTarget.dataset;
		const msgId = e.currentTarget.dataset.msgid;
		// 单条标记已读
		if (msgId) api.post('/api/message/read', { id: msgId }).catch(() => {});

		if ((type === 'remind') && id) {
			wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + id });
		} else if ((type === 'like' || type === 'comment') && id) {
			wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id });
		} else if (type === 'partner') {
			wx.navigateTo({ url: '/pages/partner/partner?tab=1' });
		}
	},

	readAll() {
		api.post('/api/message/read', {}).then(() => {
			const list = this.data.list.map(m => ({ ...m, is_read: 1 }));
			this.setData({ list });
			wx.showToast({ title: '已全部已读', icon: 'success' });
		});
	},

	onPullDownRefresh() { this.loadMessages(); wx.stopPullDownRefresh(); },
});
