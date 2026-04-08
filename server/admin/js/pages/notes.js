const NotesPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="笔记管理">
      <div class="search-bar">
        <el-input v-model="search" placeholder="搜索笔记标题" clearable @clear="load" @keyup.enter="load" style="width:300px" />
        <el-button type="primary" @click="load">搜索</el-button>
        <el-tag>共 {{total}} 篇笔记</el-tag>
      </div>
      <el-table :data="list" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip min-width="200" />
        <el-table-column prop="user_name" label="作者" width="90" />
        <el-table-column label="可见性" width="80">
          <template #default="{row}">
            <el-tag size="small" :type="{public:'success',private:'danger',partner:'warning'}[row.visibility]">
              {{row.visibility==='public'?'公开':row.visibility==='private'?'私密':'伙伴'}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="160">
          <template #default="{row}">
            <el-tag v-for="t in (row.tags||[])" :key="t" size="small" type="info" style="margin:2px">{{t}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="like_cnt" label="赞" width="55" />
        <el-table-column prop="comment_cnt" label="评" width="55" />
        <el-table-column prop="view_cnt" label="览" width="55" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{row}">
            <el-button size="small" text @click="viewNote(row)">查看</el-button>
            <el-button size="small" text type="primary" @click="editNote(row)">编辑</el-button>
            <el-popconfirm title="确定删除该笔记？" @confirm="del(row.id)">
              <template #reference><el-button size="small" text type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination layout="total, prev, pager, next" :total="total" :page-size="20" @current-change="p=>{page=p;load()}" style="margin-top:16px;justify-content:flex-end" />

      <el-dialog v-model="showDetail" title="笔记详情" width="600px">
        <template v-if="detail">
          <div class="detail-row"><span class="detail-label">标题</span><span class="detail-value">{{detail.title}}</span></div>
          <div class="detail-row"><span class="detail-label">作者</span><span class="detail-value">{{detail.user_name}}</span></div>
          <div class="detail-row"><span class="detail-label">可见性</span><span class="detail-value">{{detail.visibility}}</span></div>
          <div class="detail-row"><span class="detail-label">标签</span><span class="detail-value"><el-tag v-for="t in (detail.tags||[])" :key="t" size="small" style="margin:2px">{{t}}</el-tag></span></div>
          <div class="detail-row"><span class="detail-label">内容</span><div class="detail-value"><pre>{{detail.content}}</pre></div></div>
          <div class="detail-row"><span class="detail-label">数据</span><span class="detail-value">赞{{detail.like_cnt}} 评{{detail.comment_cnt}} 览{{detail.view_cnt}}</span></div>
        </template>
      </el-dialog>

      <el-dialog v-model="showEdit" title="编辑笔记" width="600px">
        <el-form :model="editForm" label-width="80px">
          <el-form-item label="标题"><el-input v-model="editForm.title" /></el-form-item>
          <el-form-item label="内容"><el-input v-model="editForm.content" type="textarea" :rows="6" /></el-form-item>
          <el-form-item label="可见性">
            <el-select v-model="editForm.visibility" style="width:100%">
              <el-option label="公开" value="public" />
              <el-option label="私密" value="private" />
              <el-option label="伙伴" value="partner" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签"><el-input v-model="editForm.tagsStr" placeholder="多个标签用逗号分隔" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showEdit=false">取消</el-button>
          <el-button type="primary" :loading="editSaving" @click="saveEdit">保存</el-button>
        </template>
      </el-dialog>
    </PageContainer>
  `,
  data() { return { list: [], total: 0, page: 1, search: '', loading: false, showDetail: false, detail: null, showEdit: false, editSaving: false, editForm: { id: null, title: '', content: '', visibility: 'public', tagsStr: '' } }; },
  mounted() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      const q = this.search ? '&search=' + encodeURIComponent(this.search) : '';
      const res = await adminApi.get('/api/admin/note_list?page=' + this.page + '&size=20' + q);
      if (res.code === 200) { this.list = res.data.list || []; this.total = res.data.total || 0; }
      this.loading = false;
    },
    viewNote(row) { this.detail = row; this.showDetail = true; },
    editNote(row) {
      this.editForm = {
        id: row.id,
        title: row.title || '',
        content: row.content || '',
        visibility: row.visibility || 'public',
        tagsStr: (row.tags || []).join(', ')
      };
      this.showEdit = true;
    },
    async saveEdit() {
      if (!this.editForm.title) { ElementPlus.ElMessage.warning('请输入标题'); return; }
      this.editSaving = true;
      const tags = this.editForm.tagsStr ? this.editForm.tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];
      const res = await adminApi.put('/api/admin/note_edit/' + this.editForm.id, {
        title: this.editForm.title,
        content: this.editForm.content,
        visibility: this.editForm.visibility,
        tags
      });
      if (res.code === 200) {
        ElementPlus.ElMessage.success('保存成功');
        this.showEdit = false;
        this.load();
      } else {
        ElementPlus.ElMessage.error(res.msg || '保存失败');
      }
      this.editSaving = false;
    },
    async del(id) {
      await adminApi.del('/api/admin/note_del/' + id);
      ElementPlus.ElMessage.success('已删除');
      this.load();
    }
  }
};
