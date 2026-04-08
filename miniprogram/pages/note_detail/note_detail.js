const api = require('../../utils/api.js');

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
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 1000);
      return;
    }
    if (options.id) {
      this.setData({ id: options.id });
      this.loadNote(options.id);
      this.loadComments();
    }
  },

  loadNote(id) {
    wx.showLoading({ title: '加载中' });
    api.get('/api/note/detail/' + id).then(res => {
      wx.hideLoading();
      this.setData({
        note: res,
        isLiked: res.is_liked || false,
        isFaved: res.is_faved || false
      });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  loadComments() {
    if (this.data.loadingComments || !this.data.hasMoreComments) return;
    this.setData({ loadingComments: true });
    const { id, commentPage, commentSize } = this.data;
    api.get('/api/comment/list', { noteId: id, page: commentPage, size: commentSize }).then(res => {
      const list = res.list || res.records || res || [];
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
      this.setData({ commentPage: this.data.commentPage + 1 });
      this.loadComments();
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  sendComment() {
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
      this.loadComments();
      // Update comment count locally
      if (this.data.note) {
        const note = { ...this.data.note };
        note.comment_cnt = (note.comment_cnt || 0) + 1;
        this.setData({ note });
      }
    });
  },

  toggleLike() {
    api.post('/api/like/toggle', { targetId: this.data.id, targetType: 'note' }).then(res => {
      const isLiked = !this.data.isLiked;
      const note = { ...this.data.note };
      note.like_cnt = (note.like_cnt || 0) + (isLiked ? 1 : -1);
      this.setData({ isLiked, note });
    });
  },

  toggleFav() {
    api.post('/api/fav/toggle', { targetId: this.data.id, targetType: 'note' }).then(res => {
      const isFaved = !this.data.isFaved;
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
