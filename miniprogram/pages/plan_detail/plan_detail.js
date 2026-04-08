const api = require('../../utils/api.js');

Page({
  data: {
    id: '',
    plan: {},
    myUserId: '',
    isExecutor: false,
    isSupervisor: false,

    // Calendar
    year: 0,
    month: 0,
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    calendarDays: [],
    checkedDaySet: {},
    monthLabel: '',

    // Records
    records: [],
    recordPage: 1,
    recordSize: 10,
    hasMoreRecords: true,
    loadingRecords: false,

    // Checkin popup
    showCheckin: false,
    checkinContent: '',
    todayChecked: false,

    // Comment popup
    showComment: false,
    commentRecordId: '',
    commentText: '',
    commentScore: 5
  },

  onLoad(options) {
    const id = options.id;
    const now = new Date();
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      id,
      myUserId: userInfo.id || '',
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.loadDetail();
    this.loadCalendar();
    this.loadRecords(true);
  },

  loadDetail() {
    api.get('/api/plan/detail/' + this.data.id).then(res => {
      const myUserId = this.data.myUserId;
      const isExecutor = String(res.executor_id) === String(myUserId);
      const isSupervisor = String(res.supervisor_id) === String(myUserId);
      res.frequencyLabel = res.frequency === 'daily' ? '每天' : res.frequency === 'weekly' ? '每周' : (res.frequency || '每天');
      this.setData({ plan: res, isExecutor, isSupervisor });
    });
  },

  // ========== Calendar ==========
  loadCalendar() {
    const { id, year, month } = this.data;
    api.get('/api/plan/calendar/' + id, { year, month }).then(res => {
      const records = Array.isArray(res) ? res : [];
      const checkedDaySet = {};
      records.forEach(r => {
        checkedDaySet[Number(r.day)] = true;
      });
      this.buildCalendar(checkedDaySet);
    }).catch(() => {
      this.buildCalendar({});
    });
  },

  buildCalendar(checkedDaySet) {
    const { year, month } = this.data;
    const firstDay = new Date(year, month - 1, 1);
    let startWeekday = firstDay.getDay(); // 0=Sun
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1; // convert to Mon=0
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const todayDate = today.getDate();

    const calendarDays = [];
    // Empty cells before first day
    for (let i = 0; i < startWeekday; i++) {
      calendarDays.push({ day: '', empty: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      calendarDays.push({
        day: d,
        empty: false,
        isToday: isCurrentMonth && d === todayDate,
        checked: !!checkedDaySet[d]
      });
    }

    const monthLabel = year + '年' + month + '月';
    this.setData({ calendarDays, checkedDaySet, monthLabel });

    // Check if today is already checked
    if (isCurrentMonth) {
      this.setData({ todayChecked: !!checkedDaySet[todayDate] });
    }
  },

  prevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) { month = 12; year--; }
    this.setData({ year, month });
    this.loadCalendar();
  },

  nextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) { month = 1; year++; }
    this.setData({ year, month });
    this.loadCalendar();
  },

  // ========== Records ==========
  loadRecords(reset) {
    if (reset) {
      this.setData({ recordPage: 1, records: [], hasMoreRecords: true });
    }
    if (!this.data.hasMoreRecords || this.data.loadingRecords) return;
    this.setData({ loadingRecords: true });
    const { id, recordPage, recordSize } = this.data;
    api.get('/api/plan/records/' + id, { page: recordPage, size: recordSize }).then(res => {
      const list = Array.isArray(res.list) ? res.list : [];
      const allRecords = reset ? list : this.data.records.concat(list);
      // Format dates
      allRecords.forEach(r => {
        if (!r.dateLabel && r.created_at) {
          const d = new Date(r.created_at);
          r.dateLabel = (d.getMonth() + 1) + '月' + d.getDate() + '日';
          r.timeLabel = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        }
      });
      this.setData({
        records: allRecords,
        hasMoreRecords: list.length >= recordSize,
        recordPage: this.data.recordPage + 1,
        loadingRecords: false
      });
    }).catch(() => {
      this.setData({ loadingRecords: false });
    });
  },

  loadMoreRecords() {
    this.loadRecords(false);
  },

  // ========== Checkin ==========
  openCheckin() {
    this.setData({ showCheckin: true, checkinContent: '' });
  },

  closeCheckin() {
    this.setData({ showCheckin: false });
  },

  onCheckinInput(e) {
    this.setData({ checkinContent: e.detail });
  },

  submitCheckin() {
    const { id, checkinContent } = this.data;
    if (!checkinContent.trim()) {
      wx.showToast({ title: '请输入打卡内容', icon: 'none' });
      return;
    }
    api.post('/api/plan/checkin', {
      planId: id,
      content: checkinContent,
      images: []
    }).then(() => {
      wx.showToast({ title: '打卡成功', icon: 'success' });
      this.setData({ showCheckin: false, todayChecked: true });
      this.loadCalendar();
      this.loadRecords(true);
    });
  },

  // ========== Comment ==========
  openComment(e) {
    const recordId = e.currentTarget.dataset.id;
    this.setData({ showComment: true, commentRecordId: recordId, commentText: '', commentScore: 5 });
  },

  closeComment() {
    this.setData({ showComment: false });
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail });
  },

  onScoreChange(e) {
    this.setData({ commentScore: e.detail });
  },

  submitComment() {
    const { commentRecordId, commentText, commentScore } = this.data;
    if (!commentText.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }
    api.post('/api/plan/comment', {
      recordId: commentRecordId,
      comment: commentText,
      score: commentScore
    }).then(() => {
      wx.showToast({ title: '评论成功', icon: 'success' });
      this.setData({ showComment: false });
      this.loadRecords(true);
    });
  },

  onReachBottom() {
    this.loadMoreRecords();
  }
});
