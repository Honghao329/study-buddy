const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware, optionalAuth, generateToken } = require('../middleware/auth');
const { normalizeUser, parseJsonField } = require('../lib/format');

function pickFirstDefined(...values) {
	return values.find((value) => value !== undefined && value !== null);
}

// 登录/注册（昵称+密码）
router.post('/login', (req, res) => {
	const nickname = (pickFirstDefined(req.body.nickname, req.body.nickName, '') || '').trim();
	const password = (req.body.password || '').trim();
	const avatar = pickFirstDefined(req.body.avatar, req.body.avatarUrl, '');

	if (!nickname) return res.json({ code: 400, msg: '请输入昵称' });
	if (!password || password.length < 4) return res.json({ code: 400, msg: '密码至少4位' });

	let user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
	if (user) {
		// 已有用户 → 验证密码
		if (user.password && user.password !== password) {
			return res.json({ code: 401, msg: '密码错误' });
		}
		// 老用户没密码 → 设置密码
		if (!user.password) {
			db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password, user.id);
		}
		db.prepare('UPDATE users SET login_cnt = login_cnt + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
		if (avatar) {
			db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatar, user.id);
		}
		user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
	} else {
		// 新用户 → 注册
		const openid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
		const result = db.prepare('INSERT INTO users (openid, nickname, avatar, password, login_cnt) VALUES (?, ?, ?, ?, 1)')
			.run(openid, nickname, avatar || '', password);
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

// 更新用户信息
router.put('/update', authMiddleware, (req, res) => {
	const nickname = pickFirstDefined(req.body.nickname, req.body.nickName);
	const avatar = pickFirstDefined(req.body.avatar, req.body.avatarUrl);
	const { mobile, tags, bio } = req.body;
	const fields = [];
	const values = [];
	if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
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
