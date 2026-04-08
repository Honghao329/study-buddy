const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 发表评论
router.post('/create', authMiddleware, (req, res) => {
	const { noteId, content } = req.body;
	const result = db.prepare('INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)').run(noteId, req.userId, content);
	db.prepare('UPDATE notes SET comment_cnt = comment_cnt + 1 WHERE id = ?').run(noteId);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// 删除评论
router.delete('/delete/:id', authMiddleware, (req, res) => {
	const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
	if (!comment) return res.json({ code: 403, msg: '无权操作' });
	db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
	db.prepare('UPDATE notes SET comment_cnt = CASE WHEN comment_cnt > 0 THEN comment_cnt - 1 ELSE 0 END WHERE id = ?').run(comment.note_id);
	res.json({ code: 200, msg: '删除成功' });
});

// 获取评论列表
router.get('/list', (req, res) => {
	const { noteId, page = 1, size = 20 } = req.query;
	const offset = (page - 1) * size;
	const total = db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE note_id = ? AND status = 1').get(noteId).cnt;
	const list = db.prepare(
		`SELECT c.*, u.nickname as user_name, u.avatar as user_pic
		 FROM comments c LEFT JOIN users u ON c.user_id = u.id
		 WHERE c.note_id = ? AND c.status = 1 ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
	).all(noteId, Number(size), offset);
	res.json({ code: 200, data: { list, total } });
});

module.exports = router;
