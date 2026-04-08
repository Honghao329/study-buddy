const api = require('../../utils/api.js');

Page({
  data: {
    targetId: ''
  },

  onTargetIdInput(e) {
    this.setData({ targetId: e.detail.value });
  },

  doInvite() {
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
