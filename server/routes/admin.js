const router = require('express').Router();
const crypto = require('crypto');
const db = require('../config/db');
const { adminAuth, generateToken } = require('../middleware/auth');
const { deleteCheckinCascade, deleteNoteCascade, deleteCommentCascade } = require('../lib/cleanup');
const { normalizeNote, normalizeUser, parseJsonField, fillAvatarsList } = require('../lib/format');
const { sanitizePage } = require('../lib/validate');

function hashPwd(pwd) {
	return crypto.createHash('sha256').update(pwd + '_study_buddy').digest('hex');
}

router.post('/login', (req, res) => {
	const { username, password } = req.body;
	const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND status = 1').get(username);
	if (!admin) return res.json({ code: 401, msg: '账号或密码错误' });
	const hashed = hashPwd(password);
	// 兼容旧明文密码
	if (admin.password !== hashed) {
		if (admin.password === password) {
			db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashed, admin.id);
		} else {
			return res.json({ code: 401, msg: '账号或密码错误' });
		}
	}
	const token = generateToken({ adminId: admin.id, isAdmin: true });
	res.json({ code: 200, data: { token, admin: { id: admin.id, username: admin.username } } });
});

// ===== 用户管理 =====
router.get('/user_list', adminAuth, (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const { search, status } = req.query;
	let where = 'WHERE 1=1';
	const params = [];
	if (search) { where += ' AND nickname LIKE ?'; params.push(`%${search}%`); }
	if (status !== undefined && status !== '') { where += ' AND status = ?'; params.push(Number(status)); }
	const total = db.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`).get(...params).cnt;
	const list = db.prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, size, offset);
	res.json({ code: 200, data: { list: list.map(normalizeUser), total } });
});

router.get('/user_detail/:id', adminAuth, (req, res) => {
	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	res.json({ code: 200, data: normalizeUser(user) });
});

router.put('/user_status/:id', adminAuth, (req, res) => {
	const user = db.prepare('SELECT status FROM users WHERE id = ?').get(req.params.id);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	const newStatus = user.status === 1 ? 9 : 1;
	db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, req.params.id);
	res.json({ code: 200, data: { status: newStatus }, msg: '状态已更新' });
});

router.put('/user_edit/:id', adminAuth, (req, res) => {
	const { nickname, bio, mobile, tags, role } = req.body;
	const fields = [];
	const values = [];
	if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
	if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
	if (mobile !== undefined) { fields.push('mobile = ?'); values.push(mobile); }
	if (tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(Array.isArray(tags) ? tags : [])); }
	if (role !== undefined) { fields.push('role = ?'); values.push(role); }
	if (fields.length > 0) {
		fields.push('updated_at = CURRENT_TIMESTAMP');
		values.push(req.params.id);
		db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	}
	res.json({ code: 200, msg: '更新成功' });
});

router.delete('/user_del/:id', adminAuth, (req, res) => {
	const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	const deleteUser = db.transaction((userId) => {
		db.prepare('DELETE FROM messages WHERE user_id = ? OR from_id = ?').run(userId, userId);
		db.prepare('DELETE FROM plan_records WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM plans WHERE creator_id = ? OR executor_id = ?').run(userId, userId);
		db.prepare('UPDATE checkins SET supervisor_id = 0, supervisor_name = "" WHERE supervisor_id = ?').run(userId);
		db.prepare('UPDATE checkins SET creator_id = 0 WHERE creator_id = ?').run(userId);
		db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM likes WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM favorites WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM signs WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM checkin_records WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM partners WHERE user_id = ? OR target_id = ?').run(userId, userId);
		const notes = db.prepare('SELECT id FROM notes WHERE user_id = ?').all(userId);
		notes.forEach(n => deleteNoteCascade(db, n.id));
		db.prepare('DELETE FROM users WHERE id = ?').run(userId);
	});
	deleteUser(req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// ===== 笔记管理 =====
router.get('/note_list', adminAuth, (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const { search, visibility } = req.query;
	let where = 'WHERE 1=1';
	const params = [];
	if (search) { where += ' AND n.title LIKE ?'; params.push(`%${search}%`); }
	if (visibility) { where += ' AND n.visibility = ?'; params.push(visibility); }
	const total = db.prepare(`SELECT COUNT(*) as cnt FROM notes n ${where}`).get(...params).cnt;
	const list = db.prepare(
		`SELECT n.*, u.nickname as user_name FROM notes n LEFT JOIN users u ON n.user_id = u.id ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`
	).all(...params, size, offset);
	res.json({ code: 200, data: { list: list.map(normalizeNote), total } });
});

router.put('/note_edit/:id', adminAuth, (req, res) => {
	const { title, content, visibility, tags } = req.body;
	const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '[]');
	db.prepare('UPDATE notes SET title = ?, content = ?, visibility = ?, tags = ? WHERE id = ?').run(title || '', content || '', visibility || 'public', tagsStr, req.params.id);
	res.json({ code: 200, msg: '更新成功' });
});

router.delete('/note_del/:id', adminAuth, (req, res) => {
	deleteNoteCascade(db, req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// ===== 评论管理 =====
router.get('/comment_list', adminAuth, (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const { noteId, search } = req.query;
	let where = 'WHERE 1=1';
	const params = [];
	if (noteId) { where += ' AND c.note_id = ?'; params.push(Number(noteId)); }
	if (search) { where += ' AND c.content LIKE ?'; params.push(`%${search}%`); }
	const total = db.prepare(`SELECT COUNT(*) as cnt FROM comments c ${where}`).get(...params).cnt;
	const list = db.prepare(
		`SELECT c.*, u.nickname as user_name, n.title as note_title
		 FROM comments c LEFT JOIN users u ON c.user_id = u.id LEFT JOIN notes n ON c.note_id = n.id
		 ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
	).all(...params, size, offset);
	res.json({ code: 200, data: { list, total } });
});

