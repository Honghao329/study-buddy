const api = require('../../utils/api.js');

Page({
  data: {
    activeTab: 0,
    myList: [],
    pendingList: []
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    this.loadMyList();
    this.loadPendingList();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  loadMyList() {
    api.get('/api/partner/my_list').then(res => {
      this.setData({ myList: Array.isArray(res) ? res : [] });
    }).catch(() => {});
  },

  loadPendingList() {
    api.get('/api/partner/pending_list').then(res => {
      this.setData({ pendingList: Array.isArray(res) ? res : [] });
    }).catch(() => {});
  },

  goSpace(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '共享空间开发中', icon: 'none' });
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
      this.loadData();
    });
  },

  reject(e) {
    const id = e.currentTarget.dataset.id;
    api.post('/api/partner/reject', { id }).then(() => {
      wx.showToast({ title: '已拒绝', icon: 'success' });
      this.loadPendingList();
    });
  },

  goInvite() {
    wx.navigateTo({ url: '/pages/partner_invite/partner_invite' });
  }
});
