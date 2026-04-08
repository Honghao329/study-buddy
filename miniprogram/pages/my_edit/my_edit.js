const api = require('../../utils/api.js');

Page({
  data: {
    nickName: '',
    bio: '',
    mobile: ''
  },

  onLoad() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    wx.showLoading({ title: '加载中' });
    api.get('/api/user/info').then(res => {
      wx.hideLoading();
      if (res) {
        this.setData({
          nickName: res.nickName || '',
          bio: res.bio || '',
          mobile: res.mobile || ''
        });
      }
    }).catch(() => {
      wx.hideLoading();
    });
  },

  onNickNameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  onBioInput(e) {
    this.setData({ bio: e.detail.value });
  },

  onMobileInput(e) {
    this.setData({ mobile: e.detail.value });
  },

  doSave() {
    const { nickName, bio, mobile } = this.data;
    if (!nickName) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中' });
    api.put('/api/user/update', { nickName, bio, mobile }).then(() => {
      wx.hideLoading();
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.nickName = nickName;
      userInfo.bio = bio;
      userInfo.mobile = mobile;
      wx.setStorageSync('userInfo', userInfo);
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }).catch(() => {
      wx.hideLoading();
    });
  }
});
