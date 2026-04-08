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
      { label: '推荐', value: 'hot' },
      { label: '最新', value: 'latest' },
      { label: '最热', value: 'hot' }
    ],
    activeSortTab: 0,
    sortIndex: 0
  },

  // Track liked note IDs locally across toggles
  _likedIds: new Set(),
  _unlikedIds: new Set(),

  onShow() {
    this.setData({ notes: [], page: 1, hasMore: true });
    this._likedIds = new Set();
    this._unlikedIds = new Set();
    this.loadNotes();
  },

  loadNotes() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    const { page, size, search, sort } = this.data;
    api.get('/api/note/public_list', { page, size, search, sort }).then(res => {
      const list = res.list || res.records || res || [];
      // Apply locally tracked like status to loaded notes
      const processedList = list.map(note => {
        if (this._likedIds.has(note.id)) {
          note.is_liked = true;
        } else if (this._unlikedIds.has(note.id)) {
          note.is_liked = false;
        }
        return note;
      });
      const notes = page === 1 ? processedList : this.data.notes.concat(processedList);
      this.setData({
        notes,
        loading: false,
        hasMore: list.length >= size
      });
      // Check like status for the newly loaded notes
      this.checkLikeStatus(list, notes.length - list.length);
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  checkLikeStatus(noteList, startIndex) {
    if (!noteList || noteList.length === 0) return;
    const ids = noteList.map(n => n.id);
    api.post('/api/like/batch_status', { targetIds: ids, targetType: 'note' }).then(res => {
      if (!res) return;
      // res is expected to be an object like { id1: true, id2: false } or an array of liked IDs
      const notes = [...this.data.notes];
      let changed = false;
      if (Array.isArray(res)) {
        const likedSet = new Set(res);
        for (let i = startIndex; i < startIndex + noteList.length && i < notes.length; i++) {
          const isLiked = likedSet.has(notes[i].id);
          if (notes[i].is_liked !== isLiked) {
            notes[i] = { ...notes[i], is_liked: isLiked };
            changed = true;
          }
        }
      } else if (typeof res === 'object') {
        for (let i = startIndex; i < startIndex + noteList.length && i < notes.length; i++) {
          const isLiked = !!res[notes[i].id];
          if (notes[i].is_liked !== isLiked) {
            notes[i] = { ...notes[i], is_liked: isLiked };
            changed = true;
          }
        }
      }
      if (changed) {
        this.setData({ notes });
      }
    }).catch(() => {
      // batch_status API not available, rely on local tracking
    });
  },

  onSortChange(e) {
    const idx = e.detail.index !== undefined ? e.detail.index : (e.currentTarget ? e.currentTarget.dataset.index : 0);
    this.setData({
      sortIndex: idx,
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
    this._likedIds = new Set();
    this._unlikedIds = new Set();
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
      note.like_cnt = (note.like_cnt || 0) + (note.is_liked ? 1 : -1);
      notes[idx] = note;
      this.setData({ notes });
      // Track locally so re-loads preserve state
      if (note.is_liked) {
        this._likedIds.add(id);
        this._unlikedIds.delete(id);
      } else {
        this._unlikedIds.add(id);
        this._likedIds.delete(id);
      }
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id });
  }
});
