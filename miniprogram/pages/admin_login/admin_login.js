const api = require('../../utils/api.js');

Page({
  data: {
    username: '',
    password: ''
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  doLogin() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '登录中' });
    api.post('/api/admin/login', { username, password }).then(res => {
      wx.hideLoading();
      if (res && res.token) {
        wx.setStorageSync('admin_token', res.token);
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/admin_home/admin_home' });
        }, 1000);
      }
    }).catch(() => {
      wx.hideLoading();
    });
  }
});
