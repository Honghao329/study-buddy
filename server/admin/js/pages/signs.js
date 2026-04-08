const SignsPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="签到数据">
      <el-table :data="list" stripe border v-loading="loading">
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
    </PageContainer>
  `,
  data() { return { list: [], loading: false }; },
  async mounted() {
    this.loading = true;
    const res = await adminApi.get('/api/sign/rank');
    if (res.code === 200) this.list = res.data || [];
    this.loading = false;
  }
};
