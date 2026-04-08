const api = require('../../utils/api.js');

Page({
  data: {
    logged: false,
    userInfo: null,
    nickName: '',
    avatarUrl: '',
    stats: { noteCount: 0, signDays: 0, partnerCount: 0 }
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    this.checkLogin();
  },

  checkLogin() {
    const token = api.getToken();
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.setData({ logged: true, userInfo });
      this.loadStats();
    } else {
      this.setData({ logged: false, userInfo: null });
    }
  },

  loadStats() {
    api.get('/api/user/info').then(res => {
      if (res) {
        const userInfo = res;
        wx.setStorageSync('userInfo', userInfo);
        this.setData({
          userInfo,
          stats: {
            noteCount: res.noteCount || 0,
            signDays: res.signDays || 0,
            partnerCount: res.partnerCount || 0
          }
        });
      }
    }).catch(() => {});
  },

  onNickNameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  onAvatarInput(e) {
    this.setData({ avatarUrl: e.detail.value });
  },

  doLogin() {
    const { nickName, avatarUrl } = this.data;
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    const code = 'user_' + Date.now();
    api.post('/api/user/login', {
      code,
      nickName,
      avatarUrl: avatarUrl || '/images/default_avatar.png'
    }).then(res => {
      if (res && res.token) {
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('userInfo', res.userInfo || { nickName, avatarUrl });
        this.checkLogin();
        wx.showToast({ title: '登录成功', icon: 'success' });
      }
    });
  },

  goNotes() {
    wx.switchTab({ url: '/pages/note_list/note_list' });
  },

  goSign() {
    wx.navigateTo({ url: '/pages/sign/sign' });
  },

  goPartner() {
    wx.navigateTo({ url: '/pages/partner/partner' });
  },

  goFavorite() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/my_edit/my_edit' });
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin_login/admin_login' });
  },

  doLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            logged: false,
            userInfo: null,
            nickName: '',
            avatarUrl: '',
            stats: { noteCount: 0, signDays: 0, partnerCount: 0 }
          });
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  }
});
