const CheckinsPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="打卡任务" showAdd addText="新增任务" @add="openAdd">
      <el-table :data="list" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="200" />
        <el-table-column prop="start_date" label="开始" width="110" />
        <el-table-column prop="end_date" label="结束" width="110" />
        <el-table-column prop="join_cnt" label="参与" width="70" />
        <el-table-column prop="view_cnt" label="浏览" width="70" />
        <el-table-column label="状态" width="80">
          <template #default="{row}">
            <el-tag :type="row.status===1?'':'info'" size="small">{{row.status===1?'启用':'停用'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button size="small" text @click="editRow(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="del(row.id)">
              <template #reference><el-button size="small" text type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="showDialog" :title="isEdit?'编辑打卡任务':'新增打卡任务'" width="520px">
        <el-form :model="form" label-width="90px">
          <el-form-item label="任务标题"><el-input v-model="form.title" placeholder="如：每日英语打卡" /></el-form-item>
          <el-form-item label="任务描述"><el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述任务要求" /></el-form-item>
          <el-form-item label="开始日期"><el-date-picker v-model="form.start_date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
          <el-form-item label="结束日期"><el-date-picker v-model="form.end_date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
          <el-form-item label="状态" v-if="isEdit">
            <el-select v-model="form.status" style="width:100%">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showDialog=false">取消</el-button>
          <el-button :loading="submitting" @click="save">{{isEdit?'保存':'创建'}}</el-button>
        </template>
      </el-dialog>
    </PageContainer>
  `,
  data() { return { list: [], loading: false, showDialog: false, isEdit: false, submitting: false, form: { title: '', description: '', start_date: '', end_date: '', status: 1 }, editId: null }; },
  mounted() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      const res = await adminApi.get('/api/admin/checkin_list');
      if (res.code === 200) this.list = Array.isArray(res.data) ? res.data : (res.data.list || []);
      this.loading = false;
    },
    openAdd() {
      this.isEdit = false; this.editId = null;
      this.form = { title: '', description: '', start_date: '', end_date: '', status: 1 };
      this.showDialog = true;
    },
    editRow(row) {
      this.isEdit = true; this.editId = row.id;
      this.form = { title: row.title || '', description: row.description || '', start_date: row.start_date || '', end_date: row.end_date || '', status: row.status ?? 1 };
      this.showDialog = true;
    },
    async save() {
      if (!this.form.title) { ElementPlus.ElMessage.warning('请输入标题'); return; }
      this.submitting = true;
      if (this.isEdit) {
        const res = await adminApi.put('/api/admin/checkin_edit/' + this.editId, this.form);
        if (res.code === 200) { ElementPlus.ElMessage.success('保存成功'); this.showDialog = false; this.load(); }
        else { ElementPlus.ElMessage.error(res.msg || '保存失败'); }
      } else {
        await adminApi.post('/api/admin/checkin_create', this.form);
        ElementPlus.ElMessage.success('创建成功'); this.showDialog = false; this.load();
      }
      this.submitting = false;
    },
    async del(id) {
      await adminApi.del('/api/admin/checkin_del/' + id);
      ElementPlus.ElMessage.success('已删除'); this.load();
    }
  }
};
