const api = require('../../utils/api.js');

Page({
  data: {
    notes: [],
    page: 1,
    size: 10,
    hasMore: true,
    loading: false,
    search: '',
    sort: 'latest',
    sortTabs: [
      { label: '最新', value: 'latest' },
      { label: '最热', value: 'hot' }
    ],
    activeSortTab: 0
  },

  onShow() {
    this.setData({ notes: [], page: 1, hasMore: true });
    this.loadNotes();
  },

  loadNotes() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    const { page, size, search, sort } = this.data;
    api.get('/api/note/public_list', { page, size, search, sort }).then(res => {
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

  onSortChange(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({
      activeSortTab: idx,
      sort: this.data.sortTabs[idx].value,
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

  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.index;
    api.post('/api/like/toggle', { targetId: id, targetType: 'note' }).then(() => {
      const notes = [...this.data.notes];
      const note = { ...notes[idx] };
      note.is_liked = !note.is_liked;
      note.like_count = (note.like_count || 0) + (note.is_liked ? 1 : -1);
      notes[idx] = note;
      this.setData({ notes });
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id });
  }
});
