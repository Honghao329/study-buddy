const api = require('../../utils/api.js');

Page({
	data: {
		userId: '',
		user: null,
		notes: [],
		page: 1,
		size: 10,
		hasMore: true,
		loading: false,
	},

	onLoad(options) {
		if (options.id) {
			this.setData({ userId: options.id });
			this.loadProfile(options.id);
			this.loadNotes(options.id);
		}
	},

	loadProfile(id) {
		api.get('/api/user/profile/' + id).then(res => {
			if (res) {
				this.setData({ user: res });
				wx.setNavigationBarTitle({ title: res.nickname || '用户主页' });
			}
		});
	},

	loadNotes(id) {
		if (this.data.loading || !this.data.hasMore) return;
		this.setData({ loading: true });
		const uid = id || this.data.userId;
		const { page, size } = this.data;
		api.get('/api/user/user_notes/' + uid, { page, size }).then(res => {
			const list = (res && res.list) || [];
			const notes = page === 1 ? list : this.data.notes.concat(list);
			this.setData({ notes, loading: false, hasMore: list.length >= size });
		}).catch(() => {
			this.setData({ loading: false });
		});
	},

	addFriend() {
		if (!api.getToken()) {
			wx.showToast({ title: '请先登录', icon: 'none' });
			return;
		}
		wx.showLoading({ title: '发送中' });
		api.post('/api/partner/invite', { targetId: this.data.userId }).then(() => {
			wx.hideLoading();
			wx.showToast({ title: '邀请已发送', icon: 'success' });
			this.setData({ 'user.partner_status': 'pending' });
		}).catch(() => {
			wx.hideLoading();
		});
	},

	goNoteDetail(e) {
		const id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id });
	},

	onReachBottom() {
		if (this.data.hasMore) {
			this.setData({ page: this.data.page + 1 });
			this.loadNotes();
		}
	},
});
