const api = require('../../utils/api.js');

Page({
  data: {
    list: [],
    page: 1,
    size: 10,
    hasMore: true,
    loading: false,
    search: ''
  },

  onShow() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadList();
  },

  loadList() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    const { page, size, search } = this.data;
    api.get('/api/checkin/list', { page, size, search }).then(res => {
      const items = res.list || res.records || res || [];
      const list = page === 1 ? items : this.data.list.concat(items);
      this.setData({
        list,
        loading: false,
        hasMore: items.length >= size
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onSearchInput(e) {
    this.setData({ search: e.detail.value });
  },

  onSearch() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadList();
  },

  onClearSearch() {
    this.setData({ search: '', list: [], page: 1, hasMore: true });
    this.loadList();
  },

  onPullDownRefresh() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadList();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadList();
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + id });
  }
});
