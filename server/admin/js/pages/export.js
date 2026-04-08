const ExportPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="数据导出">
      <el-alert title="导出的数据为CSV格式，可用Excel打开。点击按钮即可下载对应数据。" type="info" show-icon :closable="false" style="margin-bottom:20px" />
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" style="border-radius:12px;text-align:center;padding:20px 0">
            <el-icon :size="48" color="#4A90D9"><UserFilled /></el-icon>
            <h3>用户数据</h3>
            <p style="color:#999;font-size:13px;margin-bottom:16px">所有用户基本信息</p>
            <el-button type="primary" :loading="exporting.users" @click="doExport('users', '用户数据')">
              <el-icon><Download /></el-icon> 导出CSV
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" style="border-radius:12px;text-align:center;padding:20px 0">
            <el-icon :size="48" color="#67c23a"><Document /></el-icon>
            <h3>笔记数据</h3>
            <p style="color:#999;font-size:13px;margin-bottom:16px">所有笔记概要信息</p>
            <el-button type="success" :loading="exporting.notes" @click="doExport('notes', '笔记数据')">
              <el-icon><Download /></el-icon> 导出CSV
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" style="border-radius:12px;text-align:center;padding:20px 0">
            <el-icon :size="48" color="#e6a23c"><TrendCharts /></el-icon>
            <h3>签到数据</h3>
            <p style="color:#999;font-size:13px;margin-bottom:16px">所有签到记录</p>
            <el-button type="warning" :loading="exporting.signs" @click="doExport('signs', '签到数据')">
              <el-icon><Download /></el-icon> 导出CSV
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" style="border-radius:12px;text-align:center;padding:20px 0">
            <el-icon :size="48" color="#909399"><Connection /></el-icon>
            <h3>伙伴数据</h3>
            <p style="color:#999;font-size:13px;margin-bottom:16px">所有伙伴关系</p>
            <el-button :loading="exporting.partners" @click="doExport('partners', '伙伴数据')">
              <el-icon><Download /></el-icon> 导出CSV
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </PageContainer>
  `,
  data() { return { exporting: { users: false, notes: false, signs: false, partners: false } }; },
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
