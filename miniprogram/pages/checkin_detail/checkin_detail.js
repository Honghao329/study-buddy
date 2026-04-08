const api = require('../../utils/api.js');

Page({
  data: {
    id: '',
    detail: null,
    joining: false
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
      this.setData({ detail: res });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  onJoin() {
    if (this.data.joining || (this.data.detail && this.data.detail.is_joined)) return;
    this.setData({ joining: true });
    api.post('/api/checkin/join', { checkinId: this.data.id }).then(() => {
      wx.showToast({ title: '打卡成功', icon: 'success' });
      const detail = { ...this.data.detail };
      detail.is_joined = true;
      detail.my_total = (detail.my_total || 0) + 1;
      detail.join_cnt = (detail.join_cnt || 0) + 1;
      this.setData({ detail, joining: false });
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
