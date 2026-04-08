const api = require('../../utils/api.js');

function normalizeNote(note) {
  if (!note) return null;
  return {
    ...note,
    author_name: note.author_name || note.user_name || '',
    author_avatar: note.author_avatar || note.user_pic || '',
  };
}

function normalizeComment(comment) {
  if (!comment) return null;
  return {
    ...comment,
    author_name: comment.author_name || comment.user_name || '',
    author_avatar: comment.author_avatar || comment.user_pic || '',
  };
}

function requireLogin() {
  if (api.getToken()) return true;
  wx.showToast({ title: '请先登录', icon: 'none' });
  return false;
}

Page({
  data: {
    id: '',
    note: null,
    comments: [],
    commentText: '',
    isLiked: false,
    isFaved: false,
    commentPage: 1,
    commentSize: 20,
    hasMoreComments: true,
    loadingComments: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadNote(options.id);
      this.loadComments(options.id);
    }
  },

  loadNote(id) {
    wx.showLoading({ title: '加载中' });
    api.get('/api/note/detail/' + id).then(res => {
      wx.hideLoading();
      const note = normalizeNote(res);
      this.setData({
        note,
        isLiked: !!(note && note.is_liked),
        isFaved: !!(note && note.is_faved)
      });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  loadComments(noteId = this.data.id) {
    if (this.data.loadingComments || !this.data.hasMoreComments) return;
    this.setData({ loadingComments: true });
    const { commentPage, commentSize } = this.data;
    api.get('/api/comment/list', { noteId, page: commentPage, size: commentSize }).then(res => {
      const list = (res.list || res.records || res || []).map(normalizeComment);
      const comments = commentPage === 1 ? list : this.data.comments.concat(list);
      this.setData({
        comments,
        loadingComments: false,
        hasMoreComments: list.length >= commentSize
      });
    }).catch(() => {
      this.setData({ loadingComments: false });
    });
  },

  onReachBottom() {
    if (this.data.hasMoreComments) {
      const nextPage = this.data.commentPage + 1;
      this.setData({ commentPage: nextPage });
      this.loadComments(this.data.id);
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  sendComment() {
    if (!requireLogin()) return;
    const content = this.data.commentText.trim();
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    api.post('/api/comment/create', { noteId: this.data.id, content }).then(() => {
      wx.showToast({ title: '评论成功', icon: 'success' });
      this.setData({
        commentText: '',
        comments: [],
        commentPage: 1,
        hasMoreComments: true
      });
      this.loadComments(this.data.id);
      // Update comment count locally
      if (this.data.note) {
        const note = { ...this.data.note };
        note.comment_cnt = (note.comment_cnt || 0) + 1;
        this.setData({ note });
      }
    });
  },

  toggleLike() {
    if (!requireLogin()) return;
    api.post('/api/like/toggle', { targetId: this.data.id, targetType: 'note' }).then(res => {
      const isLiked = typeof (res && res.isLiked) !== 'undefined' ? !!Number(res.isLiked) : !this.data.isLiked;
      const note = { ...this.data.note };
      if (note) {
        const delta = isLiked === this.data.isLiked ? 0 : (isLiked ? 1 : -1);
        note.like_cnt = Math.max(0, (note.like_cnt || 0) + delta);
      }
      this.setData({ isLiked, note });
    });
  },

  toggleFav() {
    if (!requireLogin()) return;
    api.post('/api/fav/toggle', {
      targetId: this.data.id,
      targetType: 'note',
      title: this.data.note ? this.data.note.title : ''
    }).then(res => {
      const isFaved = typeof (res && res.isFav) !== 'undefined' ? !!Number(res.isFav) : !this.data.isFaved;
      this.setData({ isFaved });
      wx.showToast({ title: isFaved ? '已收藏' : '已取消收藏', icon: 'none' });
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: this.data.note.images || [] });
  },

  getVisibilityText(v) {
    const map = { public: '公开', private: '私密', partner: '伙伴可见' };
    return map[v] || '公开';
  }
});
