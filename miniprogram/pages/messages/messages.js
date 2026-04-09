const api = require('../../utils/api.js');

Page({
	data: { list: [], loading: false, loadFailed: false, page: 1, size: 20, total: 0, hasMore: true },

	onShow() {
		if (!api.getToken()) {
			api.requireLogin();
			return;
		}
		this.setData({ list: [], page: 1, hasMore: true });
		this.loadMessages();
	},

	loadMessages() {
		if (this.data.loading || !this.data.hasMore) return;
		this.setData({ loading: true, loadFailed: false });
		const { page, size } = this.data;
		api.get('/api/message/list', { page, size }).then(res => {
			const items = (res && res.list) || [];
			const list = page === 1 ? items : this.data.list.concat(items);
			this.setData({ list, total: res.total || 0, loading: false, hasMore: items.length >= size });
		}).catch(() => { this.setData({ loading: false, loadFailed: true }); });
	},

	onMsgTap(e) {
		const { type, id } = e.currentTarget.dataset;
		const msgId = e.currentTarget.dataset.msgid;
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

	onPullDownRefresh() {
		this.setData({ list: [], page: 1, hasMore: true });
		this.loadMessages();
		wx.stopPullDownRefresh();
	},

	onReachBottom() {
		if (this.data.hasMore && !this.data.loading) {
			this.setData({ page: this.data.page + 1 });
			this.loadMessages();
		}
	},
});
