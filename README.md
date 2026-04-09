# 学习伴侣系统（Study Buddy）

基于微信小程序 + Node.js + SQLite 的学习伴侣系统。

## 功能特性

- 用户管理：昵称密码注册/登录、个人资料编辑、头像上传
- 笔记管理：发布/编辑/删除笔记，支持公开/私密/伙伴可见
- 学习签到：每日签到、日历视图、连续签到统计、排行榜
- 打卡任务：创建/参与打卡、填写学习内容、伙伴监督评价
- 学习伙伴：搜索添加伙伴、接受/拒绝邀请、查看伙伴主页
- 社区动态：公开笔记浏览、点赞评论收藏、用户主页
- 消息通知：点赞/评论/伙伴邀请/催打卡提醒
- 后台管理：用户/笔记/评论/打卡/伙伴/签到全面管理、数据导出

## 技术栈

- **前端**：微信小程序原生开发 + Vant Weapp UI
- **后端**：Node.js + Express
- **数据库**：SQLite（better-sqlite3）
- **认证**：JWT
- **管理后台**：Vue3 + Element Plus（CDN）

## 快速启动

### 1. 安装依赖

```bash
cd study-buddy/server
npm install
```

### 2. 启动后端

```bash
node app.js
# 服务运行在 http://localhost:3900
```

### 3. 配置小程序

修改 `miniprogram/utils/config.js` 中的 `DEFAULT_BASE_URL`：

```javascript
// 本地开发（默认值）
const DEFAULT_BASE_URL = 'http://127.0.0.1:3900';

// 真机测试时改为电脑局域网 IP
const DEFAULT_BASE_URL = 'http://192.168.x.x:3900';
```

也可以在小程序 Storage 中设置 `api_base_url` 或在 `app.js` globalData 中设置 `apiBaseUrl`。

### 4. 微信开发者工具

- 导入 `miniprogram` 目录
- 关闭「不校验合法域名」（开发阶段开启）
- 构建 npm（工具 → 构建 npm）

### 5. 管理后台

浏览器访问 `http://localhost:3900/admin/`

首次启动会自动创建管理员（admin / 环境变量 `ADMIN_PASSWORD` 或默认 123456），控制台会打印初始密码，**请立即登录后台修改**。

## 环境变量（可选）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 3900 |
| `JWT_SECRET` | JWT 密钥 | **生产环境必须设置**，开发环境自动衍生 |
| `ADMIN_PASSWORD` | 初始管理员密码 | 123456（仅首次创建时生效） |
| `DB_PATH` | 数据库路径 | server/data/study_buddy.db |

## 项目结构

```
study-buddy/
├── server/                 # Node.js 后端
│   ├── app.js             # 入口文件
│   ├── config/db.js       # 数据库配置
│   ├── middleware/auth.js  # 认证中间件
│   ├── routes/            # API 路由
│   ├── lib/               # 工具模块
│   ├── admin/             # Web 管理后台
│   └── data/              # SQLite 数据文件
├── miniprogram/            # 微信小程序前端
│   ├── pages/             # 页面目录
│   ├── utils/             # 工具函数
│   └── app.json           # 小程序配置
└── README.md
```
