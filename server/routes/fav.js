const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { resolveFavoriteToggleAction } = require('../lib/favorite');
const { normalizeNote } = require('../lib/format');

function checkPartnerAccess(ownerId, userId) {
	if (!userId || Number(ownerId) === Number(userId)) return false;

	return !!db.prepare(
		`SELECT 1 FROM partners
		 WHERE status = 1
		 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))
		 LIMIT 1`
	).get(ownerId, userId, userId, ownerId);
}

router.post('/toggle', authMiddleware, (req, res) => {
	const { targetId, targetType, title } = req.body;
	if (targetType !== 'note') return res.json({ code: 400, msg: '仅支持笔记收藏' });
	const note = db.prepare('SELECT id, user_id, visibility, status FROM notes WHERE id = ?').get(targetId);
	if (!note) return res.json({ code: 404, msg: '目标不存在' });
	const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_id = ? AND target_type = ?').get(req.userId, targetId, targetType);
	const isPartner = checkPartnerAccess(note.user_id, req.userId);
	const decision = resolveFavoriteToggleAction({ note, existingFavorite: existing, userId: req.userId, isPartner });
	if (decision.error) return res.json(decision.error);

	if (decision.action === 'delete') {
		db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
		if (targetType === 'note') db.prepare('UPDATE notes SET fav_cnt = CASE WHEN fav_cnt > 0 THEN fav_cnt - 1 ELSE 0 END WHERE id = ?').run(targetId);
		res.json({ code: 200, data: { isFav: 0 } });
	} else {
		db.prepare('INSERT INTO favorites (user_id, target_id, target_type, title) VALUES (?, ?, ?, ?)').run(req.userId, targetId, targetType, title || '');
		if (targetType === 'note') db.prepare('UPDATE notes SET fav_cnt = fav_cnt + 1 WHERE id = ?').run(targetId);
		res.json({ code: 200, data: { isFav: 1 } });
	}
});

router.get('/my_list', authMiddleware, (req, res) => {
	const list = db.prepare(
		`SELECT f.id as favorite_id,
		 f.created_at as favorite_created_at,
		 f.user_id as favorite_user_id,
		 f.target_id,
		 f.target_type,
		 f.title as favorite_title,
		 n.*,
		 n.title as note_title, n.content as note_content, n.like_cnt, n.comment_cnt, n.view_cnt,
		 u.nickname as author_name, u.avatar as author_avatar
		 FROM favorites f
		 LEFT JOIN notes n ON f.target_type = 'note' AND f.target_id = n.id
		 LEFT JOIN users u ON n.user_id = u.id
		 WHERE f.user_id = ? ORDER BY f.created_at DESC`
	).all(req.userId);
	res.json({ code: 200, data: list.map(normalizeNote) });
});

module.exports = router;
