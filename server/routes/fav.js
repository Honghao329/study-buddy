const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.post('/toggle', authMiddleware, (req, res) => {
	const { targetId, targetType, title } = req.body;
	const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_id = ? AND target_type = ?').get(req.userId, targetId, targetType);
	if (existing) {
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
	const list = db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
	res.json({ code: 200, data: list });
});

module.exports = router;
