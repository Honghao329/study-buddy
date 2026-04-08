const api = require('../../utils/api.js');

Page({
	data: {
		id: '',
		detail: null,
		joining: false,
		records: [],
		recordPage: 1,
		recordTotal: 0,
		// 邀请监督
		showInvite: false,
		partners: [],
		// 评价弹窗
		showComment: false,
		commentRecordId: null,
		commentText: '',
		commentScore: 5,
	},

	onLoad(options) {
		if (options.id) {
			this.setData({ id: options.id });
		}
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

	// 打卡
	onJoin() {
		if (this.data.joining || (this.data.detail && this.data.detail.is_joined)) return;
		this.setData({ joining: true });
		api.post('/api/checkin/join', { checkinId: this.data.id }).then(() => {
			wx.showToast({ title: '打卡成功', icon: 'success' });
			this.loadDetail(this.data.id);
			this.loadRecords();
			this.setData({ joining: false });
		}).catch(() => {
			this.setData({ joining: false });
		});
	},

	// 邀请监督者
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

	closeInvite() {
		this.setData({ showInvite: false });
	},

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

	// 监督者评价
	openComment(e) {
		this.setData({
			showComment: true,
			commentRecordId: e.currentTarget.dataset.id,
			commentText: '',
			commentScore: 5,
		});
	},

	closeComment() {
		this.setData({ showComment: false });
	},

	onCommentInput(e) {
		this.setData({ commentText: e.detail.value });
	},

	onScoreChange(e) {
		this.setData({ commentScore: e.detail });
	},

	submitComment() {
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