router.put('/comment_status/:id', adminAuth, (req, res) => {
	const comment = db.prepare('SELECT status FROM comments WHERE id = ?').get(req.params.id);
	if (!comment) return res.json({ code: 404, msg: '评论不存在' });
	const newStatus = comment.status === 1 ? 0 : 1;
	db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(newStatus, req.params.id);
	res.json({ code: 200, data: { status: newStatus }, msg: '状态已更新' });
});

router.delete('/comment_del/:id', adminAuth, (req, res) => {
	deleteCommentCascade(db, req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// ===== 打卡管理 =====
router.get('/checkin_list', adminAuth, (req, res) => {
	const list = db.prepare('SELECT * FROM checkins ORDER BY created_at DESC').all();
	res.json({ code: 200, data: list });
});

router.post('/checkin_create', adminAuth, (req, res) => {
	const { title, description, start_date, end_date } = req.body;
	const result = db.prepare('INSERT INTO checkins (title, description, start_date, end_date) VALUES (?, ?, ?, ?)').run(title, description || '', start_date || '', end_date || '');
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

router.put('/checkin_edit/:id', adminAuth, (req, res) => {
	const { title, description, start_date, end_date, status } = req.body;
	db.prepare('UPDATE checkins SET title = ?, description = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?').run(title || '', description || '', start_date || '', end_date || '', status ?? 1, req.params.id);
	res.json({ code: 200, msg: '更新成功' });
});

router.delete('/checkin_del/:id', adminAuth, (req, res) => {
	deleteCheckinCascade(db, req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// ===== 资讯管理 =====
router.get('/news_list', adminAuth, (req, res) => {
	const list = db.prepare('SELECT * FROM news ORDER BY sort_order ASC, created_at DESC').all();
	list.forEach(n => { n.pic = parseJsonField(n.pic, []); });
	res.json({ code: 200, data: list });
});

router.post('/news_create', adminAuth, (req, res) => {
	const { title, description, content, pic, cate } = req.body;
	const result = db.prepare('INSERT INTO news (title, description, content, pic, cate) VALUES (?, ?, ?, ?, ?)').run(title, description || '', content || '', JSON.stringify(pic || []), cate || '');
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

router.put('/news_edit/:id', adminAuth, (req, res) => {
	const { title, description, content, cate } = req.body;
	db.prepare('UPDATE news SET title = ?, description = ?, content = ?, cate = ? WHERE id = ?').run(title || '', description || '', content || '', cate || '', req.params.id);
	res.json({ code: 200, msg: '更新成功' });
});

router.delete('/news_del/:id', adminAuth, (req, res) => {
	db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// ===== 伙伴关系管理 =====
router.get('/partner_list', adminAuth, (req, res) => {
	const { status } = req.query;
	let where = '';
	const params = [];
	if (status !== undefined && status !== '') { where = 'WHERE p.status = ?'; params.push(Number(status)); }
	const list = db.prepare(
		`SELECT p.*, u1.nickname as user_name, u1.avatar as user_pic,
		 u2.nickname as target_name, u2.avatar as target_pic
		 FROM partners p LEFT JOIN users u1 ON p.user_id = u1.id LEFT JOIN users u2 ON p.target_id = u2.id
		 ${where} ORDER BY p.created_at DESC LIMIT 200`
	).all(...params);
	res.json({ code: 200, data: list });
});

router.put('/partner_status/:id', adminAuth, (req, res) => {
	const { status } = req.body;
	if (![0, 1, 8, 9].includes(Number(status))) return res.json({ code: 400, msg: '非法的状态值' });
	db.prepare('UPDATE partners SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(status), req.params.id);
	res.json({ code: 200, msg: '状态已更新' });
});

router.delete('/partner_del/:id', adminAuth, (req, res) => {
	db.prepare('DELETE FROM partners WHERE id = ?').run(req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// ===== 签到管理 =====
router.get('/sign_list', adminAuth, (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const { search } = req.query;
	let where = 'WHERE 1=1';
	const params = [];
	if (search) { where += ' AND u.nickname LIKE ?'; params.push(`%${search}%`); }
	const total = db.prepare(`SELECT COUNT(*) as cnt FROM signs s LEFT JOIN users u ON s.user_id = u.id ${where}`).get(...params).cnt;
	const list = db.prepare(
		`SELECT s.*, u.nickname as user_name, u.avatar as user_pic
		 FROM signs s LEFT JOIN users u ON s.user_id = u.id
		 ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`
	).all(...params, size, offset);
	res.json({ code: 200, data: { list, total } });
});

router.delete('/sign_del/:id', adminAuth, (req, res) => {
	db.prepare('DELETE FROM signs WHERE id = ?').run(req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// ===== 收藏/点赞统计 =====
router.get('/like_stats', adminAuth, (req, res) => {
	const noteStats = db.prepare(
		`SELECT n.id, n.title, n.like_cnt, n.fav_cnt, u.nickname as user_name
		 FROM notes n LEFT JOIN users u ON n.user_id = u.id
		 WHERE n.status = 1 ORDER BY n.like_cnt DESC LIMIT 50`
	).all();
	const totalLikes = db.prepare('SELECT COUNT(*) as cnt FROM likes').get().cnt;
	const totalFavs = db.prepare('SELECT COUNT(*) as cnt FROM favorites').get().cnt;
	res.json({ code: 200, data: { noteStats, totalLikes, totalFavs } });
});

// ===== 统计概览 =====
router.get('/stats', adminAuth, (req, res) => {
	const stats = db.prepare(`SELECT
		(SELECT COUNT(*) FROM users) as userCount,
		(SELECT COUNT(*) FROM notes) as noteCount,
		(SELECT COUNT(*) FROM signs) as signCount,
		(SELECT COUNT(*) FROM checkins) as checkinCount,
		(SELECT COUNT(*) FROM comments) as commentCount,
		(SELECT COUNT(*) FROM partners WHERE status = 1) as partnerCount,
		(SELECT COUNT(*) FROM likes) as likeCount,
		(SELECT COUNT(*) FROM favorites) as favCount
	`).get();
	res.json({ code: 200, data: stats });
});

router.get('/recent_users', adminAuth, (req, res) => {
	const list = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 5').all();
	res.json({ code: 200, data: list.map(normalizeUser) });
});

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
		} catch (e2) {}
	}
	res.json({ code: 200, data: {
		dbSize, nodeVersion: process.version,
		uptime: Math.floor(process.uptime()) + ' 秒',
		platform: process.platform,
		memoryUsage: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB'
	}});
});

router.get('/admin_info', adminAuth, (req, res) => {
	const admin = db.prepare('SELECT id, username, created_at FROM admins WHERE id = ?').get(req.adminId);
	if (!admin) return res.json({ code: 404, msg: '管理员不存在' });
	res.json({ code: 200, data: admin });
});

router.post('/change_password', adminAuth, (req, res) => {
	const { oldPassword, newPassword } = req.body;
	if (!oldPassword || !newPassword) return res.json({ code: 400, msg: '请填写完整' });
	const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.adminId);
	if (!admin) return res.json({ code: 404, msg: '管理员不存在' });
	const oldHashed = hashPwd(oldPassword);
	if (admin.password !== oldHashed && admin.password !== oldPassword) return res.json({ code: 403, msg: '原密码错误' });
	db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashPwd(newPassword), req.adminId);
	res.json({ code: 200, msg: '密码修改成功' });
});

// ===== 图表数据 =====
router.get('/chart/sign_trend', adminAuth, (req, res) => {
	const days = parseInt(req.query.days) || 14;
	const rows = db.prepare(
		`SELECT date(created_at) as day, COUNT(*) as cnt
		 FROM signs WHERE created_at >= date('now', '-' || ? || ' days')
		 GROUP BY date(created_at) ORDER BY day`
	).all(days);
	res.json({ code: 200, data: rows });
});

router.get('/chart/user_trend', adminAuth, (req, res) => {
	const days = parseInt(req.query.days) || 14;
	const rows = db.prepare(
		`SELECT date(created_at) as day, COUNT(*) as cnt
		 FROM users WHERE created_at >= date('now', '-' || ? || ' days')
		 GROUP BY date(created_at) ORDER BY day`
	).all(days);
	res.json({ code: 200, data: rows });
});

router.get('/chart/note_trend', adminAuth, (req, res) => {
	const days = parseInt(req.query.days) || 14;
	const rows = db.prepare(
		`SELECT date(created_at) as day, COUNT(*) as cnt
		 FROM notes WHERE created_at >= date('now', '-' || ? || ' days')
		 GROUP BY date(created_at) ORDER BY day`
	).all(days);
	res.json({ code: 200, data: rows });
});

router.get('/chart/note_visibility', adminAuth, (req, res) => {
	const rows = db.prepare(
		`SELECT visibility, COUNT(*) as cnt FROM notes WHERE status = 1 GROUP BY visibility`
	).all();
	res.json({ code: 200, data: rows });
});

router.get('/chart/hourly_activity', adminAuth, (req, res) => {
	const rows = db.prepare(
		`SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as cnt
		 FROM signs GROUP BY hour ORDER BY hour`
	).all();
	res.json({ code: 200, data: rows });
});

router.get('/chart/top_notes', adminAuth, (req, res) => {
	const rows = db.prepare(
		`SELECT n.title, n.like_cnt, n.comment_cnt, n.view_cnt, n.fav_cnt
		 FROM notes n WHERE n.status = 1 ORDER BY n.view_cnt DESC LIMIT 8`
	).all();
	res.json({ code: 200, data: rows });
});

// ===== 数据导出 =====
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

router.get('/export/signs', adminAuth, (req, res) => {
	const list = db.prepare('SELECT s.id, u.nickname as user_name, s.day, s.duration, s.content, s.created_at FROM signs s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.id').all();
	let csv = 'ID,用户,日期,时长(分钟),内容,签到时间\n';
	list.forEach(r => {
		csv += `${r.id},"${r.user_name||''}","${r.day||''}",${r.duration||0},"${(r.content||'').replace(/"/g,'""')}","${r.created_at||''}"\n`;
	});
	res.setHeader('Content-Type', 'text/csv; charset=utf-8');
	res.setHeader('Content-Disposition', 'attachment; filename=signs.csv');
	res.send('\uFEFF' + csv);
});

router.get('/export/partners', adminAuth, (req, res) => {
	const list = db.prepare(
		`SELECT p.id, u1.nickname as user_name, u2.nickname as target_name, p.status, p.created_at
		 FROM partners p LEFT JOIN users u1 ON p.user_id = u1.id LEFT JOIN users u2 ON p.target_id = u2.id ORDER BY p.id`
	).all();
	let csv = 'ID,发起方,接收方,状态,创建时间\n';
	const statusMap = {0:'待接受',1:'已接受',8:'已拒绝',9:'已解除'};
	list.forEach(r => {
		csv += `${r.id},"${r.user_name||''}","${r.target_name||''}",${statusMap[r.status]||r.status},"${r.created_at||''}"\n`;
	});
	res.setHeader('Content-Type', 'text/csv; charset=utf-8');
	res.setHeader('Content-Disposition', 'attachment; filename=partners.csv');
	res.send('\uFEFF' + csv);
});

module.exports = router;
