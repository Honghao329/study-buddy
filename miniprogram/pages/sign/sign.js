const api = require('../../utils/api.js');

Page({
  data: {
    stats: {
      streak: 0,
      totalDays: 0,
      totalDuration: 0,
      todaySigned: false
    },
    // Calendar
    year: 0,
    month: 0,
    days: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    signedDays: [],
    // Sign modal
    showModal: false,
    duration: '',
    statusIndex: 0,
    statusOptions: ['高效', '一般', '疲惫'],
    content: '',
    // Rank
    rankList: []
  },

  onLoad() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.loadAll();
  },

  loadAll() {
    this.loadStats();
    this.loadCalendar();
    this.loadRank();
  },

  loadStats() {
    api.get('/api/sign/stats').then(res => {
      if (res) {
        this.setData({
          stats: {
            streak: res.streak || 0,
            totalDays: res.totalDays || 0,
            totalDuration: res.totalDuration || 0,
            todaySigned: res.todaySigned || false
          }
        });
      }
    }).catch(() => {});
  },

  loadCalendar() {
    const { year, month } = this.data;
    api.get('/api/sign/calendar', { year, month }).then(res => {
      const signedDays = (res && res.days) ? res.days : [];
      this.setData({ signedDays });
      this.buildCalendar();
    }).catch(() => {
      this.buildCalendar();
    });
  },

  buildCalendar() {
    const { year, month, signedDays } = this.data;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', signed: false, empty: true });
    }
    // Days of month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const signed = signedDays.indexOf(d) !== -1;
      const isToday = (new Date().getFullYear() === year && new Date().getMonth() + 1 === month && new Date().getDate() === d);
      days.push({ day: d, signed, empty: false, isToday });
    }

    this.setData({ days });
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

  openSignModal() {
    if (this.data.stats.todaySigned) {
      wx.showToast({ title: '今日已签到', icon: 'none' });
      return;
    }
    this.setData({ showModal: true, duration: '', statusIndex: 0, content: '' });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  onDurationInput(e) {
    this.setData({ duration: e.detail.value });
  },

  onStatusChange(e) {
    this.setData({ statusIndex: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  doSign() {
    const { duration, statusIndex, statusOptions, content } = this.data;
    if (!duration) {
      wx.showToast({ title: '请输入学习时长', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '签到中' });
    api.post('/api/sign/do', {
      duration: Number(duration),
      status: statusOptions[statusIndex],
      content
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '签到成功', icon: 'success' });
      this.setData({ showModal: false });
      this.loadAll();
    }).catch(() => {
      wx.hideLoading();
    });
  },

  loadRank() {
    api.get('/api/sign/rank').then(res => {
      const rankList = (res && Array.isArray(res)) ? res.slice(0, 20) : [];
      this.setData({ rankList });
    }).catch(() => {});
  }
});
