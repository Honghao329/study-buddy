const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 打卡任务列表
router.get('/list', (req, res) => {
	const { page = 1, size = 10, search } = req.query;
	const offset = (page - 1) * size;
	let where = 'WHERE status = 1';
	const params = [];
	if (search) { where += ' AND title LIKE ?'; params.push(`%${search}%`); }

	const total = db.prepare(`SELECT COUNT(*) as cnt FROM checkins ${where}`).get(...params).cnt;
	const list = db.prepare(`SELECT * FROM checkins ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(size), offset);
	res.json({ code: 200, data: { list, total } });
});

// 可选认证：有token就解析，没有也放行
function optionalAuth(req, res, next) {
	const token = req.headers['x-token'];
	if (token) {
		try {
			const jwt = require('jsonwebtoken');
			req.userId = jwt.verify(token.replace('Bearer ', ''), require('../middleware/auth').SECRET).userId;
		} catch(e) {}
	}
	next();
}

// 打卡任务详情
router.get('/detail/:id', optionalAuth, (req, res) => {
	const item = db.prepare('SELECT * FROM checkins WHERE id = ?').get(req.params.id);
	if (!item) return res.json({ code: 404, msg: '不存在' });
	db.prepare('UPDATE checkins SET view_cnt = view_cnt + 1 WHERE id = ?').run(req.params.id);

	let is_joined = false, my_total = 0;
	if (req.userId) {
		const today = new Date().toISOString().split('T')[0];
		is_joined = !!db.prepare('SELECT 1 FROM checkin_records WHERE checkin_id = ? AND user_id = ? AND day = ?').get(req.params.id, req.userId, today);
		my_total = db.prepare('SELECT COUNT(*) as cnt FROM checkin_records WHERE checkin_id = ? AND user_id = ?').get(req.params.id, req.userId).cnt;
	}

	const recent_users = db.prepare(
		`SELECT u.nickname, u.avatar, cr.day FROM checkin_records cr
		 LEFT JOIN users u ON cr.user_id = u.id
		 WHERE cr.checkin_id = ? ORDER BY cr.created_at DESC LIMIT 10`
	).all(req.params.id);

	item.is_joined = is_joined;
	item.my_total = my_total;
	item.recent_users = recent_users;
	res.json({ code: 200, data: item });
});

// 参与打卡
router.post('/join', authMiddleware, (req, res) => {
	const { checkinId, forms } = req.body;
	const today = new Date().toISOString().split('T')[0];
	const existing = db.prepare('SELECT id FROM checkin_records WHERE checkin_id = ? AND user_id = ? AND day = ?').get(checkinId, req.userId, today);
	if (existing) return res.json({ code: 400, msg: '今日已打卡' });

	db.prepare('INSERT INTO checkin_records (checkin_id, user_id, day, forms) VALUES (?, ?, ?, ?)').run(checkinId, req.userId, today, JSON.stringify(forms || {}));
	db.prepare('UPDATE checkins SET join_cnt = join_cnt + 1 WHERE id = ?').run(checkinId);
	res.json({ code: 200, msg: '打卡成功' });
});

// 我的打卡记录
router.get('/my_records', authMiddleware, (req, res) => {
	const list = db.prepare(
		`SELECT cr.*, c.title as checkin_title FROM checkin_records cr
		 LEFT JOIN checkins c ON cr.checkin_id = c.id
		 WHERE cr.user_id = ? ORDER BY cr.created_at DESC LIMIT 50`
	).all(req.userId);
	res.json({ code: 200, data: list });
});

module.exports = router;
