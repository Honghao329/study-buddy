const api = require('../../utils/api.js');

Page({
	data: {
		isLogin: false,
		nickname: '',
		avatar: '',
		statusBarH: 20,
		unreadCount: 0,
		activeTab: 0,
		// 签到
		signStats: { streak: 0, totalDays: 0, totalDuration: 0, todaySigned: false },
		// 打卡任务
		todayTasks: [],
		todayDone: 0,
		// 内容
		activities: [],
		notes: [],
		// 签到弹窗
		showSign: false,
		signDuration: '',
		signStatus: 1,
		signContent: '',
		signing: false,
	},

	onLoad() {
		const sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
		this.setData({ statusBarH: sysInfo.statusBarHeight || 20 });
	},

	onShow() {
		const isLogin = !!api.getToken();
		const userInfo = wx.getStorageSync('userInfo');
		this.setData({
			isLogin,
			nickname: (userInfo && userInfo.nickname) || '同学',
			avatar: (userInfo && (userInfo.avatar || userInfo.avatarUrl)) || '',
		});
		if (isLogin) this.loadAll();
	},

	async loadAll() {
		const [signRes, checkinsRes, notesRes, activityRes] = await Promise.all([
			api.get('/api/sign/stats').catch(() => ({})),
			api.get('/api/checkin/list', { page: 1, size: 10 }).catch(() => ({ list: [] })),
			api.get('/api/note/public_list', { page: 1, size: 10, sort: 'hot' }).catch(() => ({ list: [] })),
			api.get('/api/home/activity').catch(() => []),
		]);

		const signStats = {
			streak: signRes.streak || 0,
			totalDays: signRes.totalDays || 0,
			totalDuration: signRes.totalDuration || 0,
			todaySigned: !!signRes.todaySigned,
		};

		const tasks = checkinsRes.list || [];
		let joinedIds = [];
		if (tasks.length > 0) {
			try {
				const res = await api.get('/api/checkin/today_done_ids');
				joinedIds = res || [];
			} catch (e) {}
		}
		const todayTasks = tasks.map(t => ({ ...t, _joined: joinedIds.includes(t.id) }));
		const todayDone = todayTasks.filter(t => t._joined).length;

		this.setData({
			signStats, todayTasks, todayDone,
			notes: notesRes.list || [],
			activities: Array.isArray(activityRes) ? activityRes : [],
		});
		this._loadUnread();
	},

	_loadUnread() {
		api.get('/api/message/unread_count').then(res => {
			this.setData({ unreadCount: res || 0 });
		}).catch(() => {});
	},

	onPullDownRefresh() {
		this.loadAll().then(() => wx.stopPullDownRefresh());
	},

	onTabChange(e) { this.setData({ activeTab: e.detail.index }); },

	// ===== 签到 =====
	onMainCTA() {
		if (this.data.signStats.todaySigned) {
			wx.navigateTo({ url: '/pages/sign/sign' });
		} else {
			this.setData({ showSign: true });
		}
	},
	closeSign() { this.setData({ showSign: false }); },
	onSignDuration(e) { this.setData({ signDuration: e.detail.value }); },
	setSignStatus(e) { this.setData({ signStatus: Number(e.currentTarget.dataset.idx) }); },
	onSignContent(e) { this.setData({ signContent: e.detail.value }); },

	async doSign() {
		this.setData({ signing: true });
		const statuses = ['高效', '一般', '疲惫'];
		try {
			await api.post('/api/sign/do', {
				duration: parseInt(this.data.signDuration) || 0,
				status: statuses[this.data.signStatus] || '一般',
				content: this.data.signContent,
			});
			wx.showToast({ title: '记录成功！', icon: 'success' });
			this.setData({ showSign: false, signDuration: '', signStatus: 1, signContent: '' });
			this.loadAll();
		} catch (e) {
			wx.showToast({ title: e.msg || '签到失败', icon: 'none' });
		}
		this.setData({ signing: false });
	},

	// ===== 导航 =====
	goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
	goMy() { wx.switchTab({ url: '/pages/my/my' }); },
	goMessages() { wx.navigateTo({ url: '/pages/messages/messages' }); },
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
});
