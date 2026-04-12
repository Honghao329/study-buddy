const SettingsPage = {
  components: { PageContainer },
  template: `
    <PageContainer title="系统设置">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><strong>当前管理员</strong></template>
            <el-descriptions :column="1" border v-if="adminInfo">
              <el-descriptions-item label="ID">{{adminInfo.id}}</el-descriptions-item>
              <el-descriptions-item label="用户名">{{adminInfo.username}}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{adminInfo.created_at || '-'}}</el-descriptions-item>
            </el-descriptions>
            <div v-else style="text-align:center;padding:20px;color:#9ca3af">加载中...</div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><strong>修改密码</strong></template>
            <el-form :model="pwdForm" label-width="100px" style="max-width:400px">
              <el-form-item label="原密码">
                <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
              </el-form-item>
              <el-form-item>
                <el-button :loading="saving" @click="changePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </PageContainer>
  `,
  data() { return { adminInfo: null, saving: false, pwdForm: { oldPassword: '', newPassword: '', confirmPassword: '' } }; },
  async mounted() {
    const res = await adminApi.get('/api/admin/admin_info');
    if (res.code === 200) this.adminInfo = res.data;
  },
  methods: {
    async changePassword() {
      if (!this.pwdForm.oldPassword) { ElementPlus.ElMessage.warning('请输入原密码'); return; }
      if (!this.pwdForm.newPassword) { ElementPlus.ElMessage.warning('请输入新密码'); return; }
      if (this.pwdForm.newPassword.length < 6) { ElementPlus.ElMessage.warning('新密码至少6位'); return; }
      if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) { ElementPlus.ElMessage.warning('两次密码不一致'); return; }
      this.saving = true;
      const res = await adminApi.post('/api/admin/change_password', {
        oldPassword: this.pwdForm.oldPassword,
        newPassword: this.pwdForm.newPassword
      });
      if (res.code === 200) {
        ElementPlus.ElMessage.success('密码修改成功，请重新登录');
        this.pwdForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_name');
          window.location.href = './login.html';
        }, 1500);
      } else {
        ElementPlus.ElMessage.error(res.msg || '修改失败');
      }
      this.saving = false;
    }
  }
};
