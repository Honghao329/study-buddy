const UsersPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="用户管理">
      <div class="search-bar">
        <el-input v-model="search" placeholder="搜索用户昵称" clearable @clear="load" @keyup.enter="load" style="width:240px" />
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width:100px" @change="load">
          <el-option label="正常" :value="1" /><el-option label="禁用" :value="9" />
        </el-select>
        <el-button type="primary" @click="load">搜索</el-button>
        <el-tag>共 {{total}} 位用户</el-tag>
      </div>
      <el-table :data="list" stripe border v-loading="loading" @row-click="viewUser" style="cursor:pointer">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="头像" width="60">
          <template #default="{row}">
            <el-avatar :size="32" :src="row.avatar" style="background:#4A90D9">{{(row.nickname||'用')[0]}}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="100" />
        <el-table-column prop="bio" label="简介" show-overflow-tooltip min-width="120" />
        <el-table-column prop="mobile" label="手机" width="110" />
        <el-table-column prop="login_cnt" label="登录" width="60" />
        <el-table-column label="标签" width="140">
          <template #default="{row}">
            <el-tag v-for="t in (row.tags||[])" :key="t" size="small" style="margin:2px">{{t}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160" />
        <el-table-column label="状态" width="70">
          <template #default="{row}">
            <el-tag :type="row.status===1?'success':'danger'" size="small">{{row.status===1?'正常':'禁用'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button size="small" text type="primary" @click.stop="editUser(row)">编辑</el-button>
            <el-popconfirm :title="row.status===1?'确定禁用？':'确定启用？'" @confirm="toggleStatus(row)">
              <template #reference>
                <el-button size="small" text :type="row.status===1?'warning':'success'" @click.stop>{{row.status===1?'禁用':'启用'}}</el-button>
              </template>
            </el-popconfirm>
            <el-popconfirm title="确定删除该用户及其所有数据？" @confirm="delUser(row.id)">
              <template #reference><el-button size="small" text type="danger" @click.stop>删除</el-button></template>
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
            <el-descriptions-item label="注册时间">{{userDetail.created_at}}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-dialog>

      <el-dialog v-model="showEdit" title="编辑用户" width="500px">
        <el-form :model="editForm" label-width="80px">
          <el-form-item label="昵称"><el-input v-model="editForm.nickname" /></el-form-item>
          <el-form-item label="手机"><el-input v-model="editForm.mobile" /></el-form-item>
          <el-form-item label="简介"><el-input v-model="editForm.bio" type="textarea" :rows="3" /></el-form-item>
          <el-form-item label="标签"><el-input v-model="editForm.tagsStr" placeholder="多个标签用逗号分隔" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showEdit=false">取消</el-button>
          <el-button type="primary" :loading="editSaving" @click="saveEdit">保存</el-button>
        </template>
      </el-dialog>
    </PageContainer>
  `,
  data() { return { list: [], total: 0, page: 1, search: '', statusFilter: '', loading: false, showDetail: false, userDetail: null, showEdit: false, editSaving: false, editForm: {} }; },
  mounted() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      let q = '?page=' + this.page + '&size=20';
      if (this.search) q += '&search=' + encodeURIComponent(this.search);
      if (this.statusFilter !== '') q += '&status=' + this.statusFilter;
      const res = await adminApi.get('/api/admin/user_list' + q);
      if (res.code === 200) { this.list = res.data.list || []; this.total = res.data.total || 0; }
      this.loading = false;
    },
    async viewUser(row) {
      const res = await adminApi.get('/api/admin/user_detail/' + row.id);
      if (res.code === 200) { this.userDetail = res.data; this.showDetail = true; }
    },
    editUser(row) {
      this.editForm = { id: row.id, nickname: row.nickname || '', mobile: row.mobile || '', bio: row.bio || '', tagsStr: (row.tags || []).join(', ') };
      this.showEdit = true;
    },
    async saveEdit() {
      this.editSaving = true;
      const tags = this.editForm.tagsStr ? this.editForm.tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];
      const res = await adminApi.put('/api/admin/user_edit/' + this.editForm.id, { nickname: this.editForm.nickname, mobile: this.editForm.mobile, bio: this.editForm.bio, tags });
      if (res.code === 200) { ElementPlus.ElMessage.success('保存成功'); this.showEdit = false; this.load(); }
      else { ElementPlus.ElMessage.error(res.msg || '保存失败'); }
      this.editSaving = false;
    },
    async toggleStatus(row) {
      const res = await adminApi.put('/api/admin/user_status/' + row.id);
      if (res.code === 200) { ElementPlus.ElMessage.success('状态已更新'); row.status = res.data.status; }
    },
    async delUser(id) {
      await adminApi.del('/api/admin/user_del/' + id);
      ElementPlus.ElMessage.success('已删除');
      this.load();
    }
  }
};
