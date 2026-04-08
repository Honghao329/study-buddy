const api = require('../../utils/api.js');

Page({
  data: {
    stats: {
      userCount: 0,
      noteCount: 0,
      signCount: 0,
      checkinCount: 0
    }
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    api.adminGet('/api/admin/stats').then(res => {
      if (res) {
        this.setData({
          stats: {
            userCount: res.userCount || 0,
            noteCount: res.noteCount || 0,
            signCount: res.signCount || 0,
            checkinCount: res.checkinCount || 0
          }
        });
      }
    }).catch(() => {});
  },

  goUsers() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goNotes() {
    wx.navigateTo({ url: '/pages/admin_notes/admin_notes' });
  },

  goCheckins() {
    wx.navigateTo({ url: '/pages/admin_checkins/admin_checkins' });
  },

  doLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出后台管理？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('admin_token');
          wx.navigateBack();
        }
      }
    });
  }
});
