const router = require('express').Router();
const db = require('../config/db');
const { adminAuth, generateToken } = require('../middleware/auth');

// 管理员登录
router.post('/login', (req, res) => {
	const { username, password } = req.body;
	const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ? AND status = 1').get(username, password);
	if (!admin) return res.json({ code: 401, msg: '账号或密码错误' });
	const token = generateToken({ adminId: admin.id, isAdmin: true });
	res.json({ code: 200, data: { token, admin: { id: admin.id, username: admin.username } } });
});

// 用户列表
router.get('/user_list', adminAuth, (req, res) => {
	const { page = 1, size = 20, search } = req.query;
	const offset = (page - 1) * size;
	let where = 'WHERE 1=1';
	const params = [];
	if (search) { where += ' AND nickname LIKE ?'; params.push(`%${search}%`); }
	const total = db.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`).get(...params).cnt;
	const list = db.prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(size), offset);
	list.forEach(u => { u.tags = JSON.parse(u.tags || '[]'); });
	res.json({ code: 200, data: { list, total } });
});

// 笔记列表（管理）
router.get('/note_list', adminAuth, (req, res) => {
	const { page = 1, size = 20, search } = req.query;
	const offset = (page - 1) * size;
	let where = 'WHERE 1=1';
	const params = [];
	if (search) { where += ' AND n.title LIKE ?'; params.push(`%${search}%`); }
	const total = db.prepare(`SELECT COUNT(*) as cnt FROM notes n ${where}`).get(...params).cnt;
	const list = db.prepare(
		`SELECT n.*, u.nickname as user_name FROM notes n LEFT JOIN users u ON n.user_id = u.id ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`
	).all(...params, Number(size), offset);
	list.forEach(n => { n.images = JSON.parse(n.images || '[]'); n.tags = JSON.parse(n.tags || '[]'); });
	res.json({ code: 200, data: { list, total } });
});

// 删除笔记（管理）
router.delete('/note_del/:id', adminAuth, (req, res) => {
	db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// 打卡任务管理
router.post('/checkin_create', adminAuth, (req, res) => {
	const { title, description, start_date, end_date } = req.body;
	const result = db.prepare('INSERT INTO checkins (title, description, start_date, end_date) VALUES (?, ?, ?, ?)').run(title, description || '', start_date || '', end_date || '');
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

router.get('/checkin_list', adminAuth, (req, res) => {
	const list = db.prepare('SELECT * FROM checkins ORDER BY created_at DESC').all();
	res.json({ code: 200, data: list });
});

router.delete('/checkin_del/:id', adminAuth, (req, res) => {
	db.prepare('DELETE FROM checkins WHERE id = ?').run(req.params.id);
	db.prepare('DELETE FROM checkin_records WHERE checkin_id = ?').run(req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// 资讯管理
router.post('/news_create', adminAuth, (req, res) => {
	const { title, description, content, pic, cate } = req.body;
	const result = db.prepare('INSERT INTO news (title, description, content, pic, cate) VALUES (?, ?, ?, ?, ?)').run(title, description || '', content || '', JSON.stringify(pic || []), cate || '');
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

router.get('/news_list', adminAuth, (req, res) => {
	const list = db.prepare('SELECT * FROM news ORDER BY sort_order ASC, created_at DESC').all();
	list.forEach(n => { n.pic = JSON.parse(n.pic || '[]'); });
	res.json({ code: 200, data: list });
});

router.delete('/news_del/:id', adminAuth, (req, res) => {
	db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// 统计概览（单查询）
router.get('/stats', adminAuth, (req, res) => {
	const stats = db.prepare(`SELECT
		(SELECT COUNT(*) FROM users) as userCount,
		(SELECT COUNT(*) FROM notes) as noteCount,
		(SELECT COUNT(*) FROM signs) as signCount,
		(SELECT COUNT(*) FROM checkins) as checkinCount
	`).get();
	res.json({ code: 200, data: stats });
});

module.exports = router;
