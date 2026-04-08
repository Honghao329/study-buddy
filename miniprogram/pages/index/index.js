const api = require('../../utils/api.js');
Page({
	data: {
		checkins: [], notes: [], news: [], isLogin: false,
		month: new Date().getMonth() + 1,
		day: new Date().getDate(),
	},
	onShow() {
		this.setData({ isLogin: !!api.getToken() });
		this.loadData();
	},
	async loadData() {
		const [checkins, notes, news] = await Promise.all([
			api.get('/api/checkin/list', { page: 1, size: 3 }).catch(() => ({ list: [] })),
			api.get('/api/note/public_list', { page: 1, size: 5, sort: 'hot' }).catch(() => ({ list: [] })),
			api.get('/api/news/list', { page: 1, size: 2 }).catch(() => ({ list: [] })),
		]);
		this.setData({
			checkins: checkins.list || [],
			notes: notes.list || [],
			news: news.list || [],
		});
	},
	onPullDownRefresh() { this.loadData().then(() => wx.stopPullDownRefresh()); },
	goSign() { wx.navigateTo({ url: '/pages/sign/sign' }); },
	goPartner() { wx.navigateTo({ url: '/pages/partner/partner' }); },
	goCheckinList() { wx.switchTab({ url: '/pages/checkin_list/checkin_list' }); },
	goCommunity() { wx.switchTab({ url: '/pages/community/community' }); },
	goCheckin(e) {
		const id = e.currentTarget.dataset.id;
		if (id) wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + id });
	},
	goNote(e) {
		const id = e.currentTarget.dataset.id;
		if (id) wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id });
	},
	goLogin() { wx.switchTab({ url: '/pages/my/my' }); },
})
