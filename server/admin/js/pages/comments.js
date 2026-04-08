const CommentsPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="评论管理">
      <div class="search-bar">
        <el-input v-model="noteId" placeholder="输入笔记ID查询评论" style="width:200px" />
        <el-button type="primary" @click="load">查询</el-button>
      </div>
      <el-empty v-if="!noteId && list.length===0" description="请输入笔记ID查询评论" />
      <el-table v-else :data="list" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="user_name" label="用户" width="100" />
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column prop="like_cnt" label="赞" width="60" />
        <el-table-column prop="created_at" label="时间" width="170" />
        <el-table-column label="状态" width="80">
          <template #default="{row}">
            <el-tag :type="row.status===1?'success':'info'" size="small">{{row.status===1?'正常':'隐藏'}}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="total>20" layout="prev, pager, next" :total="total" :page-size="20" @current-change="p=>{page=p;load()}" style="margin-top:16px" />
    </PageContainer>
  `,
  data() { return { list: [], total: 0, page: 1, noteId: '', loading: false }; },
  methods: {
    async load() {
      if (!this.noteId) return;
      this.loading = true;
      const res = await adminApi.get('/api/comment/list?noteId=' + this.noteId + '&page=' + this.page + '&size=20');
      if (res.code === 200) { this.list = res.data.list || []; this.total = res.data.total || 0; }
      this.loading = false;
    }
  }
};
