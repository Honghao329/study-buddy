const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 切换点赞
router.post('/toggle', authMiddleware, (req, res) => {
	const { targetId, targetType } = req.body;
	const existing = db.prepare(
		'SELECT id FROM likes WHERE user_id = ? AND target_id = ? AND target_type = ?'
	).get(req.userId, targetId, targetType);

	if (existing) {
		db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
		if (targetType === 'note') db.prepare('UPDATE notes SET like_cnt = CASE WHEN like_cnt > 0 THEN like_cnt - 1 ELSE 0 END WHERE id = ?').run(targetId);
		if (targetType === 'comment') db.prepare('UPDATE comments SET like_cnt = CASE WHEN like_cnt > 0 THEN like_cnt - 1 ELSE 0 END WHERE id = ?').run(targetId);
		res.json({ code: 200, data: { isLiked: 0 } });
	} else {
		db.prepare('INSERT INTO likes (user_id, target_id, target_type) VALUES (?, ?, ?)').run(req.userId, targetId, targetType);
		if (targetType === 'note') db.prepare('UPDATE notes SET like_cnt = like_cnt + 1 WHERE id = ?').run(targetId);
		if (targetType === 'comment') db.prepare('UPDATE comments SET like_cnt = like_cnt + 1 WHERE id = ?').run(targetId);
		res.json({ code: 200, data: { isLiked: 1 } });
	}
});

// 检查是否已赞
router.get('/check', authMiddleware, (req, res) => {
	const { targetId, targetType } = req.query;
	const cnt = db.prepare(
		'SELECT COUNT(*) as cnt FROM likes WHERE user_id = ? AND target_id = ? AND target_type = ?'
	).get(req.userId, targetId, targetType).cnt;
	res.json({ code: 200, data: { isLiked: cnt > 0 ? 1 : 0 } });
});

// 批量检查点赞状态
router.post('/batch_status', authMiddleware, (req, res) => {
	const { targetIds, targetType } = req.body;
	if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
		return res.json({ code: 200, data: [] });
	}
	const placeholders = targetIds.map(() => '?').join(',');
	const rows = db.prepare(
		`SELECT target_id FROM likes WHERE user_id = ? AND target_type = ? AND target_id IN (${placeholders})`
	).all(req.userId, targetType, ...targetIds);
	const likedIds = rows.map(r => r.target_id);
	res.json({ code: 200, data: likedIds });
});

module.exports = router;
