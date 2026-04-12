const DashboardPage = {
  template: `
    <div>
      <!-- Greeting -->
      <div style="margin-bottom:20px">
        <h3 style="font-size:18px;font-weight:500;color:var(--gray-900);margin-bottom:2px">{{greeting}}，{{adminName}} 👋</h3>
        <p style="font-size:13px;color:var(--gray-500)">以下是学习伴侣平台的运营数据</p>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card" v-for="(s,i) in statCards" :key="s.key">
          <div class="stat-card-icon" :class="'c'+ ((i%5)+1)">
            <el-icon :size="20"><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-num">{{stats[s.key] || 0}}</div>
            <div class="stat-card-label">{{s.label}}</div>
          </div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <el-row :gutter="14" style="margin-bottom:14px">
        <el-col :span="16">
          <div class="chart-card">
            <div class="chart-card-header">
              <h4>签到趋势</h4>
              <el-radio-group v-model="trendDays" size="small" @change="loadSignTrend">
                <el-radio-button :value="7">7天</el-radio-button>
                <el-radio-button :value="14">14天</el-radio-button>
                <el-radio-button :value="30">30天</el-radio-button>
              </el-radio-group>
            </div>
            <div class="chart-card-body"><canvas ref="signChart" height="240"></canvas></div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="chart-card">
            <div class="chart-card-header"><h4>笔记可见性</h4></div>
            <div class="chart-card-body" style="display:flex;align-items:center;justify-content:center">
              <canvas ref="visChart" height="240"></canvas>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- Charts Row 2 -->
      <el-row :gutter="14" style="margin-bottom:14px">
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-card-header"><h4>用户注册趋势</h4></div>
            <div class="chart-card-body"><canvas ref="userChart" height="220"></canvas></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-card-header"><h4>签到时段分布</h4></div>
            <div class="chart-card-body"><canvas ref="hourChart" height="220"></canvas></div>
          </div>
        </el-col>
      </el-row>

      <!-- Quick Actions -->
      <div class="action-grid" style="margin-bottom:20px">
        <div class="action-item" v-for="a in actions" :key="a.page" @click="goPage(a.page)">
          <el-icon><component :is="a.icon" /></el-icon>
          <span>{{a.label}}</span>
        </div>
      </div>

      <!-- Bottom Row -->
      <el-row :gutter="14" style="margin-bottom:14px">
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-card-header"><h4>热门笔记 TOP 8</h4></div>
            <div class="chart-card-body"><canvas ref="topNotesChart" height="200"></canvas></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-card-header"><h4>签到排行</h4></div>
            <div class="chart-card-body" style="padding:8px 20px 16px">
              <el-table :data="signRank" size="small">
                <el-table-column type="index" label="#" width="40" />
                <el-table-column label="用户">
                  <template #default="{row}">
                    <div style="display:flex;align-items:center;gap:8px">
                      <el-avatar :size="24" :src="row.user_pic" style="background:#4091f7">{{(row.user_name||'学')[0]}}</el-avatar>
                      <span style="font-size:13px">{{row.user_name||'匿名'}}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="days" label="天数" width="60" />
                <el-table-column label="时长" width="80">
                  <template #default="{row}"><span style="font-size:13px">{{row.total_duration||0}}分</span></template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-card-header"><h4>最新笔记</h4></div>
            <div class="chart-card-body" style="padding:8px 20px 16px">
              <el-table :data="recentNotes" size="small">
                <el-table-column prop="title" label="标题" show-overflow-tooltip />
                <el-table-column prop="user_name" label="作者" width="80" />
                <el-table-column label="时间" width="140">
                  <template #default="{row}"><span style="font-size:12px;color:var(--gray-500)">{{fmtTime(row.created_at)}}</span></template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-card-header"><h4>系统信息</h4></div>
            <div class="chart-card-body" style="padding:8px 20px 16px">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="数据库">{{sysInfo.dbSize || '-'}}</el-descriptions-item>
                <el-descriptions-item label="Node">{{sysInfo.nodeVersion || '-'}}</el-descriptions-item>
                <el-descriptions-item label="运行时间">{{sysInfo.uptime || '-'}}</el-descriptions-item>
                <el-descriptions-item label="平台">{{sysInfo.platform || '-'}}</el-descriptions-item>
                <el-descriptions-item label="内存">{{sysInfo.memoryUsage || '-'}}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  `,
  data() {
    return {
      stats: {}, recentNotes: [], signRank: [], sysInfo: {},
      trendDays: 14, charts: {},
      adminName: localStorage.getItem('admin_name') || 'admin',
      statCards: [
        { key: 'userCount', label: '注册用户', icon: 'User' },
        { key: 'noteCount', label: '笔记总数', icon: 'Document' },
        { key: 'signCount', label: '签到记录', icon: 'TrendCharts' },
        { key: 'checkinCount', label: '打卡任务', icon: 'Calendar' },
        { key: 'commentCount', label: '评论总数', icon: 'ChatDotRound' },
        { key: 'partnerCount', label: '伙伴关系', icon: 'Connection' },
        { key: 'likeCount', label: '点赞总数', icon: 'Star' },
        { key: 'favCount', label: '收藏总数', icon: 'CollectionTag' },
      ],
      actions: [
        { page: 'checkins', icon: 'Calendar', label: '新增打卡任务' },
        { page: 'news', icon: 'Bell', label: '发布资讯' },
        { page: 'export', icon: 'Download', label: '数据导出' },
        { page: 'users', icon: 'User', label: '用户管理' },
      ]
    };
  },
  computed: {
    greeting() {
      const h = new Date().getHours();
      return h < 6 ? '夜深了' : h < 12 ? '上午好' : h < 18 ? '下午好' : '晚上好';
    }
  },
  async mounted() {
    const [s, n, r, sys] = await Promise.all([
      adminApi.get('/api/admin/stats'),
      adminApi.get('/api/admin/note_list?page=1&size=5'),
      adminApi.get('/api/sign/rank'),
      adminApi.get('/api/admin/system_info'),
    ]);
    if (s.code === 200) this.stats = s.data;
    if (n.code === 200) this.recentNotes = n.data.list || [];
    if (r.code === 200) this.signRank = (r.data || []).slice(0, 8);
    if (sys.code === 200) this.sysInfo = sys.data || {};
    this.$nextTick(() => {
      this.loadSignTrend(); this.loadVisChart();
      this.loadUserTrend(); this.loadHourlyChart(); this.loadTopNotes();
    });
  },
  beforeUnmount() { Object.values(this.charts).forEach(c => c && c.destroy()); },
  methods: {
    fmtTime(t) { return t ? t.replace('T', ' ').slice(0, 16) : '-'; },
    goPage(p) { if (this.$root) this.$root.currentPage = p; },
    fillGaps(rows, days) {
      const m = {}; rows.forEach(r => m[r.day] = r.cnt);
      const labels = [], data = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        labels.push(k.slice(5)); data.push(m[k] || 0);
      }
      return { labels, data };
    },
    chartFont() { return { family: "-apple-system, 'PingFang SC', sans-serif", size: 11 }; },

    async loadSignTrend() {
      const res = await adminApi.get('/api/admin/chart/sign_trend?days=' + this.trendDays);
      if (res.code !== 200) return;
      const { labels, data } = this.fillGaps(res.data, this.trendDays);
      if (this.charts.sign) this.charts.sign.destroy();
      this.charts.sign = new Chart(this.$refs.signChart, {
        type: 'line',
        data: { labels, datasets: [{
          label: '签到人次', data,
          borderColor: '#4091f7', backgroundColor: 'rgba(64,145,247,0.06)',
          fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
          pointBackgroundColor: '#4091f7', pointBorderColor: '#fff', pointBorderWidth: 2,
        }] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: this.chartFont(), color: '#949eb7' } },
            y: { beginAtZero: true, grid: { color: '#f2f4f5' }, ticks: { font: this.chartFont(), color: '#949eb7', stepSize: 1 } }
          }
        }
      });
    },

    async loadUserTrend() {
      const res = await adminApi.get('/api/admin/chart/user_trend?days=14');
      if (res.code !== 200) return;
      const { labels, data } = this.fillGaps(res.data, 14);
      this.charts.user = new Chart(this.$refs.userChart, {
        type: 'bar',
        data: { labels, datasets: [{
          label: '新增用户', data,
          backgroundColor: 'rgba(64,145,247,0.6)', hoverBackgroundColor: '#4091f7',
          borderRadius: 4, barThickness: 16,
        }] },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: this.chartFont(), color: '#949eb7' } },
            y: { beginAtZero: true, grid: { color: '#f2f4f5' }, ticks: { font: this.chartFont(), color: '#949eb7', stepSize: 1 } }
          }
        }
      });
    },

    async loadVisChart() {
      const res = await adminApi.get('/api/admin/chart/note_visibility');
      if (res.code !== 200) return;
      const map = { public: '公开', private: '私密', partner: '伙伴可见' };
      this.charts.vis = new Chart(this.$refs.visChart, {
        type: 'doughnut',
        data: {
          labels: res.data.map(r => map[r.visibility] || r.visibility),
          datasets: [{ data: res.data.map(r => r.cnt), backgroundColor: ['#4091f7', '#22c55e', '#f59e0b'], borderWidth: 0, spacing: 2 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } } }
        }
      });
    },

    async loadHourlyChart() {
      const res = await adminApi.get('/api/admin/chart/hourly_activity');
      if (res.code !== 200) return;
      const hm = {}; res.data.forEach(r => hm[r.hour] = r.cnt);
      const labels = [], data = [];
      for (let h = 0; h < 24; h++) { labels.push(h + '时'); data.push(hm[h] || 0); }
      this.charts.hour = new Chart(this.$refs.hourChart, {
        type: 'bar',
        data: { labels, datasets: [{
          data,
          backgroundColor: data.map((_, i) => (i >= 7 && i <= 9) || (i >= 19 && i <= 22) ? 'rgba(64,145,247,0.7)' : 'rgba(64,145,247,0.15)'),
          borderRadius: 3, barThickness: 8,
        }] },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#949eb7', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
            y: { beginAtZero: true, grid: { color: '#f2f4f5' }, ticks: { font: this.chartFont(), color: '#949eb7' } }
          }
        }
      });
    },

    async loadTopNotes() {
      const res = await adminApi.get('/api/admin/chart/top_notes');
      if (res.code !== 200) return;
      const labels = res.data.map(r => r.title.length > 8 ? r.title.slice(0, 8) + '…' : r.title);
      this.charts.topNotes = new Chart(this.$refs.topNotesChart, {
        type: 'bar',
        data: { labels, datasets: [
          { label: '浏览', data: res.data.map(r => r.view_cnt || 0), backgroundColor: 'rgba(64,145,247,0.6)', borderRadius: 3, barThickness: 12 },
          { label: '点赞', data: res.data.map(r => r.like_cnt || 0), backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 3, barThickness: 12 },
          { label: '评论', data: res.data.map(r => r.comment_cnt || 0), backgroundColor: 'rgba(245,158,11,0.6)', borderRadius: 3, barThickness: 12 },
        ] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, padding: 12, usePointStyle: true, pointStyle: 'rectRounded', font: { size: 11 } } } },
          scales: {
            x: { grid: { color: '#f2f4f5' }, ticks: { font: this.chartFont(), color: '#949eb7' } },
            y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#4d5875' } }
          }
        }
      });
    }
  }
};
