const api = require('../../utils/api.js');
const { normalizeFavoriteRow } = require('../../utils/normalizers');

Page({
  data: {
    list: [],
    loading: false
  },

  onShow() {
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 1000);
      return;
    }
    this.loadFavorites();
  },

	loadFavorites() {
		this.setData({ loading: true });
		api.get('/api/fav/my_list').then(res => {
			const list = (res.list || res.records || res || []).map(normalizeFavoriteRow);
			this.setData({ list, loading: false });
		}).catch(() => {
			this.setData({ loading: false });
		});
	},

	onTapItem(e) {
		const index = Number(e.currentTarget.dataset.index);
		const item = this.data.list[index];
		if (!item) return;
		const targetType = item.targetType || item.target_type;
		const targetId = item.targetId || item.target_id;
		if (targetType === 'note') wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + targetId });
	},

	onDeleteItem(e) {
		const index = Number(e.currentTarget.dataset.index);
		const item = this.data.list[index];
		if (!item) return;
		wx.showModal({
			title: '提示',
			content: '确定取消收藏吗？',
			success: (res) => {
				if (res.confirm) {
					const targetId = item.targetId || item.target_id;
					const targetType = item.targetType || item.target_type;
					api.post('/api/fav/toggle', {
						targetId,
						targetType,
						title: item.title
					}).then(() => {
						wx.showToast({ title: '已取消收藏', icon: 'success' });
						const list = this.data.list.filter((_, i) => i !== index);
						this.setData({ list });
					});
				}
      }
    });
  },

	onPullDownRefresh() {
		this.loadFavorites();
		wx.stopPullDownRefresh();
	}
});
