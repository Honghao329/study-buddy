const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT || 3900);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 路由
app.use('/api/user', require('./routes/user'));
app.use('/api/note', require('./routes/note'));
app.use('/api/like', require('./routes/like'));
app.use('/api/comment', require('./routes/comment'));
app.use('/api/partner', require('./routes/partner'));
app.use('/api/sign', require('./routes/sign'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/news', require('./routes/news'));
app.use('/api/fav', require('./routes/fav'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/plan', require('./routes/plan'));
app.use('/api/message', require('./routes/message'));
app.use('/api/admin', require('./routes/admin'));

// 首页配置接口（兼容原框架）
app.get('/api/home/setup', (req, res) => {
	res.json({ code: 200, data: { name: '学习伴侣系统', version: '1.0.0', about: [] } });
});

// 首页推荐列表
app.get('/api/home/list', (req, res) => {
	// 一次查出所有活跃任务（最多不超过几十条），在内存中排序分组
	const all = db.prepare('SELECT * FROM checkins WHERE status = 1 ORDER BY created_at DESC LIMIT 20').all();
	const hotList = [...all].sort((a, b) => (b.join_cnt || 0) - (a.join_cnt || 0)).slice(0, 10);
	res.json({ code: 200, data: { checkins: all, hotList } });
});

// 最新动态（首页用）
app.get('/api/home/activity', (req, res) => {
	const activities = [];
	const signs = db.prepare(
		`SELECT s.day, s.content, s.duration, u.nickname, u.avatar FROM signs s
		 LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 5`
	).all();
	signs.forEach(s => activities.push({
		type: 'sign', icon: 'clock-o', color: '#FF9800',
		text: (s.nickname || '学习者') + ' 完成了签到' + (s.duration ? '（' + s.duration + '分钟）' : ''),
		time: s.day, avatar: s.avatar || '',
	}));
	const records = db.prepare(
		`SELECT cr.day, cr.content, u.nickname, u.avatar, c.title FROM checkin_records cr
		 LEFT JOIN users u ON cr.user_id = u.id LEFT JOIN checkins c ON cr.checkin_id = c.id
		 ORDER BY cr.created_at DESC LIMIT 5`
	).all();
	records.forEach(r => activities.push({
		type: 'checkin', icon: 'todo-list-o', color: '#4A90D9',
		text: (r.nickname || '学习者') + ' 打卡了「' + (r.title || '') + '」',
		time: r.day, avatar: r.avatar || '',
	}));
	const notes = db.prepare(
		`SELECT n.title, n.created_at, u.nickname, u.avatar FROM notes n
		 LEFT JOIN users u ON n.user_id = u.id WHERE n.status = 1 AND n.visibility = 'public'
		 ORDER BY n.created_at DESC LIMIT 5`
	).all();
	notes.forEach(n => activities.push({
		type: 'note', icon: 'notes-o', color: '#4CAF50',
		text: (n.nickname || '学习者') + ' 发布了笔记「' + (n.title || '') + '」',
		time: (n.created_at || '').split(' ')[0], avatar: n.avatar || '',
	}));
	activities.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
	res.json({ code: 200, data: activities.slice(0, 10) });
});

app.get('/', (req, res) => {
	res.json({ msg: '学习伴侣系统 API 服务运行中', version: '1.0.0' });
});

if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`学习伴侣系统后端已启动: http://localhost:${PORT}`);
	});
}

module.exports = app;
