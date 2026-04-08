const UsersPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="用户管理">
      <div class="search-bar">
        <el-input v-model="search" placeholder="搜索用户昵称" clearable @clear="load" @keyup.enter="load" style="width:300px" />
        <el-button type="primary" @click="load">搜索</el-button>
        <el-tag>共 {{total}} 位用户</el-tag>
      </div>
      <el-table :data="list" stripe border v-loading="loading" @row-click="viewUser" style="cursor:pointer">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="头像" width="70">
          <template #default="{row}">
            <el-avatar :size="32" :src="row.avatar" style="background:#4A90D9">{{(row.nickname||'用')[0]}}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="bio" label="简介" show-overflow-tooltip />
        <el-table-column prop="mobile" label="手机" width="120" />
        <el-table-column prop="login_cnt" label="登录" width="70" />
        <el-table-column label="标签" width="150">
          <template #default="{row}">
            <el-tag v-for="t in (row.tags||[])" :key="t" size="small" style="margin:2px">{{t}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="170" />
        <el-table-column label="状态" width="80">
          <template #default="{row}">
            <el-tag :type="row.status===1?'success':'danger'" size="small">{{row.status===1?'正常':'禁用'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <el-popconfirm :title="row.status===1?'确定禁用该用户？':'确定启用该用户？'" @confirm="toggleStatus(row)">
              <template #reference>
                <el-button size="small" text :type="row.status===1?'danger':'success'">{{row.status===1?'禁用':'启用'}}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination layout="total, prev, pager, next" :total="total" :page-size="20" @current-change="p=>{page=p;load()}" style="margin-top:16px;justify-content:flex-end" />

      <el-dialog v-model="showDetail" title="用户详情" width="560px">
        <template v-if="userDetail">
          <div style="text-align:center;margin-bottom:16px">
            <el-avatar :size="64" :src="userDetail.avatar" style="background:#4A90D9">{{(userDetail.nickname||'用')[0]}}</el-avatar>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{userDetail.id}}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{userDetail.nickname}}</el-descriptions-item>
            <el-descriptions-item label="手机">{{userDetail.mobile || '-'}}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="userDetail.status===1?'success':'danger'" size="small">{{userDetail.status===1?'正常':'禁用'}}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="简介" :span="2">{{userDetail.bio || '-'}}</el-descriptions-item>
            <el-descriptions-item label="标签" :span="2">
              <el-tag v-for="t in (userDetail.tags||[])" :key="t" size="small" style="margin:2px">{{t}}</el-tag>
              <span v-if="!(userDetail.tags||[]).length">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="登录次数">{{userDetail.login_cnt || 0}}</el-descriptions-item>
            <el-descriptions-item label="性别">{{userDetail.gender===1?'男':userDetail.gender===2?'女':'未知'}}</el-descriptions-item>
            <el-descriptions-item label="注册时间" :span="2">{{userDetail.created_at}}</el-descriptions-item>
            <el-descriptions-item label="最后登录" :span="2">{{userDetail.last_login_at || '-'}}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-dialog>
    </PageContainer>
  `,
  data() { return { list: [], total: 0, page: 1, search: '', loading: false, showDetail: false, userDetail: null }; },
  mounted() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      const q = this.search ? '&search=' + encodeURIComponent(this.search) : '';
      const res = await adminApi.get('/api/admin/user_list?page=' + this.page + '&size=20' + q);
      if (res.code === 200) { this.list = res.data.list || []; this.total = res.data.total || 0; }
      this.loading = false;
    },
    async viewUser(row) {
      const res = await adminApi.get('/api/admin/user_detail/' + row.id);
      if (res.code === 200) {
        this.userDetail = res.data;
        this.showDetail = true;
      }
    },
    async toggleStatus(row) {
      const res = await adminApi.put('/api/admin/user_status/' + row.id);
      if (res.code === 200) {
        ElementPlus.ElMessage.success('状态已更新');
        row.status = res.data.status;
      } else {
        ElementPlus.ElMessage.error(res.msg || '操作失败');
      }
    }
  }
};
