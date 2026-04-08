const DashboardPage = {
  template: `
    <div>
      <div class="quick-stats">
        <div class="quick-stat-card blue">
          <div class="stat-num" style="color:#4A90D9">{{stats.userCount || 0}}</div>
          <div class="stat-label">注册用户</div>
        </div>
        <div class="quick-stat-card green">
          <div class="stat-num" style="color:#67c23a">{{stats.noteCount || 0}}</div>
          <div class="stat-label">笔记总数</div>
        </div>
        <div class="quick-stat-card orange">
          <div class="stat-num" style="color:#e6a23c">{{stats.signCount || 0}}</div>
          <div class="stat-label">签到记录</div>
        </div>
        <div class="quick-stat-card purple">
          <div class="stat-num" style="color:#764ba2">{{stats.checkinCount || 0}}</div>
          <div class="stat-label">打卡任务</div>
        </div>
      </div>

      <div class="quick-stats" style="margin-top:-4px">
        <div class="quick-stat-card" style="border-left:4px solid #f56c6c">
          <div class="stat-num" style="color:#f56c6c">{{stats.commentCount || 0}}</div>
          <div class="stat-label">评论总数</div>
        </div>
        <div class="quick-stat-card" style="border-left:4px solid #409EFF">
          <div class="stat-num" style="color:#409EFF">{{stats.partnerCount || 0}}</div>
          <div class="stat-label">伙伴关系</div>
        </div>
        <div class="quick-stat-card" style="border-left:4px solid #ff9800">
          <div class="stat-num" style="color:#ff9800">{{stats.likeCount || 0}}</div>
          <div class="stat-label">点赞总数</div>
        </div>
        <div class="quick-stat-card" style="border-left:4px solid #9c27b0">
          <div class="stat-num" style="color:#9c27b0">{{stats.favCount || 0}}</div>
          <div class="stat-label">收藏总数</div>
        </div>
      </div>

      <el-row :gutter="20" style="margin-bottom:20px">
        <el-col :span="24">
          <el-card shadow="never" style="border-radius:12px">
            <template #header><strong>快捷操作</strong></template>
            <el-space wrap>
              <el-button type="primary" @click="goPage('checkins')"><el-icon><Calendar /></el-icon> 新增打卡任务</el-button>
              <el-button type="success" @click="goPage('news')"><el-icon><Bell /></el-icon> 发布资讯</el-button>
              <el-button type="warning" @click="goPage('export')"><el-icon><Download /></el-icon> 数据导出</el-button>
              <el-button @click="goPage('users')"><el-icon><User /></el-icon> 用户管理</el-button>
            </el-space>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-bottom:20px">
        <el-col :span="12">
          <el-card shadow="never" style="border-radius:12px">
            <template #header><strong>最新笔记</strong></template>
            <el-table :data="recentNotes" size="small" stripe>
              <el-table-column prop="title" label="标题" show-overflow-tooltip />
              <el-table-column prop="user_name" label="作者" width="80" />
              <el-table-column prop="created_at" label="时间" width="160" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" style="border-radius:12px">
            <template #header><strong>签到排行</strong></template>
            <el-table :data="signRank" size="small" stripe>
              <el-table-column type="index" label="#" width="50" />
              <el-table-column prop="user_name" label="用户" />
              <el-table-column prop="days" label="天数" width="80" />
              <el-table-column prop="total_duration" label="总时长(分)" width="100" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" style="border-radius:12px">
            <template #header><strong>最新用户</strong></template>
            <el-table :data="recentUsers" size="small" stripe>
              <el-table-column label="头像" width="60">
                <template #default="{row}">
                  <el-avatar :size="28" :src="row.avatar" style="background:#4A90D9">{{(row.nickname||'用')[0]}}</el-avatar>
                </template>
              </el-table-column>
              <el-table-column prop="nickname" label="昵称" />
              <el-table-column prop="created_at" label="注册时间" width="160" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" style="border-radius:12px">
            <template #header><strong>系统信息</strong></template>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="数据库大小">{{sysInfo.dbSize || '-'}}</el-descriptions-item>
              <el-descriptions-item label="Node版本">{{sysInfo.nodeVersion || '-'}}</el-descriptions-item>
              <el-descriptions-item label="运行时间">{{sysInfo.uptime || '-'}}</el-descriptions-item>
              <el-descriptions-item label="运行平台">{{sysInfo.platform || '-'}}</el-descriptions-item>
              <el-descriptions-item label="内存占用">{{sysInfo.memoryUsage || '-'}}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>
  `,
  data() { return { stats: {}, recentNotes: [], signRank: [], recentUsers: [], sysInfo: {} }; },
  async mounted() {
    const [s, n, r, u, sys] = await Promise.all([
      adminApi.get('/api/admin/stats'),
      adminApi.get('/api/admin/note_list?page=1&size=5'),
      adminApi.get('/api/sign/rank'),
      adminApi.get('/api/admin/recent_users'),
      adminApi.get('/api/admin/system_info'),
    ]);
    if (s.code === 200) this.stats = s.data;
    if (n.code === 200) this.recentNotes = n.data.list || [];
    if (r.code === 200) this.signRank = (r.data || []).slice(0, 10);
    if (u.code === 200) this.recentUsers = u.data || [];
    if (sys.code === 200) this.sysInfo = sys.data || {};
  },
  methods: {
    goPage(page) {
      const app = this.$root;
      if (app && app.currentPage !== undefined) app.currentPage = page;
    }
  }
};
