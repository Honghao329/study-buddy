const api = require('../../utils/api.js');

Page({
  data: {
    list: [],
    loading: false
  },

  onShow() {
    this.loadFavorites();
  },

  loadFavorites() {
    this.setData({ loading: true });
    api.get('/api/fav/my_list').then(res => {
      const list = res.list || res.records || res || [];
      this.setData({ list, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onTapItem(e) {
    const item = e.currentTarget.dataset.item;
    if (item.target_type === 'note') {
      wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + item.target_id });
    }
  },

  onDeleteItem(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '提示',
      content: '确定取消收藏吗？',
      success: (res) => {
        if (res.confirm) {
          api.post('/api/fav/toggle', {
            targetId: item.target_id,
            targetType: item.target_type,
            title: item.title
          }).then(() => {
            wx.showToast({ title: '已取消收藏', icon: 'success' });
            const list = this.data.list.filter(i => i.id !== item.id);
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
