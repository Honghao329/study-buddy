const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware, generateToken } = require('../middleware/auth');

// 微信登录（小程序 code 换 openid，这里简化处理）
router.post('/login', (req, res) => {
	const { code, nickName, avatarUrl } = req.body;
	// 正式环境应调用微信接口用 code 换 openid，这里用 code 模拟
	const openid = code || ('user_' + Date.now());

	let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
	if (!user) {
		const info = db.prepare('INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)');
		const result = info.run(openid, nickName || '', avatarUrl || '');
		user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
	} else {
		db.prepare('UPDATE users SET login_cnt = login_cnt + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
		if (nickName) db.prepare('UPDATE users SET nickname = ?, avatar = ? WHERE id = ?').run(nickName, avatarUrl || '', user.id);
		user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
	}

	const token = generateToken({ userId: user.id, openid: user.openid });
	user.tags = JSON.parse(user.tags || '[]');
	res.json({ code: 200, data: { token, user } });
});

// 获取当前用户信息
router.get('/info', authMiddleware, (req, res) => {
	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
	if (!user) return res.json({ code: 404, msg: '用户不存在' });
	user.tags = JSON.parse(user.tags || '[]');
	res.json({ code: 200, data: user });
});

// 更新用户信息
router.put('/update', authMiddleware, (req, res) => {
	const { nickname, avatar, mobile, tags, bio } = req.body;
	const fields = [];
	const values = [];
	if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
	if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
	if (mobile !== undefined) { fields.push('mobile = ?'); values.push(mobile); }
	if (tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(tags)); }
	if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }

	if (fields.length > 0) {
		fields.push('updated_at = CURRENT_TIMESTAMP');
		values.push(req.userId);
		db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	}
	res.json({ code: 200, msg: '更新成功' });
});

module.exports = router;
