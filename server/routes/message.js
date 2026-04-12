const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sanitizePage } = require('../lib/validate');
const { fillAvatarsList } = require('../lib/format');

// 我的消息列表
router.get('/list', authMiddleware, (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const total = db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ?').get(req.userId).cnt;
	const list = db.prepare(
		`SELECT m.*, u.nickname as from_name, u.avatar as from_avatar
		 FROM messages m LEFT JOIN users u ON m.from_id = u.id
		 WHERE m.user_id = ? ORDER BY m.created_at DESC LIMIT ? OFFSET ?`
	).all(req.userId, size, offset);
	res.json({ code: 200, data: { list: fillAvatarsList(list), total } });
});

// 未读数
router.get('/unread_count', authMiddleware, (req, res) => {
	const cnt = db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND is_read = 0').get(req.userId).cnt;
	res.json({ code: 200, data: cnt });
});

// 标记已读
router.post('/read', authMiddleware, (req, res) => {
	const { id } = req.body;
	if (id) {
		db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.userId);
	} else {
		db.prepare('UPDATE messages SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.userId);
	}
	res.json({ code: 200, msg: '已读' });
});

// 催打卡（监督者发送提醒）
router.post('/remind', authMiddleware, (req, res) => {
	const { checkinId, targetUserId } = req.body;
	const checkin = db.prepare('SELECT id, title, supervisor_id, creator_id FROM checkins WHERE id = ?').get(checkinId);
	if (!checkin) return res.json({ code: 404, msg: '打卡任务不存在' });
	if (checkin.supervisor_id !== req.userId) return res.json({ code: 403, msg: '只有监督者可以催打卡' });

	// 校验 targetUserId 是该任务的创建者或参与者
	const isTarget = targetUserId === checkin.creator_id ||
		!!db.prepare('SELECT 1 FROM checkin_records WHERE checkin_id = ? AND user_id = ?').get(checkinId, targetUserId);
	if (!isTarget) return res.json({ code: 403, msg: '该用户不是此任务的参与者' });

	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.userId);
	db.prepare(
		'INSERT INTO messages (user_id, from_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?, ?)'
	).run(
		targetUserId, req.userId, 'remind',
		'打卡提醒',
		(sender ? sender.nickname : '你的监督者') + ' 提醒你完成「' + checkin.title + '」打卡',
		checkinId
	);
	res.json({ code: 200, msg: '提醒已发送' });
});

module.exports = router;
