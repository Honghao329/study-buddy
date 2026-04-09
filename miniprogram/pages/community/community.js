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
      { label: '最热', value: 'hot' },
    ],
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
      this.checkLikeStatus(list, notes.length - list.length);
      this.checkPartnerStatus(list, notes.length - list.length);
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  checkLikeStatus(noteList, startIndex) {
    if (!noteList || noteList.length === 0) return;
    if (!api.getToken()) return;
    const ids = noteList.map(n => n.id);
    api.post('/api/like/batch_status', { targetIds: ids, targetType: 'note' }).then(res => {
      if (!res) return;
      // res is expected to be an object like { id1: true, id2: false } or an array of liked IDs
      const notes = [...this.data.notes];
      let changed = false;
      if (Array.isArray(res)) {
        const likedSet = new Set(res);
        for (let i = startIndex; i < startIndex + noteList.length && i < notes.length; i++) {
          if (this._likedIds.has(notes[i].id) || this._unlikedIds.has(notes[i].id)) continue;
          const isLiked = likedSet.has(notes[i].id);
          if (notes[i].is_liked !== isLiked) {
            notes[i] = { ...notes[i], is_liked: isLiked };
            changed = true;
          }
        }
      } else if (typeof res === 'object') {
        for (let i = startIndex; i < startIndex + noteList.length && i < notes.length; i++) {
          if (this._likedIds.has(notes[i].id) || this._unlikedIds.has(notes[i].id)) continue;
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
    this._likedIds = new Set();
    this._unlikedIds = new Set();
    this.setData({
      sortIndex: idx,
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
    if (!api.getToken()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.index;
    api.post('/api/like/toggle', { targetId: id, targetType: 'note' }).then(res => {
      const nextIsLiked = typeof (res && res.isLiked) !== 'undefined' ? !!Number(res.isLiked) : !this.data.notes[idx].is_liked;
      const notes = [...this.data.notes];
      const note = { ...notes[idx] };
      const delta = nextIsLiked === note.is_liked ? 0 : (nextIsLiked ? 1 : -1);
      note.is_liked = nextIsLiked;
      note.like_cnt = Math.max(0, (note.like_cnt || 0) + delta);
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
    }).catch(() => {});
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/note_detail/note_detail?id=' + id });
  },

  goProfile(e) {
    const uid = e.currentTarget.dataset.uid;
    if (!uid) return;
    wx.navigateTo({ url: '/pages/user_profile/user_profile?id=' + uid });
  },

  checkPartnerStatus(noteList, startIndex) {
    if (!noteList || noteList.length === 0 || !api.getToken()) return;
    const userIds = [...new Set(noteList.map(n => n.user_id).filter(Boolean))];
    if (userIds.length === 0) return;
    api.post('/api/partner/batch_status', { userIds }).then(res => {
      if (!res || typeof res !== 'object') return;
      const notes = [...this.data.notes];
      let changed = false;
      for (let i = startIndex; i < startIndex + noteList.length && i < notes.length; i++) {
        const status = res[notes[i].user_id] || 'none';
        if (notes[i]._partnerStatus !== status) {
          notes[i] = { ...notes[i], _partnerStatus: status };
          changed = true;
        }
      }
      if (changed) this.setData({ notes });
    }).catch(() => {});
  },

  quickAddFriend(e) {
    if (!api.getToken()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    const uid = e.currentTarget.dataset.uid;
    const idx = e.currentTarget.dataset.index;
    const myInfo = wx.getStorageSync('userInfo') || {};
    if (Number(uid) === myInfo.id) { wx.showToast({ title: '不能添加自己', icon: 'none' }); return; }
    api.post('/api/partner/invite', { targetId: uid }).then(() => {
      wx.showToast({ title: '邀请已发送', icon: 'success' });
      // 更新本地状态
      const notes = [...this.data.notes];
      if (idx !== undefined && notes[idx]) {
        notes[idx] = { ...notes[idx], _partnerStatus: 'pending' };
        this.setData({ notes });
      }
    }).catch(() => {});
  }
});
