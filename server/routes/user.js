const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware, generateToken } = require('../middleware/auth');
const { normalizeUser, parseJsonField } = require('../lib/format');
const { resolveLoginOpenid } = require('../lib/login');

function pickFirstDefined(...values) {
	return values.find((value) => value !== undefined && value !== null);
}

// 微信登录（小程序 code 换 openid，这里简化处理）
router.post('/login', (req, res) => {
	const { code, demoUid } = req.body;
	const nickname = pickFirstDefined(req.body.nickname, req.body.nickName, '');
	const avatar = pickFirstDefined(req.body.avatar, req.body.avatarUrl, '');
	const openid = resolveLoginOpenid({ demoUid, code });
	if (!openid) return res.json({ code: 400, msg: '缺少登录凭证' });

	let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
	if (!user) {
		const info = db.prepare('INSERT INTO users (openid, nickname, avatar, login_cnt) VALUES (?, ?, ?, 1)');
		const result = info.run(openid, nickname || '', avatar || '');
		user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
	} else {
		db.prepare('UPDATE users SET login_cnt = login_cnt + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
		if (nickname !== undefined || avatar !== undefined) {
			db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
				.run(nickname !== undefined ? nickname : user.nickname, avatar !== undefined ? avatar : user.avatar, user.id);
		}
		user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
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
