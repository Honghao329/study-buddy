const api = require('../../utils/api.js');

Page({
	data: {
		stats: { streak: 0, totalDays: 0, totalDuration: 0, todaySigned: 0 },
		year: 0, month: 0,
		days: [], monthSignCount: 0,
		weekDays: ['日', '一', '二', '三', '四', '五', '六'],
		signedDaySet: {},
		showModal: false,
		duration: '', statusIndex: 1,
		statusValues: ['efficient', 'normal', 'tired'],
		content: '',
		rankList: [],
	},

	onShow() {
		if (!api.getToken()) {
			wx.showToast({ title: '请先登录', icon: 'none' });
			setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
			return;
		}
		if (!this.data.year) {
			const now = new Date();
			this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 });
		}
		this.loadAll();
	},

	onPullDownRefresh() { this.loadAll(); wx.stopPullDownRefresh(); },

	loadAll() { this.loadStats(); this.loadCalendar(); this.loadRank(); },

	loadStats() {
		api.get('/api/sign/stats').then(res => {
			if (res) this.setData({ stats: res });
		}).catch(() => {});
	},

	loadCalendar() {
		const { year, month } = this.data;
		api.get('/api/sign/calendar', { year, month }).then(res => {
			const list = Array.isArray(res) ? res : [];
			const signedDaySet = {};
			list.forEach(item => {
				const dayNum = parseInt(item.day.split('-')[2]);
				signedDaySet[dayNum] = true;
			});
			this.setData({ signedDaySet, monthSignCount: list.length });
			this._buildCalendar();
		}).catch(() => { this._buildCalendar(); });
	},

	_buildCalendar() {
		const { year, month, signedDaySet } = this.data;
		const firstDay = new Date(year, month - 1, 1).getDay();
		const totalDaysInMonth = new Date(year, month, 0).getDate();
		const today = new Date();
		const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
		const days = [];
		for (let i = 0; i < firstDay; i++) days.push({ day: '', empty: true });
		for (let d = 1; d <= totalDaysInMonth; d++) {
			days.push({ day: d, signed: !!signedDaySet[d], isToday: isCurrentMonth && today.getDate() === d, empty: false });
		}
		this.setData({ days });
	},

	prevMonth() {
		let { year, month } = this.data;
		month--; if (month < 1) { month = 12; year--; }
		this.setData({ year, month }); this.loadCalendar();
	},

	nextMonth() {
		let { year, month } = this.data;
		month++; if (month > 12) { month = 1; year++; }
		this.setData({ year, month }); this.loadCalendar();
	},

	openSignModal() {
		if (this.data.stats.todaySigned) { wx.showToast({ title: '今日已签到', icon: 'none' }); return; }
		this.setData({ showModal: true, duration: '', statusIndex: 1, content: '' });
	},

	closeModal() { this.setData({ showModal: false }); },
	onDurationInput(e) { this.setData({ duration: e.detail.value }); },
	setStatus(e) { this.setData({ statusIndex: Number(e.currentTarget.dataset.idx) }); },
	onContentInput(e) { this.setData({ content: e.detail.value }); },

	doSign() {
		const { duration, statusIndex, statusValues, content } = this.data;
		api.post('/api/sign/do', {
			duration: parseInt(duration) || 0,
			status: statusValues[statusIndex],
			content
		}).then(() => {
			wx.showToast({ title: '签到成功', icon: 'success' });
			this.setData({ showModal: false });
			this.loadAll();
		}).catch(() => {});
	},

	loadRank() {
		api.get('/api/sign/rank').then(res => {
			this.setData({ rankList: Array.isArray(res) ? res.slice(0, 20) : [] });
		}).catch(() => {});
	},
});
