/**
 * 通用页面容器组件
 */
const PageContainer = {
  props: { title: String, showAdd: Boolean, addText: { type: String, default: '新增' } },
  emits: ['add'],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h3>{{title}}</h3>
        <el-button v-if="showAdd" type="primary" @click="$emit('add')">
          <el-icon><Plus /></el-icon> {{addText}}
        </el-button>
      </div>
      <el-card shadow="never" style="border-radius:12px">
        <slot></slot>
      </el-card>
    </div>
  `
};
