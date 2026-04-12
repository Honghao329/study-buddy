const api = require('../../utils/api.js');

Page({
  data: {
    list: [], page: 1, size: 10, hasMore: true, loading: false,
    search: '', filter: '',
    showCreate: false, creating: false,
    createForm: { title: '', description: '', start_date: '', end_date: '' },
  },

  onShow() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadList();
  },

  loadList() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    const { page, size, search } = this.data;
    api.get('/api/checkin/list', { page, size, search }).then(res => {
      const items = res.list || [];
      const allItems = page === 1 ? items : this.data.list.concat(items);
      this._markMyItems(allItems);
      this.setData({ loading: false, hasMore: items.length >= size });
    }).catch(() => { this.setData({ loading: false }); });
  },

  _markMyItems(allItems) {
    const userId = (wx.getStorageSync('userInfo') || {}).id;
    if (!userId) { this.setData({ list: allItems }); return; }

    api.get('/api/checkin/my_joined_ids').then(ids => {
      const joinedSet = new Set(Array.isArray(ids) ? ids : []);
      const list = allItems.map(item => ({
        ...item,
        _joined: joinedSet.has(item.id),
        _supervising: item.supervisor_id === userId,
      }));

      const filter = this.data.filter;
      let filtered = list;
      if (filter === 'joined') filtered = list.filter(i => i._joined);
      else if (filter === 'supervising') filtered = list.filter(i => i._supervising);
      this.setData({ list: filtered });
    }).catch(() => { this.setData({ list: allItems }); });
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.v;
    this.setData({ filter, list: [], page: 1, hasMore: true });
    this.loadList();
  },

  onSearchInput(e) { this.setData({ search: e.detail.value }); },
  onSearch() { this.setData({ list: [], page: 1, hasMore: true }); this.loadList(); },
  onClearSearch() { this.setData({ search: '', list: [], page: 1, hasMore: true }); this.loadList(); },

  onPullDownRefresh() { this.setData({ list: [], page: 1, hasMore: true }); this.loadList(); wx.stopPullDownRefresh(); },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 }); this.loadList();
    }
  },

  goDetail(e) { wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + e.currentTarget.dataset.id }); },

  // 创建
  openCreate() {
    if (!api.getToken()) { api.requireLogin(); return; }
    this.setData({ showCreate: true, createForm: { title: '', description: '', start_date: '', end_date: '' } });
  },
  closeCreate() { this.setData({ showCreate: false }); },
  onCreateTitle(e) { this.setData({ 'createForm.title': e.detail.value }); },
  onCreateDesc(e) { this.setData({ 'createForm.description': e.detail.value }); },
  onStartDate(e) { this.setData({ 'createForm.start_date': e.detail.value }); },
  onEndDate(e) { this.setData({ 'createForm.end_date': e.detail.value }); },

  doCreate() {
    if (!this.data.createForm.title.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    const { start_date, end_date } = this.data.createForm;
    if (start_date && end_date && start_date > end_date) { wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' }); return; }
    this.setData({ creating: true });
    api.post('/api/checkin/create', this.data.createForm).then(res => {
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ creating: false, showCreate: false, list: [], page: 1, hasMore: true });
      this.loadList();
      if (res && res.id) {
        setTimeout(() => wx.navigateTo({ url: '/pages/checkin_detail/checkin_detail?id=' + res.id }), 800);
      }
    }).catch(() => { this.setData({ creating: false }); });
  },
});
