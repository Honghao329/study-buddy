const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { canViewNote } = require('../lib/access');
const { notifyLike } = require('../lib/notify');

function checkPartnerAccess(ownerId, userId) {
	if (!userId || Number(ownerId) === Number(userId)) return false;

	return !!db.prepare(
		`SELECT 1 FROM partners
		 WHERE status = 1
		 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))
		 LIMIT 1`
	).get(ownerId, userId, userId, ownerId);
}

function assertTargetAccessible(targetId, targetType, userId) {
	if (!targetType || !targetId) {
		return { code: 400, msg: '参数错误' };
	}

	if (targetType === 'note') {
		const note = db.prepare('SELECT id, user_id, visibility, status FROM notes WHERE id = ?').get(targetId);
		if (!note) return { code: 404, msg: '目标不存在' };

		const isPartner = checkPartnerAccess(note.user_id, userId);
		if (!canViewNote(note, userId, isPartner)) {
			return { code: 403, msg: '无权操作' };
		}

		return null;
	}

	if (targetType === 'comment') {
		const comment = db.prepare(
			`SELECT c.id, c.status as comment_status, n.user_id as note_user_id, n.visibility, n.status
			 FROM comments c LEFT JOIN notes n ON c.note_id = n.id
			 WHERE c.id = ?`
		).get(targetId);

		if (!comment || !comment.note_user_id) return { code: 404, msg: '目标不存在' };
		if (Number(comment.comment_status || 1) !== 1) return { code: 404, msg: '目标不存在' };

		const note = {
			user_id: comment.note_user_id,
			visibility: comment.visibility,
			status: comment.status,
		};
		const isPartner = checkPartnerAccess(comment.note_user_id, userId);
		if (!canViewNote(note, userId, isPartner)) {
			return { code: 403, msg: '无权操作' };
		}

		return null;
	}

	return { code: 400, msg: '不支持的类型' };
}

// 切换点赞
router.post('/toggle', authMiddleware, (req, res) => {
	const { targetId, targetType } = req.body;
	const targetError = assertTargetAccessible(targetId, targetType, req.userId);
	if (targetError) return res.json(targetError);
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
		if (targetType === 'note') {
			db.prepare('UPDATE notes SET like_cnt = like_cnt + 1 WHERE id = ?').run(targetId);
			notifyLike(req.userId, targetId);
		}
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
