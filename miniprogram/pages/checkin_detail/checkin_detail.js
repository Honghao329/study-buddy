const api = require('../../utils/api.js');

Page({
  data: {
    id: '',
    detail: null,
    joining: false,
    joined: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetail(options.id);
    }
  },

  loadDetail(id) {
    wx.showLoading({ title: '加载中' });
    api.get('/api/checkin/detail/' + id).then(res => {
      wx.hideLoading();
      this.setData({
        detail: res,
        joined: res.is_joined || false
      });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  onJoin() {
    if (this.data.joining || this.data.joined) return;
    this.setData({ joining: true });
    api.post('/api/checkin/join', { checkinId: this.data.id }).then(() => {
      wx.showToast({ title: '参与成功', icon: 'success' });
      this.setData({ joining: false, joined: true });
      // Update join count locally
      if (this.data.detail) {
        const detail = { ...this.data.detail };
        detail.join_cnt = (detail.join_cnt || detail.join_count || 0) + 1;
        this.setData({ detail });
      }
    }).catch(() => {
      this.setData({ joining: false });
    });
  },

  onShareAppMessage() {
    const d = this.data.detail;
    return {
      title: d ? d.title : '打卡任务',
      path: '/pages/checkin_detail/checkin_detail?id=' + this.data.id
    };
  }
});
