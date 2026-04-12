const PartnersPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="伙伴关系">
      <div class="search-bar">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width:140px" @change="load">
          <el-option label="待接受" :value="0" />
          <el-option label="已接受" :value="1" />
          <el-option label="已拒绝" :value="8" />
          <el-option label="已解除" :value="9" />
        </el-select>
        <el-tag type="info" effect="plain">共 {{list.length}} 条记录</el-tag>
      </div>
      <el-empty v-if="list.length===0 && !loading" description="暂无伙伴关系数据" />
      <el-table v-else :data="list" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="发起方" min-width="120">
          <template #default="{row}">
            <div style="display:flex;align-items:center;gap:8px">
              <el-avatar :size="28" :src="row.user_pic" style="background:#4091f7">{{(row.user_name||'用')[0]}}</el-avatar>
              <span>{{row.user_name||'用户'+row.user_id}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="接收方" min-width="120">
          <template #default="{row}">
            <div style="display:flex;align-items:center;gap:8px">
              <el-avatar :size="28" :src="row.target_pic" style="background:#22c55e">{{(row.target_name||'用')[0]}}</el-avatar>
              <span>{{row.target_name||'用户'+row.target_id}}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag type="info" size="small">{{statusText(row.status)}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <el-button v-if="row.status===0" size="small" text @click="setStatus(row,1)">接受</el-button>
            <el-button v-if="row.status===0" size="small" text @click="setStatus(row,8)">拒绝</el-button>
            <el-button v-if="row.status===1" size="small" text @click="setStatus(row,9)">解除</el-button>
            <el-popconfirm title="确定删除该记录？" @confirm="del(row.id)">
              <template #reference><el-button size="small" text type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </PageContainer>
  `,
  data() { return { list: [], loading: false, statusFilter: '' }; },
  mounted() { this.load(); },
  methods: {
    statusText(s) { return {0:'待接受',1:'已接受',8:'已拒绝',9:'已解除'}[s] || s; },
    async load() {
      this.loading = true;
      let q = this.statusFilter !== '' ? '?status=' + this.statusFilter : '';
      const res = await adminApi.get('/api/admin/partner_list' + q);
      if (res.code === 200) this.list = res.data || [];
      this.loading = false;
    },
    async setStatus(row, status) {
      const res = await adminApi.put('/api/admin/partner_status/' + row.id, { status });
      if (res.code === 200) { row.status = status; ElementPlus.ElMessage.success('状态已更新'); }
    },
    async del(id) {
      await adminApi.del('/api/admin/partner_del/' + id);
      ElementPlus.ElMessage.success('已删除'); this.load();
    }
  }
};
