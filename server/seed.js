/**
 * 测试数据填充脚本
 * 运行: node seed.js
 * 会创建测试用户、笔记、打卡、签到、评论等数据
 */
const db = require('./config/db');
const { getLocalDateString } = require('./lib/date');
const { hashPwd } = require('./lib/hash');

const hash = hashPwd('123456');

// 清空旧数据（可选）
const CLEAN = process.argv.includes('--clean');
if (CLEAN) {
  console.log('🧹 清空旧数据...');
  ['checkin_records', 'signs', 'comments', 'likes', 'favorites', 'partners', 'notes', 'checkins', 'messages', 'users'].forEach(t => {
    db.prepare(`DELETE FROM ${t}`).run();
  });
}

// ===== 用户 =====
const users = [
  { username: 'zhangsan', nickname: '张同学', bio: '计算机科学与技术大四，正在准备毕业设计' },
  { username: 'lixuejie', nickname: '李学姐', bio: '软件工程研一，研究方向：自然语言处理' },
  { username: 'wangxm',   nickname: '王小明', bio: '数学系大三，热爱编程和算法竞赛' },
  { username: 'liusisi',  nickname: '刘思思', bio: '信息安全专业，目标是成为安全工程师' },
  { username: 'chendp',   nickname: '陈大鹏', bio: '人工智能方向，正在学习深度学习框架' },
  { username: 'zhaoxm',   nickname: '赵雪梅', bio: '数据科学专业，喜欢数据可视化' },
];

const userIds = [];
for (const u of users) {
  const openid = 'test_' + u.username;
  const existing = db.prepare('SELECT id FROM users WHERE openid = ?').get(openid);
  if (existing) {
    userIds.push(existing.id);
    continue;
  }
  const r = db.prepare('INSERT INTO users (openid, username, nickname, password, bio) VALUES (?, ?, ?, ?, ?)').run(openid, u.username, u.nickname, hash, u.bio);
  userIds.push(r.lastInsertRowid);
}
console.log(`✅ ${userIds.length} 个用户就绪 (密码: 123456)`);

// ===== 笔记 =====
const noteData = [
  { title: '操作系统复习笔记：进程与线程', content: '进程是程序的一次执行过程，是系统进行资源分配和调度的基本单位。线程是进程中的一个执行单元，是CPU调度的基本单位。\n\n进程和线程的区别：\n1. 进程有独立的地址空间，线程共享进程的地址空间\n2. 进程切换开销大，线程切换开销小\n3. 进程之间通信需要IPC机制，线程之间可以直接读写共享数据', visibility: 'public' },
  { title: '数据结构：红黑树详解', content: '红黑树是一种自平衡二叉搜索树，具有以下性质：\n1. 每个节点是红色或黑色\n2. 根节点是黑色\n3. 叶子节点（NIL）是黑色\n4. 红色节点的两个子节点都是黑色\n5. 从根到叶子的所有路径包含相同数量的黑色节点\n\n插入和删除操作通过旋转和重新着色来维持平衡。', visibility: 'public' },
  { title: 'Spring Boot学习心得', content: '今天学习了Spring Boot的自动配置原理：\n\n@SpringBootApplication 注解包含了三个关键注解：\n- @SpringBootConfiguration：标识这是一个配置类\n- @EnableAutoConfiguration：开启自动配置\n- @ComponentScan：组件扫描\n\n自动配置的核心是spring.factories文件中注册的AutoConfiguration类。', visibility: 'public' },
  { title: '算法竞赛技巧：动态规划入门', content: '动态规划的关键要素：\n1. 最优子结构\n2. 重叠子问题\n3. 状态转移方程\n\n经典问题：背包问题、最长公共子序列、编辑距离等。解题步骤：定义状态→推导转移方程→确定边界条件→代码实现。', visibility: 'public' },
  { title: '机器学习期末复习提纲', content: '重点内容：\n- 线性回归与逻辑回归\n- 决策树与随机森林\n- SVM支持向量机\n- K-means聚类\n- 神经网络基础\n- 交叉验证与模型评估\n\n复习策略：先理解算法原理，再手推公式，最后用sklearn实战。', visibility: 'public' },
  { title: '我的毕业设计进度记录', content: '本周完成了：\n1. 需求分析文档\n2. 数据库表设计\n3. 后端API搭建\n\n下周计划：\n1. 完成前端页面开发\n2. 接入API联调\n3. 开始写论文第三章', visibility: 'partner' },
  { title: 'Python爬虫实战笔记', content: '使用requests + BeautifulSoup爬取网页数据的基本流程：\n1. 发送HTTP请求获取页面\n2. 解析HTML提取数据\n3. 数据存储\n\n注意事项：遵守robots.txt，设置合理的请求间隔，使用代理池避免被封IP。', visibility: 'public' },
  { title: 'Git工作流最佳实践', content: 'Git Flow工作流：\n- master: 稳定发布分支\n- develop: 开发分支\n- feature/*: 功能分支\n- release/*: 预发布分支\n- hotfix/*: 紧急修复分支\n\n常用命令备忘：git rebase, git cherry-pick, git stash', visibility: 'public' },
];

