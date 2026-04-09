const api = require('../../utils/api.js');

Page({
  data: {
    nickName: '', bio: '', mobile: '', tagsStr: '', avatarUrl: '',
    oldPassword: '', newPassword: '',
  },

  onLoad() {
    if (!api.getToken()) {
      api.requireLogin();
      return;
    }
    this.loadUserInfo();
  },

  loadUserInfo() {
    wx.showLoading({ title: '加载中' });
    api.get('/api/user/info').then(res => {
      wx.hideLoading();
      if (res) {
        this.setData({
          nickName: res.nickname || res.nickName || '',
          bio: res.bio || '',
          mobile: res.mobile || '',
          tagsStr: (res.tags || []).join(', '),
          avatarUrl: res.avatar || res.avatarUrl || '',
        });
      }
    }).catch(() => { wx.hideLoading(); });
  },

  onNickNameInput(e) { this.setData({ nickName: e.detail.value }); },
  onBioInput(e) { this.setData({ bio: e.detail.value }); },
  onMobileInput(e) { this.setData({ mobile: e.detail.value }); },
  onTagsInput(e) { this.setData({ tagsStr: e.detail.value }); },
  onOldPwdInput(e) { this.setData({ oldPassword: e.detail.value }); },
  onNewPwdInput(e) { this.setData({ newPassword: e.detail.value }); },

  onPickAvatar() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中' });
        api.uploadImage(path).then(url => {
          wx.hideLoading();
          this.setData({ avatarUrl: url });
        }).catch(() => { wx.hideLoading(); });
      }
    });
  },

  doSave() {
    const { nickName, bio, mobile, tagsStr, avatarUrl } = this.data;
    if (!nickName) { wx.showToast({ title: '昵称不能为空', icon: 'none' }); return; }
    const tags = tagsStr ? tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean).slice(0, 5) : [];
    wx.showLoading({ title: '保存中' });
    api.put('/api/user/update', { nickname: nickName, bio, mobile, tags, avatar: avatarUrl }).then(() => {
      wx.hideLoading();
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.nickname = nickName; userInfo.nickName = nickName;
      userInfo.bio = bio; userInfo.mobile = mobile;
      userInfo.tags = tags; userInfo.avatar = avatarUrl; userInfo.avatarUrl = avatarUrl;
      wx.setStorageSync('userInfo', userInfo);
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    }).catch(() => { wx.hideLoading(); });
  },

  doChangePwd() {
    const { oldPassword, newPassword } = this.data;
    if (!oldPassword) { wx.showToast({ title: '请输入旧密码', icon: 'none' }); return; }
    if (!newPassword || newPassword.length < 4) { wx.showToast({ title: '新密码至少4位', icon: 'none' }); return; }
    api.post('/api/user/change_password', { oldPassword, newPassword }).then(() => {
      wx.showToast({ title: '密码修改成功', icon: 'success' });
      this.setData({ oldPassword: '', newPassword: '' });
    }).catch(() => {});
  },
});
