const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authMiddleware, SECRET } = require('../middleware/auth');
const { canViewNote } = require('../lib/access');
const { deleteCommentCascade } = require('../lib/cleanup');
const { normalizeComment } = require('../lib/format');

function optionalAuth(req, res, next) {
	const token = req.headers['x-token'] || req.headers['authorization'];
	if (token) {
		try {
			req.userId = jwt.verify(token.replace('Bearer ', ''), SECRET).userId;
		} catch (error) {}
	}
	next();
}

function checkPartnerAccess(ownerId, userId) {
	if (!userId || Number(ownerId) === Number(userId)) return false;

	return !!db.prepare(
		`SELECT 1 FROM partners
		 WHERE status = 1
		 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))
		 LIMIT 1`
	).get(ownerId, userId, userId, ownerId);
}

// 发表评论
router.post('/create', authMiddleware, (req, res) => {
	const { noteId, content } = req.body;
	const trimmedContent = String(content || '').trim();
	if (!trimmedContent) return res.json({ code: 400, msg: '评论内容不能为空' });

	const note = db.prepare('SELECT id, user_id, visibility, status FROM notes WHERE id = ?').get(noteId);
	if (!note) return res.json({ code: 404, msg: '笔记不存在' });

	const isPartner = checkPartnerAccess(note.user_id, req.userId);
	if (!canViewNote(note, req.userId, isPartner)) {
		return res.json({ code: 403, msg: '无权评论' });
	}

	const result = db.prepare('INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)').run(noteId, req.userId, String(trimmedContent));
	db.prepare('UPDATE notes SET comment_cnt = comment_cnt + 1 WHERE id = ?').run(noteId);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// 删除评论
router.delete('/delete/:id', authMiddleware, (req, res) => {
	const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
	if (!comment) return res.json({ code: 403, msg: '无权操作' });
	deleteCommentCascade(db, req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

// 获取评论列表
router.get('/list', optionalAuth, (req, res) => {
	const { noteId, page = 1, size = 20 } = req.query;
	const offset = (page - 1) * size;
	const note = db.prepare('SELECT id, user_id, visibility, status FROM notes WHERE id = ?').get(noteId);
	if (!note) return res.json({ code: 404, msg: '笔记不存在' });

	const isPartner = checkPartnerAccess(note.user_id, req.userId);
	if (!canViewNote(note, req.userId, isPartner)) {
		return res.json({ code: 403, msg: '无权查看' });
	}

	const total = db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE note_id = ? AND status = 1').get(noteId).cnt;
	const list = db.prepare(
		`SELECT c.*, u.nickname as user_name, u.avatar as user_pic
		 FROM comments c LEFT JOIN users u ON c.user_id = u.id
		 WHERE c.note_id = ? AND c.status = 1 ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
	).all(noteId, Number(size), offset);
	res.json({ code: 200, data: { list: list.map(normalizeComment), total } });
});

module.exports = router;