const noteIds = [];
for (let i = 0; i < noteData.length; i++) {
  const n = noteData[i];
  const userId = userIds[i % userIds.length];
  const existing = db.prepare('SELECT id FROM notes WHERE title = ?').get(n.title);
  if (existing) {
    noteIds.push(existing.id);
    continue;
  }
  const r = db.prepare('INSERT INTO notes (user_id, title, content, visibility) VALUES (?, ?, ?, ?)').run(userId, n.title, n.content, n.visibility);
  noteIds.push(r.lastInsertRowid);
}
console.log(`✅ ${noteIds.length} 篇笔记就绪`);

// ===== 评论 =====
const commentData = [
  '写得很详细，收藏了！',
  '这个知识点我之前一直搞不清楚，看了你的笔记终于明白了',
  '补充一下：还可以参考《算法导论》第13章的内容',
  '大佬写得太好了，期末考试稳了',
  '请问这个例题有没有更简单的解法？',
  '同专业，一起加油！',
  '笔记格式很清晰，学习了',
  '这个总结太及时了，正好在复习这部分',
  '感谢分享，已收藏',
  '有没有相关的参考书推荐？',
  '代码部分可以再详细一些吗',
  '赞！条理很清楚',
];

let commentCount = 0;
for (const noteId of noteIds) {
  // 每个笔记添加 2-5 条评论
  const numComments = 2 + Math.floor(Math.random() * 4);
  for (let j = 0; j < numComments; j++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const content = commentData[Math.floor(Math.random() * commentData.length)];
    try {
      db.prepare('INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)').run(noteId, userId, content);
      commentCount++;
    } catch {}
  }
  // Update comment_cnt to match actual count
  const actualCount = db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE note_id = ? AND status = 1').get(noteId).cnt;
  db.prepare('UPDATE notes SET comment_cnt = ? WHERE id = ?').run(actualCount, noteId);
}
console.log(`✅ ${commentCount} 条评论就绪`);

// ===== 点赞 =====
let likeCount = 0;
for (const noteId of noteIds) {
  const numLikes = 1 + Math.floor(Math.random() * 5);
  const shuffled = [...userIds].sort(() => Math.random() - 0.5);
  for (let j = 0; j < Math.min(numLikes, shuffled.length); j++) {
    try {
      db.prepare('INSERT INTO likes (user_id, target_id, target_type) VALUES (?, ?, ?)').run(shuffled[j], noteId, 'note');
      likeCount++;
    } catch {}
  }
  const actualLikes = db.prepare('SELECT COUNT(*) as cnt FROM likes WHERE target_id = ? AND target_type = ?').get(noteId, 'note').cnt;
  db.prepare('UPDATE notes SET like_cnt = ? WHERE id = ?').run(actualLikes, noteId);
}
console.log(`✅ ${likeCount} 个点赞就绪`);

