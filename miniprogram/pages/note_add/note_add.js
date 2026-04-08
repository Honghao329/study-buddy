const api = require('../../utils/api.js');

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    content: '',
    visibility: 'public',
    visibilityOptions: ['公开', '私密', '伙伴可见'],
    visibilityValues: ['public', 'private', 'partner'],
    visibilityIndex: 0,
    tags: [],
    tagInput: '',
    images: [],
    submitting: false
  },

  onLoad(options) {
    if (!api.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
      return;
    }
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑笔记' });
      this.loadNote(options.id);
    }
  },

  loadNote(id) {
    wx.showLoading({ title: '加载中' });
    api.get('/api/note/detail/' + id).then(res => {
      wx.hideLoading();
      const note = res || {};
      const vIdx = this.data.visibilityValues.indexOf(note.visibility || 'public');
      this.setData({
        title: note.title || '',
        content: note.content || '',
        visibility: note.visibility || 'public',
        visibilityIndex: vIdx >= 0 ? vIdx : 0,
        tags: note.tags || [],
        images: note.images || []
      });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onVisibilityChange(e) {
    const idx = e.detail.value;
    this.setData({
      visibilityIndex: idx,
      visibility: this.data.visibilityValues[idx]
    });
  },

  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },

  addTag() {
    const tag = this.data.tagInput.trim();
    if (!tag) return;
    if (this.data.tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    if (this.data.tags.length >= 5) {
      wx.showToast({ title: '最多5个标签', icon: 'none' });
      return;
    }
    this.setData({
      tags: [...this.data.tags, tag],
      tagInput: ''
    });
  },

	removeTag(e) {
		const idx = Number(e.currentTarget.dataset.index);
		const tags = this.data.tags.filter((_, i) => i !== idx);
		this.setData({ tags });
	},

  chooseImage() {
    const remain = 9 - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多9张图片', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = res.tempFilePaths;
        files.forEach(filePath => {
          wx.showLoading({ title: '上传中' });
          api.uploadImage(filePath).then(url => {
            wx.hideLoading();
            this.setData({ images: [...this.data.images, url] });
          }).catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          });
        });
      }
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: this.data.images });
  },

	removeImage(e) {
		const idx = Number(e.currentTarget.dataset.index);
		const images = this.data.images.filter((_, i) => i !== idx);
		this.setData({ images });
	},

  onSubmit() {
    const { title, content, visibility, tags, images, id, isEdit, submitting } = this.data;
    if (submitting) return;

    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    const postData = { title: title.trim(), content: content.trim(), visibility, tags, images };

    const request = isEdit
      ? api.put('/api/note/update/' + id, postData)
      : api.post('/api/note/create', postData);

    request.then(() => {
      wx.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1000);
    }).catch(() => {
      this.setData({ submitting: false });
    });
  }
});
