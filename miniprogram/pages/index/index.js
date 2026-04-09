const api = require('../../utils/api.js');
Page({
	data: {
		checkins: [], notes: [], activities: [],
		unreadCount: 0, isLogin: false, loadFailed: false,
	},
	onShow() {
		this.setData({ isLogin: !!api.getToken() });
		this.loadData();
		this._loadUnread();
	},
	async loadData() {
		let failed = false;
		const [checkins, notes, activity] = await Promise.all([
			api.get('/api/checkin/list', { page: 1, size: 6 }).catch(() => { failed = true; return { list: [] }; }),
			api.get('/api/note/public_list', { page: 1, size: 5, sort: 'hot' }).catch(() => { failed = true; return { list: [] }; }),
			api.get('/api/home/activity').catch(() => { failed = true; return []; }),
		]);
		this.setData({
			checkins: checkins.list || [],
			notes: notes.list || [],
			activities: Array.isArray(activity) ? activity : [],
			loadFailed: failed,
		});
	},
	_loadUnread() {
		if (!api.getToken()) return;
		api.get('/api/message/unread_count').then(res => {
			this.setData({ unreadCount: res || 0 });
		}).catch(() => {});
	},
	onPullDownRefresh() { this.loadData().then(() => wx.stopPullDownRefresh()); },
	goSign() { wx.navigateTo({ url: '/pages/sign/sign' }); },
	goPartner() { wx.navigateTo({ url: '/pages/partner/partner' }); },
	goCheckinList() { wx.switchTab({ url: '/pages/checkin_list/checkin_list' }); },
	goCommunity() { wx.switchTab({ url: '/pages/community/community' }); },
	goMessages() { wx.navigateTo({ url: '/pages/messages/messages' }); },
	goCheckin(e) { const id = e.currentTarget.dataset.id; if (id) wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + id }); },
	goNote(e) { const id = e.currentTarget.dataset.id; if (id) wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id }); },
	goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
});
