# 学习伴侣系统（Study Buddy）

哈尔滨理工大学毕业设计 — 基于微信小程序 + H5 + Node.js 的学习伴侣系统。

## 功能特性

- **用户管理**：昵称密码注册/登录、个人资料编辑、头像上传
- **笔记管理**：发布/编辑/删除笔记，支持三级可见性（公开/私密/学伴可见）
- **学习签到**：每日签到、日历视图、连续签到统计、排行榜
- **打卡任务**：创建/参与打卡、填写学习内容、邀请学伴监督、监督人点评
- **学习伙伴**：搜索发现用户、添加学伴、接受/拒绝邀请、查看学伴主页
- **社区动态**：公开笔记浏览（热门/最新）、点赞评论收藏
- **消息通知**：点赞/评论/学伴邀请/打卡邀请/催打卡提醒，点击跳转对应内容
- **后台管理**：用户/笔记/评论/打卡/学伴/签到全面管理、数据统计

## 技术栈

| 层级 | 技术 |
|------|------|
| **H5 前端** | Vite + React 18 + TypeScript + Tailwind CSS (CDN) + React Router + Axios |
| **小程序壳** | 原生微信小程序 + `<web-view>` 组件加载 H5 |
| **后端** | Node.js + Express + better-sqlite3 + JWT |
| **管理后台** | Vue 3 + Element Plus (CDN)，内嵌在后端 |
| **图标** | lucide-react |

## 项目结构

```
study-buddy/
├── server/                 # Node.js 后端
│   ├── app.js             # 入口文件
│   ├── config/db.js       # 数据库配置与建表
│   ├── middleware/auth.js  # JWT 认证中间件
│   ├── routes/            # API 路由
│   │   ├── user.js        # 用户：登录/注册/资料
│   │   ├── note.js        # 笔记：CRUD/列表/详情
│   │   ├── comment.js     # 评论：发表/列表/删除
│   │   ├── like.js        # 点赞：切换/批量查询
│   │   ├── fav.js         # 收藏：切换/列表
│   │   ├── checkin.js     # 打卡：任务/记录/监督
│   │   ├── sign.js        # 签到：日签/日历/排行榜
│   │   ├── partner.js     # 学伴：邀请/接受/列表
│   │   ├── message.js     # 消息：列表/已读/催打卡
│   │   ├── upload.js      # 文件上传
│   │   └── admin.js       # 管理后台 API
│   ├── lib/               # 工具模块
│   ├── admin/             # Web 管理后台（Vue3+ElementPlus）
│   ├── seed.js            # 测试数据填充脚本
│   └── data/              # SQLite 数据文件
├── h5-app/                 # H5 前端（Vite + React + Tailwind）
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── Home.tsx       # 首页（签到/快捷功能/笔记/排行/学伴）
│   │   │   ├── Login.tsx      # 登录页
│   │   │   ├── Community.tsx  # 社区（热门/最新笔记列表）
│   │   │   ├── NoteDetail.tsx # 笔记详情（点赞/收藏/评论）
│   │   │   ├── NoteAdd.tsx    # 发布/编辑笔记
│   │   │   ├── CheckinList.tsx # 打卡任务列表
│   │   │   ├── CheckinDetail.tsx # 打卡详情（监督/记录/邀请）
│   │   │   ├── Sign.tsx       # 签到日历
│   │   │   ├── Partner.tsx    # 学伴（我的/待处理/发现）
│   │   │   ├── My.tsx         # 个人中心
│   │   │   ├── MyNotes.tsx    # 我的笔记（编辑/删除）
│   │   │   ├── Favorite.tsx   # 我的收藏
│   │   │   ├── Messages.tsx   # 消息通知
│   │   │   └── UserProfile.tsx # 用户主页
│   │   ├── components/
│   │   │   └── TabBar.tsx     # 底部导航栏
│   │   └── api/request.ts     # Axios 封装
│   └── vite.config.ts
├── webview-app/            # 微信小程序壳（web-view）
│   ├── pages/index/       # 主页面，加载 H5
│   └── app.json
└── docs/                   # 设计文档
```

## 快速启动

### 1. 安装依赖

```bash
cd study-buddy/server && npm install
cd ../h5-app && npm install
```

### 2. 启动后端

