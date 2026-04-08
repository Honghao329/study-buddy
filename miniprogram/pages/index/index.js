const api = require('../../utils/api.js');
Page({
	data: { checkins: [], notes: [], isLogin: false },
	onShow() {
		this.setData({ isLogin: !!api.getToken() });
		this.loadData();
	},
	async loadData() {
		const [checkins, notes] = await Promise.all([
			api.get('/api/checkin/list', { page: 1, size: 5 }).catch(() => ({ list: [] })),
			api.get('/api/note/public_list', { page: 1, size: 5 }).catch(() => ({ list: [] }))
		]);
		this.setData({
			checkins: checkins.list || [],
			notes: notes.list || []
		});
	},
	onPullDownRefresh() { this.loadData().then(() => wx.stopPullDownRefresh()); },
	goSign() { wx.navigateTo({ url: '/pages/sign/sign' }); },
	goPartner() { wx.navigateTo({ url: '/pages/partner/partner' }); },
	goCheckin(e) { wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + e.currentTarget.dataset.id }); },
	goNote(e) { wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + e.currentTarget.dataset.id }); },
	goLogin() { wx.switchTab({ url: '/pages/my/my' }); },
})
