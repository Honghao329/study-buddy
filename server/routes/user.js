const router = require('express').Router();
const crypto = require('crypto');
const db = require('../config/db');
const { authMiddleware, optionalAuth, generateToken } = require('../middleware/auth');
const { normalizeUser, parseJsonField } = require('../lib/format');

function pickFirstDefined(...values) {
	return values.find((value) => value !== undefined && value !== null);
}

function hashPwd(pwd) {
	return crypto.createHash('sha256').update(pwd + '_study_buddy').digest('hex');
}

router.post('/login', (req, res) => {
	const nickname = (pickFirstDefined(req.body.nickname, req.body.nickName, '') || '').trim();
	const password = (req.body.password || '').trim();
	const avatar = pickFirstDefined(req.body.avatar, req.body.avatarUrl, '');

	if (!nickname) return res.json({ code: 400, msg: '请输入昵称' });
	if (!password || password.length < 4) return res.json({ code: 400, msg: '密码至少4位' });

	const hashed = hashPwd(password);

	let user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
	if (user) {
		// 兼容旧明文密码：如果哈希不匹配，尝试明文比对后迁移
		if (user.password && user.password !== hashed) {
			if (user.password === password) {
				db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
			} else {
				return res.json({ code: 401, msg: '密码错误' });
			}
		}
		if (!user.password) {
			db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
		}
		db.prepare('UPDATE users SET login_cnt = login_cnt + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
		if (avatar) {
			db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatar, user.id);
		}
		user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
	} else {
		const openid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
		const result = db.prepare('INSERT INTO users (openid, nickname, avatar, password, login_cnt) VALUES (?, ?, ?, ?, 1)')
			.run(openid, nickname, avatar || '', hashed);
		user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
	}

	const token = generateToken({ userId: user.id, openid: user.openid });
	res.json({ code: 200, data: { token, user: normalizeUser(user) } });
});

// 获取当前用户信息
router.get('/info', authMiddleware, (req, res) => {
	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	res.json({ code: 200, data: normalizeUser(user) });
});

// 用户主页（公开资料）
router.get('/profile/:id', optionalAuth, (req, res) => {
	const user = db.prepare('SELECT id, nickname, avatar, bio, tags, created_at FROM users WHERE id = ?').get(req.params.id);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });

	user.tags = parseJsonField(user.tags, []);
	// 统计
	user.note_cnt = db.prepare('SELECT COUNT(*) as cnt FROM notes WHERE user_id = ? AND status = 1 AND visibility = ?').get(req.params.id, 'public').cnt;
	user.sign_days = db.prepare('SELECT COUNT(*) as cnt FROM signs WHERE user_id = ?').get(req.params.id).cnt;
	user.checkin_cnt = db.prepare('SELECT COUNT(*) as cnt FROM checkin_records WHERE user_id = ?').get(req.params.id).cnt;

	// 伙伴关系状态
	let partner_status = 'none'; // none / pending / accepted
	if (req.userId && req.userId !== Number(req.params.id)) {
		const rel = db.prepare(
			`SELECT status FROM partners
			 WHERE ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))
			 AND status IN (0, 1)
			 ORDER BY status DESC LIMIT 1`
		).get(req.userId, req.params.id, req.params.id, req.userId);
		if (rel) partner_status = rel.status === 1 ? 'accepted' : 'pending';
	}
	user.partner_status = partner_status;
	user.is_self = req.userId === Number(req.params.id);

	res.json({ code: 200, data: user });
});

// 某用户的公开笔记
router.get('/user_notes/:id', (req, res) => {
	const { page = 1, size = 10 } = req.query;
	const offset = (page - 1) * size;
	const list = db.prepare(
		`SELECT n.*, u.nickname as user_name, u.avatar as user_pic
		 FROM notes n LEFT JOIN users u ON n.user_id = u.id
		 WHERE n.user_id = ? AND n.status = 1 AND n.visibility = 'public'
		 ORDER BY n.created_at DESC LIMIT ? OFFSET ?`
	).all(req.params.id, Number(size), offset);
	const total = db.prepare("SELECT COUNT(*) as cnt FROM notes WHERE user_id = ? AND status = 1 AND visibility = 'public'").get(req.params.id).cnt;
	res.json({ code: 200, data: { list, total } });
});

// 用户列表（发现用户）
router.get('/list', optionalAuth, (req, res) => {
	const { page = 1, size = 20, search } = req.query;
	const offset = (page - 1) * size;
	let where = 'WHERE status = 1';
	const params = [];
	if (search) { where += ' AND nickname LIKE ?'; params.push('%' + search + '%'); }

	const total = db.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`).get(...params).cnt;
	const list = db.prepare(`SELECT id, nickname, avatar, bio, tags, created_at FROM users ${where} ORDER BY login_cnt DESC, id DESC LIMIT ? OFFSET ?`)
		.all(...params, Number(size), offset);
	list.forEach(u => { u.tags = parseJsonField(u.tags, []); });
	res.json({ code: 200, data: { list, total } });
});

// 修改密码
router.post('/change_password', authMiddleware, (req, res) => {
	const { oldPassword, newPassword } = req.body;
	if (!oldPassword) return res.json({ code: 400, msg: '请输入旧密码' });
	if (!newPassword || newPassword.length < 4) return res.json({ code: 400, msg: '新密码至少4位' });
	const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.userId);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	const oldHashed = hashPwd(oldPassword);
	if (user.password !== oldHashed && user.password !== oldPassword) {
		return res.json({ code: 403, msg: '旧密码错误' });
	}
	db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPwd(newPassword), req.userId);
	res.json({ code: 200, msg: '密码修改成功' });
});

// 个人统计
router.get('/my_stats', authMiddleware, (req, res) => {
	const stats = db.prepare(`SELECT
		(SELECT COUNT(*) FROM notes WHERE user_id = ? AND status = 1) as noteCount,
		(SELECT COUNT(*) FROM signs WHERE user_id = ?) as signDays,
		(SELECT COUNT(*) FROM partners WHERE (user_id = ? OR target_id = ?) AND status = 1) as partnerCount,
		(SELECT COUNT(*) FROM checkin_records WHERE user_id = ?) as checkinCount
	`).get(req.userId, req.userId, req.userId, req.userId, req.userId);
	res.json({ code: 200, data: stats });
});

// 更新用户信息
router.put('/update', authMiddleware, (req, res) => {
	const nickname = pickFirstDefined(req.body.nickname, req.body.nickName);
	const avatar = pickFirstDefined(req.body.avatar, req.body.avatarUrl);
	const { mobile, tags, bio } = req.body;

	if (nickname !== undefined && nickname.trim()) {
		const existing = db.prepare('SELECT id FROM users WHERE nickname = ? AND id != ?').get(nickname.trim(), req.userId);
		if (existing) return res.json({ code: 400, msg: '该昵称已被占用，请换一个' });
	}

	const fields = [];
	const values = [];
	if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname.trim()); }
	if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
	if (mobile !== undefined) { fields.push('mobile = ?'); values.push(mobile); }
	if (tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(parseJsonField(tags, []))); }
	if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }

	if (fields.length > 0) {
		fields.push('updated_at = CURRENT_TIMESTAMP');
		values.push(req.userId);
		db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	}
	const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
	res.json({ code: 200, msg: '更新成功', data: normalizeUser(updated) });
});

module.exports = router;
