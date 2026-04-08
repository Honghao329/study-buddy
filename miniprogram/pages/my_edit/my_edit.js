const api = require('../../utils/api.js');

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    nickname: user.nickname || user.nickName || '',
    nickName: user.nickName || user.nickname || '',
    avatar: user.avatar || user.avatarUrl || '',
    avatarUrl: user.avatarUrl || user.avatar || '',
  };
}

Page({
  data: {
    nickName: '',
    bio: '',
    mobile: ''
  },

  onLoad() {
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
      return;
    }
    this.loadUserInfo();
  },

  loadUserInfo() {
    wx.showLoading({ title: '加载中' });
    api.get('/api/user/info').then(res => {
      wx.hideLoading();
      if (res) {
        const user = normalizeUser(res);
        this.setData({
          nickName: user.nickName || '',
          bio: user.bio || '',
          mobile: user.mobile || ''
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
    api.put('/api/user/update', {
      nickname: nickName,
      bio,
      mobile
    }).then(() => {
      wx.hideLoading();
      const userInfo = normalizeUser(wx.getStorageSync('userInfo') || {});
      userInfo.nickname = nickName;
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
