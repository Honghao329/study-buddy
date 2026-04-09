const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { notifyPartnerInvite } = require('../lib/notify');

// 发送邀请
router.post('/invite', authMiddleware, (req, res) => {
	const { targetId } = req.body;
	const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
	if (!target) return res.json({ code: 404, msg: '用户不存在' });
	if (Number(targetId) === req.userId) return res.json({ code: 400, msg: '不能邀请自己' });

	const existing = db.prepare(
		`SELECT id FROM partners
		 WHERE ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))
		 AND status IN (0, 1)`
	).get(req.userId, targetId, targetId, req.userId);
	if (existing) return res.json({ code: 400, msg: '已存在邀请或伙伴关系' });

	const result = db.prepare('INSERT INTO partners (user_id, target_id, status) VALUES (?, ?, 0)').run(req.userId, targetId);
	notifyPartnerInvite(req.userId, targetId);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// 接受邀请
router.post('/accept', authMiddleware, (req, res) => {
	const { id } = req.body;
	db.prepare('UPDATE partners SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND target_id = ? AND status = 0').run(id, req.userId);
	res.json({ code: 200, msg: '已接受' });
});

// 拒绝邀请
router.post('/reject', authMiddleware, (req, res) => {
	const { id } = req.body;
	db.prepare('UPDATE partners SET status = 8, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND target_id = ? AND status = 0').run(id, req.userId);
	res.json({ code: 200, msg: '已拒绝' });
});

// 解除伙伴
router.post('/dissolve', authMiddleware, (req, res) => {
	const { id } = req.body;
	db.prepare('UPDATE partners SET status = 9, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (user_id = ? OR target_id = ?)').run(id, req.userId, req.userId);
	res.json({ code: 200, msg: '已解除' });
});

// 我的伙伴列表
router.get('/my_list', authMiddleware, (req, res) => {
	const list = db.prepare(
		`SELECT p.*,
		 u1.nickname as user_name, u1.avatar as user_pic,
		 u2.nickname as target_name, u2.avatar as target_pic
		 FROM partners p
		 LEFT JOIN users u1 ON p.user_id = u1.id
		 LEFT JOIN users u2 ON p.target_id = u2.id
		 WHERE (p.user_id = ? OR p.target_id = ?) AND p.status = 1
		 ORDER BY p.created_at DESC`
	).all(req.userId, req.userId);
	res.json({ code: 200, data: list });
});

// 待处理邀请
router.get('/pending_list', authMiddleware, (req, res) => {
	const list = db.prepare(
		`SELECT p.*, u.nickname as user_name, u.avatar as user_pic
		 FROM partners p LEFT JOIN users u ON p.user_id = u.id
		 WHERE p.target_id = ? AND p.status = 0 ORDER BY p.created_at DESC`
	).all(req.userId);
	res.json({ code: 200, data: list });
});

module.exports = router;