```bash
cd server
node app.js
# 服务运行在 http://localhost:3900
# 管理后台：http://localhost:3900/admin/
```

### 3. 填充测试数据（可选）

```bash
cd server
node seed.js          # 追加测试数据
node seed.js --clean  # 清空后重新填充
```

### 4. 启动 H5 前端

```bash
cd h5-app
npx vite
# 开发服务器：http://localhost:8888
# API 代理已配置到 http://127.0.0.1:3900
```

### 5. 小程序壳（可选）

用微信开发者工具打开 `webview-app` 目录，`web-view` 会加载 H5 页面。需要用真实微信账号登录开发者工具（不能用游客模式）。

## 账号密码

### 管理后台

访问地址：`http://localhost:3900/admin/`

| 项目 | 值 |
|------|------|
| 账号 | `admin` |
| 密码 | `123456` |

> 首次启动时自动创建。可通过环境变量 `ADMIN_PASSWORD` 指定初始密码。

### H5 前端 / 小程序用户

**测试用户（seed.js 生成，密码统一 `123456`）：**

| 账号 | 密码 | 昵称 | 角色/说明 |
|------|------|------|----------|
| zhangsan | `123456` | 张同学 | 计算机大四，有笔记和打卡数据 |
| lixuejie | `123456` | 李学姐 | 软件工程研一，是「每日算法一题」的监督人 |
| wangxm | `123456` | 王小明 | 数学系大三，签到排行榜第一 |
| liusisi | `123456` | 刘思思 | 信息安全专业 |
| chendp | `123456` | 陈大鹏 | 人工智能方向 |
| zhaoxm | `123456` | 赵雪梅 | 数据科学专业 |

**学伴关系（已通过 seed 建立）：**
- 张同学 ↔ 李学姐、王小明、陈大鹏
- 李学姐 ↔ 刘思思
- 王小明 ↔ 陈大鹏
- 刘思思 ↔ 赵雪梅

**打卡任务：**
- 每日算法一题（张同学创建，李学姐监督）
- 英语单词打卡、毕设进度打卡、晨跑打卡、论文阅读打卡

> **注册新用户**：输入一个不存在的账号 + 任意密码（≥4位），自动注册并登录。昵称默认等于账号，登录后可在个人设置中修改昵称。
>
> **切换用户测试**：在「我的」页面退出登录，用另一个账号+密码重新登录。

### 测试流程建议

1. 用 `zhangsan` 登录 → 查看首页（签到排行/学伴/笔记）→ 去打卡 → 查看监督关系
2. 用 `lixuejie` 登录 → 查看消息（学伴邀请/打卡邀请）→ 去「每日算法一题」点评打卡记录
3. 用 `wangxm` 登录 → 发现页添加新学伴 → 写笔记 → 在社区查看
4. 在两个账号间测试：添加学伴 → 对方接受 → 互相可见学伴可见笔记

## 环境变量（可选）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 3900 |
| `JWT_SECRET` | JWT 密钥 | 开发环境自动衍生，**生产环境必须设置** |
| `ADMIN_PASSWORD` | 初始管理员密码 | 123456（仅首次创建时生效） |
| `DB_PATH` | 数据库路径 | server/data/study_buddy.db |

## API 概览

所有接口以 `/api` 为前缀，需要认证的接口在 Header 中传 `Authorization: Bearer <token>`。

| 模块 | 主要接口 |
|------|---------|
| 用户 | `POST /user/login` · `GET /user/info` · `PUT /user/update` |
| 笔记 | `GET /note/public_list` · `GET /note/detail/:id` · `POST /note/create` · `PUT /note/update/:id` |
| 评论 | `GET /comment/list` · `POST /comment/create` · `DELETE /comment/delete/:id` |
| 点赞 | `POST /like/toggle` · `GET /like/check` |
| 收藏 | `POST /fav/toggle` · `GET /fav/my_list` |
| 打卡 | `GET /checkin/list` · `POST /checkin/join` · `POST /checkin/invite_supervisor` · `POST /checkin/invite_join` |
| 签到 | `POST /sign/do` · `GET /sign/stats` · `GET /sign/calendar` · `GET /sign/leaderboard` |
| 学伴 | `POST /partner/invite` · `POST /partner/accept` · `GET /partner/my_list` |
| 消息 | `GET /message/list` · `GET /message/unread_count` · `POST /message/read` |
