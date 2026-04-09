const api = require('../../utils/api.js');

Page({
	data: {
		id: '',
		detail: null,
		joining: false,
		records: [],
		recordTotal: 0,
		showCheckinForm: false,
		checkinContent: '',
		showInvite: false,
		partners: [],
		showComment: false,
		commentRecordId: null,
		commentText: '',
		commentScore: 5,
	},

	onLoad(options) {
		if (options.id) this.setData({ id: options.id });
	},

	onShow() {
		if (this.data.id) {
			this.loadDetail(this.data.id);
			this.loadRecords();
		}
	},

	loadDetail(id) {
		api.get('/api/checkin/detail/' + id).then(res => {
			this.setData({ detail: res });
		}).catch(() => {});
	},

	loadRecords() {
		api.get('/api/checkin/records/' + this.data.id, { page: 1, size: 50 }).then(res => {
			this.setData({ records: res.list || [], recordTotal: res.total || 0 });
		}).catch(() => {});
	},

	// === 打卡 ===
	openCheckinForm() {
		if (!api.getToken()) {
			wx.showToast({ title: '请先登录', icon: 'none' });
			return;
		}
		this.setData({ showCheckinForm: true, checkinContent: '' });
	},

	closeCheckinForm() { this.setData({ showCheckinForm: false }); },

	onCheckinContentInput(e) { this.setData({ checkinContent: e.detail.value }); },

	onJoin() {
		if (this.data.joining) return;
		this.setData({ joining: true });
		api.post('/api/checkin/join', {
			checkinId: this.data.id,
			content: this.data.checkinContent.trim(),
		}).then(() => {
			wx.showToast({ title: '打卡成功', icon: 'success' });
			this.setData({ joining: false, showCheckinForm: false });
			this.loadDetail(this.data.id);
			this.loadRecords();
		}).catch(() => { this.setData({ joining: false }); });
	},

	// === 邀请监督 ===
	openInvite() {
		const userId = (wx.getStorageSync('userInfo') || {}).id;
		api.get('/api/partner/my_list').then(res => {
			const list = Array.isArray(res) ? res : [];
			const partners = list.map(item => {
				const isMe = Number(item.user_id) === Number(userId);
				return {
					id: isMe ? item.target_id : item.user_id,
					name: isMe ? (item.target_name || '伙伴') : (item.user_name || '伙伴'),
				};
			});
			this.setData({ partners, showInvite: true });
		});
	},

	closeInvite() { this.setData({ showInvite: false }); },
	goPartner() { this.setData({ showInvite: false }); wx.navigateTo({ url: '/pages/partner/partner' }); },

	selectSupervisor(e) {
		const partnerId = e.currentTarget.dataset.id;
		api.post('/api/checkin/invite_supervisor', {
			checkinId: this.data.id,
			supervisorId: partnerId
		}).then(() => {
			wx.showToast({ title: '邀请成功', icon: 'success' });
			this.setData({ showInvite: false });
			this.loadDetail(this.data.id);
		});
	},

	// === 催打卡 ===
	remindCheckin() {
		const d = this.data.detail;
		if (!d || !d.recent_users || d.recent_users.length === 0) {
			wx.showToast({ title: '暂无参与者', icon: 'none' });
			return;
		}
		// 提醒最近参与的用户
		const users = d.recent_users;
		let sent = 0;
		const promises = users.filter(u => u.user_id).map(u => {
			return api.post('/api/message/remind', {
				checkinId: this.data.id,
				targetUserId: u.user_id,
			}).then(() => { sent++; }).catch(() => {});
		});
		Promise.all(promises).then(() => {
			wx.showToast({ title: '已提醒' + (sent || users.length) + '人', icon: 'success' });
		});
	},

	// === 监督评价 ===
	openComment(e) {
		this.setData({
			showComment: true,
			commentRecordId: e.currentTarget.dataset.id,
			commentText: '',
			commentScore: 5,
		});
	},

	closeComment() { this.setData({ showComment: false }); },

	onCommentInput(e) { this.setData({ commentText: e.detail.value }); },

	onScoreChange(e) { this.setData({ commentScore: e.detail }); },

	submitComment() {
		if (!this.data.commentText.trim()) {
			wx.showToast({ title: '请填写评语', icon: 'none' });
			return;
		}
		api.post('/api/checkin/comment_record', {
			recordId: this.data.commentRecordId,
			comment: this.data.commentText,
			score: this.data.commentScore,
		}).then(() => {
			wx.showToast({ title: '评价成功', icon: 'success' });
			this.setData({ showComment: false });
			this.loadRecords();
		});
	},

	onPullDownRefresh() {
		this.loadDetail(this.data.id);
		this.loadRecords();
		wx.stopPullDownRefresh();
	},

	onShareAppMessage() {
		const d = this.data.detail;
		return { title: d ? d.title : '打卡任务', path: '/pages/checkin_detail/checkin_detail?id=' + this.data.id };
	}
});
