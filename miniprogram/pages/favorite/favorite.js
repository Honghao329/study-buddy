const api = require('../../utils/api.js');
const { normalizeFavoriteRow } = require('../../utils/normalizers');

Page({
  data: { list: [], loading: false, loadFailed: false },

  onShow() {
    if (!api.getToken()) {
      api.requireLogin();
      return;
    }
    this.loadFavorites();
  },

  loadFavorites() {
    this.setData({ loading: true, loadFailed: false });
    api.get('/api/fav/my_list').then(res => {
      const list = (res.list || res.records || res || []).map(normalizeFavoriteRow);
      this.setData({ list, loading: false });
    }).catch(() => { this.setData({ loading: false, loadFailed: true }); });
  },

  onTapItem(e) {
    const item = this.data.list[Number(e.currentTarget.dataset.index)];
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
      title: '取消收藏',
      content: '确定取消收藏「' + (item.title || '') + '」吗？',
      success: (res) => {
        if (res.confirm) {
          api.post('/api/fav/toggle', {
            targetId: item.targetId || item.target_id,
            targetType: item.targetType || item.target_type,
            title: item.title
          }).then(() => {
            wx.showToast({ title: '已取消', icon: 'success' });
            this.setData({ list: this.data.list.filter((_, i) => i !== index) });
          });
        }
      }
    });
  },

  onPullDownRefresh() { this.loadFavorites(); wx.stopPullDownRefresh(); }
});
