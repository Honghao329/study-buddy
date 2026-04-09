const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { getLocalDateString } = require('../lib/date');

// 用户创建打卡任务
router.post('/create', authMiddleware, (req, res) => {
	const { title, description, start_date, end_date } = req.body;
	if (!title || !title.trim()) return res.json({ code: 400, msg: '请输入标题' });
	const result = db.prepare('INSERT INTO checkins (title, description, start_date, end_date, creator_id) VALUES (?, ?, ?, ?, ?)')
		.run(title.trim(), description || '', start_date || '', end_date || '', req.userId);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

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

// 打卡任务详情
router.get('/detail/:id', optionalAuth, (req, res) => {
	const item = db.prepare(
		`SELECT c.*, u.nickname as supervisor_display_name, u.avatar as supervisor_avatar
		 FROM checkins c LEFT JOIN users u ON c.supervisor_id = u.id
		 WHERE c.id = ? AND c.status = 1`
	).get(req.params.id);
	if (!item) return res.json({ code: 404, msg: '不存在' });
	db.prepare('UPDATE checkins SET view_cnt = view_cnt + 1 WHERE id = ?').run(req.params.id);
	item.view_cnt = (item.view_cnt || 0) + 1;
	item.has_supervisor = !!item.supervisor_id;
	item.is_supervisor = req.userId && item.supervisor_id === req.userId;

	let is_joined = false, my_total = 0;
	if (req.userId) {
		const today = getLocalDateString();
		is_joined = !!db.prepare('SELECT 1 FROM checkin_records WHERE checkin_id = ? AND user_id = ? AND day = ?').get(req.params.id, req.userId, today);
		my_total = db.prepare('SELECT COUNT(*) as cnt FROM checkin_records WHERE checkin_id = ? AND user_id = ?').get(req.params.id, req.userId).cnt;
	}

	const recent_users = db.prepare(
		`SELECT cr.user_id, u.nickname, u.avatar, cr.day FROM checkin_records cr
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
	const { checkinId, content, forms } = req.body;
	const item = db.prepare('SELECT id FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '不存在' });
	const today = getLocalDateString();
	const existing = db.prepare('SELECT id FROM checkin_records WHERE checkin_id = ? AND user_id = ? AND day = ?').get(checkinId, req.userId, today);
	if (existing) return res.json({ code: 400, msg: '今日已打卡' });

	db.prepare('INSERT INTO checkin_records (checkin_id, user_id, day, content, forms) VALUES (?, ?, ?, ?, ?)').run(checkinId, req.userId, today, content || '', JSON.stringify(forms || {}));
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

// 邀请伙伴监督某个打卡任务
router.post('/invite_supervisor', authMiddleware, (req, res) => {
	const { checkinId, supervisorId } = req.body;
	const item = db.prepare('SELECT * FROM checkins WHERE id = ?').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '打卡任务不存在' });

	const supervisor = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(supervisorId);
	if (!supervisor) return res.json({ code: 404, msg: '用户不存在' });

	// 校验是否为伙伴关系
	const isPartner = db.prepare(
		'SELECT 1 FROM partners WHERE status = 1 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))'
	).get(req.userId, supervisorId, supervisorId, req.userId);
	if (!isPartner) return res.json({ code: 403, msg: '只能邀请伙伴作为监督者' });

	db.prepare('UPDATE checkins SET supervisor_id = ?, supervisor_name = ?, creator_id = ? WHERE id = ?')
		.run(supervisorId, supervisor.nickname || '', req.userId, checkinId);
	res.json({ code: 200, msg: '已邀请监督' });
});

// 监督者评价某条打卡记录
router.post('/comment_record', authMiddleware, (req, res) => {
	const { recordId, comment, score } = req.body;
	const record = db.prepare(
		`SELECT cr.*, c.supervisor_id FROM checkin_records cr
		 LEFT JOIN checkins c ON cr.checkin_id = c.id WHERE cr.id = ?`
	).get(recordId);
	if (!record) return res.json({ code: 404, msg: '记录不存在' });
	if (record.supervisor_id !== req.userId) return res.json({ code: 403, msg: '只有监督者可以评价' });

	db.prepare('UPDATE checkin_records SET comment = ?, score = ? WHERE id = ?').run(comment || '', score || 0, recordId);
	res.json({ code: 200, msg: '评价成功' });
});

// 打卡记录时间线（含评价）
router.get('/records/:id', optionalAuth, (req, res) => {
	const { page = 1, size = 20 } = req.query;
	const offset = (page - 1) * size;
	const list = db.prepare(
		`SELECT cr.*, u.nickname as user_name, u.avatar as user_avatar
		 FROM checkin_records cr LEFT JOIN users u ON cr.user_id = u.id
		 WHERE cr.checkin_id = ? ORDER BY cr.created_at DESC LIMIT ? OFFSET ?`
	).all(req.params.id, Number(size), offset);
	const total = db.prepare('SELECT COUNT(*) as cnt FROM checkin_records WHERE checkin_id = ?').get(req.params.id).cnt;
	res.json({ code: 200, data: { list, total } });
});

module.exports = router;
