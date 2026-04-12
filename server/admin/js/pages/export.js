const ExportPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="数据导出">
      <el-alert title="导出的数据为CSV格式，可用Excel直接打开编辑。" type="info" show-icon :closable="false" style="margin-bottom:24px" />
      <div class="export-grid">
        <div class="export-card" v-for="item in items" :key="item.type">
          <div class="icon-wrap">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <h3>{{item.label}}</h3>
          <p>{{item.desc}}</p>
          <el-button :loading="exporting[item.type]" @click="doExport(item.type, item.label)">
            <el-icon><Download /></el-icon> 导出CSV
          </el-button>
        </div>
      </div>
    </PageContainer>
  `,
  data() {
    return {
      exporting: { users: false, notes: false, signs: false, partners: false },
      items: [
        { type: 'users', label: '用户数据', desc: '所有用户基本信息', icon: 'UserFilled' },
        { type: 'notes', label: '笔记数据', desc: '所有笔记概要信息', icon: 'Document' },
        { type: 'signs', label: '签到数据', desc: '所有签到记录', icon: 'TrendCharts' },
        { type: 'partners', label: '伙伴数据', desc: '所有伙伴关系', icon: 'Connection' },
      ]
    };
  },
  methods: {
    async doExport(type, label) {
      this.exporting[type] = true;
      try {
        const token = localStorage.getItem('admin_token') || '';
        const response = await fetch(window.location.origin + '/api/admin/export/' + type, {
          headers: { 'x-admin-token': token }
        });
        if (!response.ok) throw new Error('导出失败');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = type + '_' + new Date().toISOString().slice(0,10) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        ElementPlus.ElMessage.success(label + '导出成功');
      } catch (e) {
        ElementPlus.ElMessage.error(e.message || '导出失败');
      }
      this.exporting[type] = false;
    }
  }
};
