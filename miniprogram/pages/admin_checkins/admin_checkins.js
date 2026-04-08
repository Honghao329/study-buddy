const api = require('../../utils/api.js');
const { normalizeAdminCheckinRow } = require('../../utils/normalizers');

Page({
  data: {
    list: [],
    loading: false,
    // Add modal
    showModal: false,
    newTitle: '',
    newDesc: ''
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    this.loadList();
  },

	loadList() {
		this.setData({ loading: true });
		api.adminGet('/api/admin/checkin_list').then(res => {
			const list = (Array.isArray(res) ? res : (res && res.list ? res.list : [])).map(normalizeAdminCheckinRow);
			this.setData({ list, loading: false });
		}).catch(() => {
			this.setData({ loading: false });
    });
  },

  openAddModal() {
    this.setData({ showModal: true, newTitle: '', newDesc: '' });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  onTitleInput(e) {
    this.setData({ newTitle: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ newDesc: e.detail.value });
  },

  doAdd() {
    const { newTitle, newDesc } = this.data;
    if (!newTitle) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '创建中' });
    api.adminPost('/api/admin/checkin_create', {
      title: newTitle,
      description: newDesc
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ showModal: false });
      this.loadList();
    }).catch(() => {
      wx.hideLoading();
    });
  },

  deleteCheckin(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定删除该打卡活动？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          api.adminDel('/api/admin/checkin_del/' + id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadList();
          });
        }
      }
    });
  }
});
