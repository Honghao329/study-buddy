const api = require('../../utils/api.js');

Page({
  data: {
    title: '',
    description: '',
    frequency: '每天',
    frequencyOptions: ['每天', '每周', '自定义'],
    showFreqPicker: false,
    category: '学习',
    categoryOptions: ['学习', '运动', '阅读', '任意'],
    showCatPicker: false,
    partners: [],
    partnerId: '',
    selectedPartnerName: '',
    iAmExecutor: true,
    reward: '',
    remindTime: '',
    showTimePicker: false,
    currentTime: '08:00',
    submitting: false
  },

  onShow() {
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 1000);
      return;
    }
    this.loadPartners();
  },

  loadPartners() {
    const currentUserId = (wx.getStorageSync('userInfo') || {}).id;
    api.get('/api/partner/my_list').then(res => {
      const list = Array.isArray(res) ? res : [];
      const partners = list.map(item => {
        // Normalize: show the other person's info
        const isUser1 = String(item.user1_id) === String(currentUserId);
        return {
          id: isUser1 ? item.user2_id : item.user1_id,
          nickName: isUser1 ? (item.user2_nick || item.user2_name || '伙伴') : (item.user1_nick || item.user1_name || '伙伴'),
          avatarUrl: isUser1 ? item.user2_avatar : item.user1_avatar,
          rawId: item.id
        };
      });
      this.setData({ partners });
    }).catch(() => {});
  },

  onTitleInput(e) {
    this.setData({ title: e.detail });
  },

  onDescInput(e) {
    this.setData({ description: e.detail });
  },

  // Frequency picker
  openFreqPicker() {
    this.setData({ showFreqPicker: true });
  },
  closeFreqPicker() {
    this.setData({ showFreqPicker: false });
  },
  onFreqConfirm(e) {
    this.setData({ frequency: e.detail.value, showFreqPicker: false });
  },

  // Category picker
  openCatPicker() {
    this.setData({ showCatPicker: true });
  },
  closeCatPicker() {
    this.setData({ showCatPicker: false });
  },
  onCatConfirm(e) {
    this.setData({ category: e.detail.value, showCatPicker: false });
  },

  // Partner selection
  selectPartner(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    this.setData({ partnerId: id, selectedPartnerName: name });
  },

  // Role switch
  onRoleChange(e) {
    this.setData({ iAmExecutor: e.detail === 'executor' });
  },

  // Reward
  onRewardInput(e) {
    this.setData({ reward: e.detail });
  },

  // Time picker
  openTimePicker() {
    this.setData({ showTimePicker: true });
  },
  closeTimePicker() {
    this.setData({ showTimePicker: false });
  },
  onTimeConfirm(e) {
    this.setData({ remindTime: e.detail, showTimePicker: false, currentTime: e.detail });
  },

  // Submit
  submit() {
    const { title, description, frequency, category, partnerId, iAmExecutor, reward, remindTime } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请输入计划名称', icon: 'none' });
      return;
    }
    if (!partnerId) {
      wx.showToast({ title: '请选择伙伴', icon: 'none' });
      return;
    }
    const freqMap = { '每天': 'daily', '每周': 'weekly', '自定义': 'custom' };
    this.setData({ submitting: true });
    api.post('/api/plan/create', {
      title: title.trim(),
      description: description.trim(),
      frequency: freqMap[frequency] || 'daily',
      category,
      partnerId,
      iAmExecutor,
      reward: reward.trim() || '',
      remind_time: remindTime || ''
    }).then(() => {
      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }).catch(() => {
      this.setData({ submitting: false });
    });
  }
});
