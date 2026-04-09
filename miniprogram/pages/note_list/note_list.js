const api = require('../../utils/api.js');

Page({
  data: {
    notes: [],
    page: 1,
    size: 10,
    hasMore: true,
    loading: false,
    search: '',
    visibility: '',
    tabs: [
      { label: '全部', value: '' },
      { label: '公开', value: 'public' },
      { label: '私密', value: 'private' },
      { label: '伙伴可见', value: 'partner' }
    ],
    activeTab: 0
  },

  onShow() {
    if (!api.getToken()) {
      api.requireLogin();
      return;
    }
    this.setData({ notes: [], page: 1, hasMore: true });
    this.loadNotes();
  },

  loadNotes() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    const { page, size, search, visibility } = this.data;
    api.get('/api/note/my_list', { page, size, search, visibility }).then(res => {
      const list = res.list || res.records || res || [];
      const notes = page === 1 ? list : this.data.notes.concat(list);
      this.setData({
        notes,
        loading: false,
        hasMore: list.length >= size
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onTabChange(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({
      activeTab: idx,
      visibility: this.data.tabs[idx].value,
      notes: [],
      page: 1,
      hasMore: true
    });
    this.loadNotes();
  },

  onSearchInput(e) {
    this.setData({ search: e.detail.value });
  },

  onSearch() {
    this.setData({ notes: [], page: 1, hasMore: true });
    this.loadNotes();
  },

  onClearSearch() {
    this.setData({ search: '', notes: [], page: 1, hasMore: true });
    this.loadNotes();
  },

  onPullDownRefresh() {
    this.setData({ notes: [], page: 1, hasMore: true });
    this.loadNotes();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadNotes();
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/note_add/note_add' });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/note_add/note_add?id=' + id });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定删除该笔记吗？',
      success: (res) => {
        if (res.confirm) {
          api.del('/api/note/delete/' + id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.setData({ notes: [], page: 1, hasMore: true });
            this.loadNotes();
          });
        }
      }
    });
  },

  getVisibilityText(v) {
    const map = { public: '公开', private: '私密', partner: '伙伴可见' };
    return map[v] || '公开';
  }
});