// ===== 打卡任务 =====
const checkinData = [
  { title: '每日算法一题', description: '每天刷一道LeetCode题目，坚持30天' },
  { title: '英语单词打卡', description: '每天背50个考研英语单词' },
  { title: '毕设进度打卡', description: '记录毕业设计每日进度，互相监督' },
  { title: '晨跑打卡', description: '每天早起跑步3公里，锻炼身体' },
  { title: '论文阅读打卡', description: '每天阅读一篇专业方向论文并写总结' },
];

const checkinIds = [];
for (let i = 0; i < checkinData.length; i++) {
  const c = checkinData[i];
  const existing = db.prepare('SELECT id FROM checkins WHERE title = ?').get(c.title);
  if (existing) {
    checkinIds.push(existing.id);
    continue;
  }
  const r = db.prepare('INSERT INTO checkins (title, description, creator_id) VALUES (?, ?, ?)').run(c.title, c.description, userIds[i % userIds.length]);
  checkinIds.push(r.lastInsertRowid);
}
console.log(`✅ ${checkinIds.length} 个打卡任务就绪`);

// ===== 打卡记录 =====
const checkinContents = [
  '今天完成了LeetCode第215题，用了快速选择算法',
  '背完50个单词，还复习了昨天的生词',
  '完成了登录模块的前后端联调',
  '今天跑了3.5公里，状态不错',
  '阅读了一篇关于Transformer的论文',
  '刷了两道动态规划的题目',
  '整理了数据库设计文档',
  '今天学习了BERT模型的原理',
  '完成了系统测试用例的编写',
  '复习了操作系统的死锁部分',
];

let recordCount = 0;
const today = new Date();
for (const checkinId of checkinIds) {
  // 给每个任务添加多条打卡记录
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    const day = d.toISOString().slice(0, 10);
    const numRecords = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numRecords; j++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const content = checkinContents[Math.floor(Math.random() * checkinContents.length)];
      try {
        db.prepare('INSERT INTO checkin_records (checkin_id, user_id, day, content) VALUES (?, ?, ?, ?)').run(checkinId, userId, day, content);
        recordCount++;
      } catch {}
    }
  }
  // Update join_cnt
  const cnt = db.prepare('SELECT COUNT(DISTINCT user_id) as cnt FROM checkin_records WHERE checkin_id = ?').get(checkinId).cnt;
  db.prepare('UPDATE checkins SET join_cnt = ? WHERE id = ?').run(cnt, checkinId);
}
console.log(`✅ ${recordCount} 条打卡记录就绪`);

// ===== 设置监督人（第一个打卡任务） =====
if (checkinIds.length >= 1 && userIds.length >= 2) {
  db.prepare('UPDATE checkins SET supervisor_id = ?, supervisor_name = ? WHERE id = ?')
    .run(userIds[1], users[1].nickname, checkinIds[0]);
  console.log(`✅ 打卡任务 "${checkinData[0].title}" 设置监督人: ${users[1].nickname}`);
}

// ===== 签到记录（用于排行榜） =====
let signCount = 0;
for (let i = 0; i < userIds.length; i++) {
  const numDays = 3 + Math.floor(Math.random() * 15);
  for (let d = 0; d < numDays; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const day = date.toISOString().slice(0, 10);
    const duration = 15 + Math.floor(Math.random() * 120);
    try {
      db.prepare('INSERT INTO signs (user_id, day, duration, status) VALUES (?, ?, ?, ?)').run(userIds[i], day, duration, 'normal');
      signCount++;
    } catch {}
  }
}
console.log(`✅ ${signCount} 条签到记录就绪`);

// ===== 学伴关系 =====
let partnerCount = 0;
const partnerPairs = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [0, 4]];
for (const [a, b] of partnerPairs) {
  const existing = db.prepare('SELECT id FROM partners WHERE user_id = ? AND target_id = ?').get(userIds[a], userIds[b]);
  if (existing) { partnerCount++; continue; }
  try {
    db.prepare('INSERT INTO partners (user_id, target_id, status) VALUES (?, ?, 1)').run(userIds[a], userIds[b]);
    partnerCount++;
  } catch {}
}
console.log(`✅ ${partnerCount} 对学伴关系就绪`);

console.log('\n🎉 测试数据填充完毕！所有用户密码: 123456');
console.log('用户列表:', users.map(u => u.nickname).join(', '));
