const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

const app = express();
const PORT = 3900;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.get('/', (req, res) => {
	res.json({ msg: '学习伴侣系统 API 服务运行中', version: '1.0.0' });
});

app.listen(PORT, () => {
	console.log(`学习伴侣系统后端已启动: http://localhost:${PORT}`);
});
