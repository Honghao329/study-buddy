const SignsPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="签到数据">
      <el-tabs v-model="activeTab" @tab-click="onTabChange">
        <el-tab-pane label="签到排行" name="rank" />
        <el-tab-pane label="签到记录" name="records" />
      </el-tabs>

      <template v-if="activeTab==='rank'">
        <el-table :data="rankList" stripe border v-loading="loadingRank">
          <el-table-column type="index" label="排名" width="70">
            <template #default="{$index}">
              <el-tag v-if="$index<3" :type="['danger','warning',''][$index]" size="small" round>{{$index+1}}</el-tag>
              <span v-else>{{$index+1}}</span>
            </template>
          </el-table-column>
          <el-table-column label="用户" width="200">
            <template #default="{row}">
              <div style="display:flex;align-items:center;gap:8px">
                <el-avatar :size="28" :src="row.user_pic" style="background:#4A90D9">{{(row.user_name||'学')[0]}}</el-avatar>
                <span>{{row.user_name||'匿名'}}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="days" label="签到天数" width="120">
            <template #default="{row}"><strong style="color:#4A90D9">{{row.days}}</strong> 天</template>
          </el-table-column>
          <el-table-column prop="total_duration" label="总学习时长" width="140">
            <template #default="{row}">{{row.total_duration||0}} 分钟</template>
          </el-table-column>
          <el-table-column label="日均时长">
            <template #default="{row}">{{row.days ? Math.round((row.total_duration||0)/row.days) : 0}} 分钟</template>
          </el-table-column>
        </el-table>
      </template>

      <template v-if="activeTab==='records'">
        <div class="search-bar">
          <el-input v-model="search" placeholder="搜索用户昵称" clearable @clear="loadRecords" @keyup.enter="loadRecords" style="width:240px" />
          <el-button type="primary" @click="loadRecords">搜索</el-button>
          <el-tag>共 {{recordTotal}} 条记录</el-tag>
        </div>
        <el-table :data="recordList" stripe border v-loading="loadingRecords">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="user_name" label="用户" width="120" />
          <el-table-column prop="day" label="日期" width="120" />
          <el-table-column prop="duration" label="时长(分)" width="100" />
          <el-table-column prop="content" label="内容" show-overflow-tooltip min-width="160" />
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column prop="created_at" label="签到时间" width="160" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{row}">
              <el-popconfirm title="确定删除该签到记录？" @confirm="delRecord(row.id)">
                <template #reference><el-button size="small" text type="danger">删除</el-button></template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="recordTotal>20" layout="total, prev, pager, next" :total="recordTotal" :page-size="20" @current-change="p=>{recordPage=p;loadRecords()}" style="margin-top:16px;justify-content:flex-end" />
      </template>
    </PageContainer>
  `,
  data() { return { activeTab: 'rank', rankList: [], loadingRank: false, recordList: [], recordTotal: 0, recordPage: 1, search: '', loadingRecords: false }; },
  mounted() { this.loadRank(); },
  methods: {
    onTabChange() {
      if (this.activeTab === 'rank' && this.rankList.length === 0) this.loadRank();
      if (this.activeTab === 'records' && this.recordList.length === 0) this.loadRecords();
    },
    async loadRank() {
      this.loadingRank = true;
      const res = await adminApi.get('/api/sign/rank');
      if (res.code === 200) this.rankList = res.data || [];
      this.loadingRank = false;
    },
    async loadRecords() {
      this.loadingRecords = true;
      let q = '?page=' + this.recordPage + '&size=20';
      if (this.search) q += '&search=' + encodeURIComponent(this.search);
      const res = await adminApi.get('/api/admin/sign_list' + q);
      if (res.code === 200) { this.recordList = res.data.list || []; this.recordTotal = res.data.total || 0; }
      this.loadingRecords = false;
    },
    async delRecord(id) {
      await adminApi.del('/api/admin/sign_del/' + id);
      ElementPlus.ElMessage.success('已删除');
      this.loadRecords();
    }
  }
};
