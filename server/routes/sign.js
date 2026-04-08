const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 每日签到
router.post('/do', authMiddleware, (req, res) => {
	const { duration, status, content } = req.body;
	const today = new Date().toISOString().split('T')[0];

	const existing = db.prepare('SELECT id FROM signs WHERE user_id = ? AND day = ?').get(req.userId, today);
	if (existing) return res.json({ code: 400, msg: '今日已签到' });

	db.prepare('INSERT INTO signs (user_id, day, duration, status, content) VALUES (?, ?, ?, ?, ?)')
		.run(req.userId, today, duration || 0, status || 'normal', content || '');
	res.json({ code: 200, data: { day: today } });
});

// 签到统计（合并查询）
router.get('/stats', authMiddleware, (req, res) => {
	const todayStr = new Date().toISOString().split('T')[0];

	const agg = db.prepare(`SELECT
		COUNT(*) as totalDays,
		COALESCE(SUM(duration), 0) as totalDuration,
		SUM(CASE WHEN day = ? THEN 1 ELSE 0 END) as todaySigned
		FROM signs WHERE user_id = ?`
	).get(todayStr, req.userId);

	// 连续天数（限制查询最近60天即可）
	const days = db.prepare('SELECT day FROM signs WHERE user_id = ? ORDER BY day DESC LIMIT 60').all(req.userId);
	let streak = 0;
	const today = new Date();
	let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

	for (const d of days) {
		const signDate = new Date(d.day + 'T00:00:00');
		const diff = Math.round((checkDate - signDate) / 86400000);
		if (diff <= 1) { streak++; checkDate = signDate; }
		else break;
	}

	res.json({ code: 200, data: {
		totalDays: agg.totalDays,
		totalDuration: agg.totalDuration,
		streak,
		todaySigned: agg.todaySigned > 0 ? 1 : 0
	}});
});

// 月度日历
router.get('/calendar', authMiddleware, (req, res) => {
	const { year, month } = req.query;
	const startDay = `${year}-${String(month).padStart(2, '0')}-01`;
	const endMonth = Number(month) === 12 ? 1 : Number(month) + 1;
	const endYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
	const endDay = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

	const list = db.prepare(
		'SELECT day, duration, status FROM signs WHERE user_id = ? AND day >= ? AND day < ? ORDER BY day ASC'
	).all(req.userId, startDay, endDay);
	res.json({ code: 200, data: list });
});

// 排行榜
router.get('/rank', (req, res) => {
	const list = db.prepare(
		`SELECT s.user_id, u.nickname as user_name, u.avatar as user_pic, COUNT(*) as days, SUM(s.duration) as total_duration
		 FROM signs s LEFT JOIN users u ON s.user_id = u.id
		 GROUP BY s.user_id ORDER BY days DESC LIMIT 20`
	).all();
	res.json({ code: 200, data: list });
});

module.exports = router;
