const api = require('../../utils/api.js');

Page({
  data: {
    list: [],
    loading: true,
    myUserId: ''
  },

  onShow() {
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 1000);
      return;
    }
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ myUserId: userInfo.id || '' });
    this.loadList();
  },

  loadList() {
    this.setData({ loading: true });
    api.get('/api/plan/my_list').then(res => {
      const list = (Array.isArray(res) ? res : []).map(item => {
        const myUserId = this.data.myUserId;
        item.isExecutor = String(item.executor_id) === String(myUserId);
        item.roleLabel = item.isExecutor ? '我是执行者' : '我是监督者';
        item.frequencyLabel = item.frequency === 'daily' ? '每天' : item.frequency === 'weekly' ? '每周' : (item.frequency || '每天');
        return item;
      });
      this.setData({ list, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/plan_detail/plan_detail?id=' + id });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/plan_create/plan_create' });
  }
});
