const PartnersPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="伙伴关系">
      <el-empty v-if="list.length===0 && !loading" description="暂无伙伴关系数据" />
      <el-table v-else :data="list" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="发起方">
          <template #default="{row}">
            <div style="display:flex;align-items:center;gap:8px">
              <el-avatar :size="28" style="background:#4A90D9">{{(row.user_name||'用')[0]}}</el-avatar>
              <span>{{row.user_name||'用户'+row.user_id}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="接收方">
          <template #default="{row}">
            <div style="display:flex;align-items:center;gap:8px">
              <el-avatar :size="28" style="background:#67c23a">{{(row.target_name||'用')[0]}}</el-avatar>
              <span>{{row.target_name||'用户'+row.target_id}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="{0:'warning',1:'success',8:'danger',9:'info'}[row.status]" size="small">
              {{({0:'待接受',1:'已接受',8:'已拒绝',9:'已解除'})[row.status]}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
      </el-table>
    </PageContainer>
  `,
  data() { return { list: [], loading: false }; },
  async mounted() {
    this.loading = true;
    // 复用管理员用户列表里的伙伴数据（需要后端支持）
    // 暂时用简单查询
    try {
      const res = await adminApi.get('/api/admin/partner_list');
      if (res.code === 200) this.list = res.data || [];
    } catch(e) {}
    this.loading = false;
  }
};
