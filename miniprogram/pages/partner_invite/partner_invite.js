const api = require('../../utils/api.js');

Page({
  data: {
    targetId: ''
  },

  onShow() {
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 1000);
    }
  },

  onTargetIdInput(e) {
    this.setData({ targetId: e.detail.value });
  },

  doInvite() {
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 1000);
      return;
    }
    const { targetId } = this.data;
    if (!targetId) {
      wx.showToast({ title: '请输入用户ID', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发送中' });
    api.post('/api/partner/invite', { targetId }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '邀请已发送', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }).catch(() => {
      wx.hideLoading();
    });
  }
});
