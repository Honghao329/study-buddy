const NewsPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="资讯管理" showAdd addText="新增资讯" @add="openAdd">
      <el-table :data="list" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="cate" label="分类" width="100">
          <template #default="{row}">
            <el-tag size="small" type="info" effect="plain">{{row.cate||'未分类'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="view_cnt" label="浏览" width="70" />
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

      <el-dialog v-model="showDialog" :title="isEdit?'编辑资讯':'新增资讯'" width="560px">
        <el-form :model="form" label-width="80px">
          <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
          <el-form-item label="分类"><el-select v-model="form.cate" placeholder="选择分类" allow-create filterable style="width:100%">
            <el-option label="公告" value="公告" /><el-option label="通知" value="通知" /><el-option label="活动" value="活动" />
          </el-select></el-form-item>
          <el-form-item label="描述"><el-input v-model="form.description" /></el-form-item>
          <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showDialog=false">取消</el-button>
          <el-button :loading="submitting" @click="save">{{isEdit?'保存':'发布'}}</el-button>
        </template>
      </el-dialog>
    </PageContainer>
  `,
  data() { return { list: [], loading: false, showDialog: false, isEdit: false, submitting: false, editId: null, form: { title: '', cate: '', description: '', content: '' } }; },
  mounted() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      const res = await adminApi.get('/api/admin/news_list');
      if (res.code === 200) this.list = Array.isArray(res.data) ? res.data : (res.data.list || []);
      this.loading = false;
    },
    openAdd() {
      this.isEdit = false; this.editId = null;
      this.form = { title: '', cate: '', description: '', content: '' };
      this.showDialog = true;
    },
    editRow(row) {
      this.isEdit = true; this.editId = row.id;
      this.form = { title: row.title || '', cate: row.cate || '', description: row.description || '', content: row.content || '' };
      this.showDialog = true;
    },
    async save() {
      if (!this.form.title) { ElementPlus.ElMessage.warning('请输入标题'); return; }
      this.submitting = true;
      if (this.isEdit) {
        const res = await adminApi.put('/api/admin/news_edit/' + this.editId, this.form);
        if (res.code === 200) { ElementPlus.ElMessage.success('保存成功'); this.showDialog = false; this.load(); }
        else { ElementPlus.ElMessage.error(res.msg || '保存失败'); }
      } else {
        await adminApi.post('/api/admin/news_create', this.form);
        ElementPlus.ElMessage.success('发布成功'); this.showDialog = false; this.load();
      }
      this.submitting = false;
    },
    async del(id) {
      await adminApi.del('/api/admin/news_del/' + id);
      ElementPlus.ElMessage.success('已删除'); this.load();
    }
  }
};
