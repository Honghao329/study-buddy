const api = require('../../utils/api.js');
const { normalizePartnerRow } = require('../../utils/normalizers');

Page({
  data: {
    activeTab: 0,
    myList: [],
    pendingList: [],
    // discover tab
    userList: [],
    userSearch: '',
    userPage: 1,
    hasMoreUsers: true,
    loadingUsers: false,
  },

  onLoad(options) {
    if (options.tab !== undefined) {
      this.setData({ activeTab: Number(options.tab) });
    }
  },

  onShow() {
    if (!api.getToken()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadMyList();
    this.loadPendingList();
  },

  switchTab(e) {
    const tab = Number(e.currentTarget.dataset.tab);
    this.setData({ activeTab: Number.isFinite(tab) ? tab : 0 });
    if (tab === 2 && this.data.userList.length === 0) {
      this.loadUserList();
    }
  },

  loadMyList() {
    const currentUserId = (wx.getStorageSync('userInfo') || {}).id;
    api.get('/api/partner/my_list').then(res => {
      const myList = (Array.isArray(res) ? res : []).map(item => normalizePartnerRow(item, currentUserId));
      this.setData({ myList });
    }).catch(() => {});
  },

  loadPendingList() {
    const currentUserId = (wx.getStorageSync('userInfo') || {}).id;
    api.get('/api/partner/pending_list').then(res => {
      const pendingList = (Array.isArray(res) ? res : []).map(item => normalizePartnerRow(item, currentUserId));
      this.setData({ pendingList });
    }).catch(() => {});
  },

  loadUserList() {
    if (this.data.loadingUsers || !this.data.hasMoreUsers) return;
    this.setData({ loadingUsers: true });
    const { userPage, userSearch } = this.data;
    api.get('/api/user/list', { page: userPage, size: 20, search: userSearch }).then(res => {
      const list = (res && res.list) || [];
      const userList = userPage === 1 ? list : this.data.userList.concat(list);
      this.setData({ userList, loadingUsers: false, hasMoreUsers: list.length >= 20 });
    }).catch(() => {
      this.setData({ loadingUsers: false });
    });
  },

  onUserSearchInput(e) {
    this.setData({ userSearch: e.detail.value || e.detail });
  },

  onUserSearch() {
    this.setData({ userList: [], userPage: 1, hasMoreUsers: true });
    this.loadUserList();
  },

  onClearUserSearch() {
    this.setData({ userSearch: '', userList: [], userPage: 1, hasMoreUsers: true });
    this.loadUserList();
  },

  inviteUser(e) {
    const id = e.currentTarget.dataset.id;
    const myInfo = wx.getStorageSync('userInfo') || {};
    if (Number(id) === myInfo.id) {
      wx.showToast({ title: '不能添加自己', icon: 'none' });
      return;
    }
    api.post('/api/partner/invite', { targetId: id }).then(() => {
      wx.showToast({ title: '邀请已发送', icon: 'success' });
    }).catch(() => {});
  },

  goProfile(e) {
    const uid = e.currentTarget.dataset.uid;
    if (uid) wx.navigateTo({ url: '/pages/user_profile/user_profile?id=' + uid });
  },

  dissolve(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定解除伙伴关系？',
      success: (res) => {
        if (res.confirm) {
          api.post('/api/partner/dissolve', { id }).then(() => {
            wx.showToast({ title: '已解除', icon: 'success' });
            this.loadMyList();
          });
        }
      }
    });
  },

  accept(e) {
    const id = e.currentTarget.dataset.id;
    api.post('/api/partner/accept', { id }).then(() => {
      wx.showToast({ title: '已接受', icon: 'success' });
      this.loadMyList();
      this.loadPendingList();
    });
  },

  reject(e) {
    const id = e.currentTarget.dataset.id;
    api.post('/api/partner/reject', { id }).then(() => {
      wx.showToast({ title: '已拒绝', icon: 'success' });
      this.loadPendingList();
    });
  },

  goCheckins() {
    wx.switchTab({ url: '/pages/checkin_list/checkin_list' });
  },

  onReachBottom() {
    if (this.data.activeTab === 2 && this.data.hasMoreUsers) {
      this.setData({ userPage: this.data.userPage + 1 });
      this.loadUserList();
    }
  },
});
