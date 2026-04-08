/**
 * 管理后台主应用
 */
if (!checkAuth()) throw new Error('未登录');

const app = Vue.createApp({
  data() {
    return {
      currentPage: 'dashboard',
      adminName: localStorage.getItem('admin_name') || 'admin',
    };
  },
  computed: {
    pageTitle() {
      return { dashboard:'数据概览', users:'用户管理', notes:'笔记管理', comments:'评论管理',
        checkins:'打卡管理', news:'资讯管理', signs:'签到数据', partners:'伙伴关系',
        export:'数据导出', settings:'系统设置' }[this.currentPage] || '';
    },
    currentComponent() {
      return { dashboard:'DashboardPage', users:'UsersPage', notes:'NotesPage', comments:'CommentsPage',
        checkins:'CheckinsPage', news:'NewsPage', signs:'SignsPage', partners:'PartnersPage',
        export:'ExportPage', settings:'SettingsPage' }[this.currentPage] || 'DashboardPage';
    }
  },
  methods: {
    changePage(index) { this.currentPage = index; },
    doLogout() {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_name');
      window.location.href = './login.html';
    }
  }
});

// 注册图标
for (const [k, c] of Object.entries(ElementPlusIconsVue)) app.component(k, c);

// 注册页面组件
app.component('PageContainer', PageContainer);
app.component('DashboardPage', DashboardPage);
app.component('UsersPage', UsersPage);
app.component('NotesPage', NotesPage);
app.component('CommentsPage', CommentsPage);
app.component('CheckinsPage', CheckinsPage);
app.component('NewsPage', NewsPage);
app.component('SignsPage', SignsPage);
app.component('PartnersPage', PartnersPage);
app.component('ExportPage', ExportPage);
app.component('SettingsPage', SettingsPage);

app.use(ElementPlus);
app.mount('#app');
