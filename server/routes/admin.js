const router = require('express').Router();
const db = require('../config/db');
const { adminAuth, generateToken } = require('../middleware/auth');
const { deleteCheckinCascade, deleteNoteCascade } = require('../lib/cleanup');
const { normalizeNote, normalizeUser } = require('../lib/format');

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
	res.json({ code: 200, data: { list: list.map(normalizeUser), total } });
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
	res.json({ code: 200, data: { list: list.map(normalizeNote), total } });
});

// 删除笔记（管理）
router.delete('/note_del/:id', adminAuth, (req, res) => {
	deleteNoteCascade(db, req.params.id);
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
	deleteCheckinCascade(db, req.params.id);
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

// 编辑笔记
router.put('/note_edit/:id', adminAuth, (req, res) => {
	const { title, content, visibility, tags } = req.body;
	const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '[]');
	db.prepare('UPDATE notes SET title = ?, content = ?, visibility = ?, tags = ? WHERE id = ?').run(title || '', content || '', visibility || 'public', tagsStr, req.params.id);
	res.json({ code: 200, msg: '更新成功' });
});

// 编辑打卡任务
router.put('/checkin_edit/:id', adminAuth, (req, res) => {
	const { title, description, start_date, end_date, status } = req.body;
	db.prepare('UPDATE checkins SET title = ?, description = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?').run(title || '', description || '', start_date || '', end_date || '', status ?? 1, req.params.id);
	res.json({ code: 200, msg: '更新成功' });
});

// 编辑资讯
router.put('/news_edit/:id', adminAuth, (req, res) => {
	const { title, description, content, cate } = req.body;
	db.prepare('UPDATE news SET title = ?, description = ?, content = ?, cate = ? WHERE id = ?').run(title || '', description || '', content || '', cate || '', req.params.id);
	res.json({ code: 200, msg: '更新成功' });
});

// 切换用户状态
router.put('/user_status/:id', adminAuth, (req, res) => {
	const user = db.prepare('SELECT status FROM users WHERE id = ?').get(req.params.id);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	const newStatus = user.status === 1 ? 9 : 1;
	db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, req.params.id);
	res.json({ code: 200, data: { status: newStatus }, msg: '状态已更新' });
});

// 用户详情
router.get('/user_detail/:id', adminAuth, (req, res) => {
	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	res.json({ code: 200, data: normalizeUser(user) });
});

// 系统信息
router.get('/system_info', adminAuth, (req, res) => {
	const fs = require('fs');
	const path = require('path');
	let dbSize = '未知';
	try {
		const dbPath = path.join(__dirname, '..', 'data', 'study_buddy.db');
		const stats = fs.statSync(dbPath);
		dbSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB';
	} catch (e) {
		try {
			const dbPath = path.join(__dirname, '..', 'study_buddy.db');
			const stats = fs.statSync(dbPath);
			dbSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB';
		} catch (e2) { /* ignore */ }
	}
	res.json({ code: 200, data: {
		dbSize,
		nodeVersion: process.version,
		uptime: Math.floor(process.uptime()) + ' 秒',
		platform: process.platform,
		memoryUsage: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB'
	}});
});

// 最新用户
router.get('/recent_users', adminAuth, (req, res) => {
	const list = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 5').all();
	res.json({ code: 200, data: list.map(normalizeUser) });
});

// 导出用户数据CSV
router.get('/export/users', adminAuth, (req, res) => {
	const list = db.prepare('SELECT id, nickname, mobile, bio, login_cnt, status, created_at FROM users ORDER BY id').all();
	let csv = 'ID,昵称,手机,简介,登录次数,状态,注册时间\n';
	list.forEach(r => {
		csv += `${r.id},"${(r.nickname||'').replace(/"/g,'""')}","${r.mobile||''}","${(r.bio||'').replace(/"/g,'""')}",${r.login_cnt||0},${r.status===1?'正常':'禁用'},"${r.created_at||''}"\n`;
	});
	res.setHeader('Content-Type', 'text/csv; charset=utf-8');
	res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
	res.send('\uFEFF' + csv);
});

// 导出笔记数据CSV
router.get('/export/notes', adminAuth, (req, res) => {
	const list = db.prepare('SELECT n.id, n.title, u.nickname as user_name, n.visibility, n.like_cnt, n.comment_cnt, n.view_cnt, n.created_at FROM notes n LEFT JOIN users u ON n.user_id = u.id ORDER BY n.id').all();
	let csv = 'ID,标题,作者,可见性,点赞,评论,浏览,创建时间\n';
	list.forEach(r => {
		csv += `${r.id},"${(r.title||'').replace(/"/g,'""')}","${r.user_name||''}",${r.visibility||''},${r.like_cnt||0},${r.comment_cnt||0},${r.view_cnt||0},"${r.created_at||''}"\n`;
	});
	res.setHeader('Content-Type', 'text/csv; charset=utf-8');
	res.setHeader('Content-Disposition', 'attachment; filename=notes.csv');
	res.send('\uFEFF' + csv);
});

// 导出签到数据CSV
router.get('/export/signs', adminAuth, (req, res) => {
	const list = db.prepare('SELECT s.id, u.nickname as user_name, s.duration, s.content, s.created_at FROM signs s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.id').all();
	let csv = 'ID,用户,时长(分钟),内容,签到时间\n';
	list.forEach(r => {
		csv += `${r.id},"${r.user_name||''}",${r.duration||0},"${(r.content||'').replace(/"/g,'""')}","${r.created_at||''}"\n`;
	});
	res.setHeader('Content-Type', 'text/csv; charset=utf-8');
	res.setHeader('Content-Disposition', 'attachment; filename=signs.csv');
	res.send('\uFEFF' + csv);
});

// 修改管理员密码
router.post('/change_password', adminAuth, (req, res) => {
	const { oldPassword, newPassword } = req.body;
	if (!oldPassword || !newPassword) return res.json({ code: 400, msg: '请填写完整' });
	const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.adminId);
	if (!admin) return res.json({ code: 404, msg: '管理员不存在' });
	if (admin.password !== oldPassword) return res.json({ code: 403, msg: '原密码错误' });
	db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(newPassword, req.adminId);
	res.json({ code: 200, msg: '密码修改成功' });
});

// 获取当前管理员信息
router.get('/admin_info', adminAuth, (req, res) => {
	const admin = db.prepare('SELECT id, username, created_at FROM admins WHERE id = ?').get(req.adminId);
	if (!admin) return res.json({ code: 404, msg: '管理员不存在' });
	res.json({ code: 200, data: admin });
});

// 伙伴关系列表
router.get('/partner_list', adminAuth, (req, res) => {
	const list = db.prepare(
		`SELECT p.*,
		 u1.nickname as user_name, u1.avatar as user_pic,
		 u2.nickname as target_name, u2.avatar as target_pic
		 FROM partners p
		 LEFT JOIN users u1 ON p.user_id = u1.id
		 LEFT JOIN users u2 ON p.target_id = u2.id
		 ORDER BY p.created_at DESC LIMIT 100`
	).all();
	res.json({ code: 200, data: list });
});

module.exports = router;
