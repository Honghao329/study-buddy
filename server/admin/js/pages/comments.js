const CommentsPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="评论管理">
      <div class="search-bar">
        <el-input v-model="noteId" placeholder="按笔记ID筛选" clearable style="width:160px" @clear="load" />
        <el-input v-model="search" placeholder="搜索评论内容" clearable style="width:240px" @clear="load" @keyup.enter="load" />
        <el-button type="primary" @click="load">查询</el-button>
        <el-tag>共 {{total}} 条评论</el-tag>
      </div>
      <el-table :data="list" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="note_title" label="所属笔记" show-overflow-tooltip min-width="140" />
        <el-table-column prop="user_name" label="用户" width="100" />
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip min-width="200" />
        <el-table-column prop="created_at" label="时间" width="160" />
        <el-table-column label="状态" width="80">
          <template #default="{row}">
            <el-tag :type="row.status===1?'success':'info'" size="small">{{row.status===1?'正常':'隐藏'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{row}">
            <el-button size="small" text :type="row.status===1?'warning':'success'" @click="toggleStatus(row)">
              {{row.status===1?'隐藏':'显示'}}
            </el-button>
            <el-popconfirm title="确定删除该评论？" @confirm="del(row)">
              <template #reference><el-button size="small" text type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="total>20" layout="total, prev, pager, next" :total="total" :page-size="20" @current-change="p=>{page=p;load()}" style="margin-top:16px;justify-content:flex-end" />
    </PageContainer>
  `,
  data() { return { list: [], total: 0, page: 1, noteId: '', search: '', loading: false }; },
  mounted() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      let q = '?page=' + this.page + '&size=20';
      if (this.noteId) q += '&noteId=' + this.noteId;
      if (this.search) q += '&search=' + encodeURIComponent(this.search);
      const res = await adminApi.get('/api/admin/comment_list' + q);
      if (res.code === 200) { this.list = res.data.list || []; this.total = res.data.total || 0; }
      this.loading = false;
    },
    async toggleStatus(row) {
      const res = await adminApi.put('/api/admin/comment_status/' + row.id);
      if (res.code === 200) { row.status = res.data.status; ElementPlus.ElMessage.success('状态已更新'); }
    },
    async del(row) {
      await adminApi.del('/api/admin/comment_del/' + row.id);
      ElementPlus.ElMessage.success('已删除');
      this.load();
    }
  }
};
