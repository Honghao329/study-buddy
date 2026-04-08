const api = require('../../utils/api.js');

Page({
  data: {
    list: [],
    page: 1,
    size: 20,
    search: '',
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadList();
  },

  onSearchInput(e) {
    this.setData({ search: e.detail.value });
  },

  doSearch() {
    this.setData({ page: 1, list: [], hasMore: true });
    this.loadList();
  },

  loadList() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    const { page, size, search } = this.data;
    api.adminGet('/api/admin/note_list', { page, size, search }).then(res => {
      const newList = (res && res.list) ? res.list : (Array.isArray(res) ? res : []);
      const total = (res && res.total) ? res.total : newList.length;
      this.setData({
        list: this.data.list.concat(newList),
        loading: false,
        hasMore: this.data.list.length + newList.length < total
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  loadMore() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadList();
    }
  },

  onReachBottom() {
    this.loadMore();
  },

  deleteNote(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定删除该笔记？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          api.adminDel('/api/admin/note_del/' + id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.setData({ page: 1, list: [], hasMore: true });
            this.loadList();
          });
        }
      }
    });
  }
});
