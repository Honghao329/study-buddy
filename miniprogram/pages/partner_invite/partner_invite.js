const api = require('../../utils/api.js');

Page({
  data: {
    search: '',
    userList: [],
    loading: false,
  },

  onShow() {
    if (!api.getToken()) {
      api.requireLogin();
      return;
    }
  },

  onSearchInput(e) {
    this.setData({ search: e.detail.value || e.detail });
  },

  onSearch() {
    this.loadUsers();
  },

  onClearSearch() {
    this.setData({ search: '', userList: [] });
  },

  loadUsers() {
    const search = this.data.search.trim();
    if (!search) return;
    this.setData({ loading: true });
    api.get('/api/user/list', { search, size: 20 }).then(res => {
      const list = (res && res.list) || [];
      this.setData({ userList: list, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  doInvite(e) {
    const targetId = e.currentTarget.dataset.id;
    const myInfo = wx.getStorageSync('userInfo') || {};
    if (Number(targetId) === myInfo.id) {
      wx.showToast({ title: '不能邀请自己', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发送中' });
    api.post('/api/partner/invite', { targetId }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '邀请已发送', icon: 'success' });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  onAvatarError(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ [`userList[${idx}].avatar`]: '' });
  },
  goProfile(e) {
    const uid = e.currentTarget.dataset.uid;
    if (uid) wx.navigateTo({ url: '/pages/user_profile/user_profile?id=' + uid });
  },
});
