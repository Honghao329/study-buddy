const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authMiddleware, SECRET } = require('../middleware/auth');
const { canViewNote } = require('../lib/access');
const { deleteNoteCascade } = require('../lib/cleanup');
const { normalizeNote, parseJsonField } = require('../lib/format');

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

// 创建笔记
router.post('/create', authMiddleware, (req, res) => {
	const { title, content, images, visibility, tags } = req.body;
	const noteTitle = String(title || '').trim();
	if (!noteTitle) return res.json({ code: 400, msg: '标题不能为空' });
	const result = db.prepare(
		'INSERT INTO notes (user_id, title, content, images, visibility, tags) VALUES (?, ?, ?, ?, ?, ?)'
	).run(
		req.userId,
		noteTitle,
		String(content || ''),
		JSON.stringify(parseJsonField(images, [])),
		visibility || 'public',
		JSON.stringify(parseJsonField(tags, []))
	);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// 获取我的笔记列表
router.get('/my_list', authMiddleware, (req, res) => {
	const { page = 1, size = 10, search, visibility } = req.query;
	const offset = (page - 1) * size;
	let where = 'WHERE n.user_id = ?';
	const params = [req.userId];

	if (search) { where += ' AND n.title LIKE ?'; params.push(`%${search}%`); }
	if (visibility) { where += ' AND n.visibility = ?'; params.push(visibility); }

	const total = db.prepare(`SELECT COUNT(*) as cnt FROM notes n ${where}`).get(...params).cnt;
	const list = db.prepare(
		`SELECT n.*, u.nickname as user_name, u.avatar as user_pic
		 FROM notes n LEFT JOIN users u ON n.user_id = u.id ${where}
		 ORDER BY n.created_at DESC LIMIT ? OFFSET ?`
	).all(...params, Number(size), offset);

	res.json({ code: 200, data: { list: list.map(normalizeNote), total } });
});

// 获取公开笔记列表（社区广场）
router.get('/public_list', (req, res) => {
	const { page = 1, size = 10, search, tag, sort = 'new' } = req.query;
	const offset = (page - 1) * size;
	let where = "WHERE n.visibility = 'public' AND n.status = 1";
	const params = [];

	if (search) { where += ' AND n.title LIKE ?'; params.push(`%${search}%`); }
	if (tag) { where += ' AND n.tags LIKE ?'; params.push(`%${tag}%`); }

	const orderBy = sort === 'hot' ? 'n.like_cnt DESC, n.created_at DESC' : 'n.created_at DESC';

	const total = db.prepare(`SELECT COUNT(*) as cnt FROM notes n ${where}`).get(...params).cnt;
	const list = db.prepare(
		`SELECT n.*, u.nickname as user_name, u.avatar as user_pic
		 FROM notes n LEFT JOIN users u ON n.user_id = u.id ${where}
		 ORDER BY ${orderBy} LIMIT ? OFFSET ?`
	).all(...params, Number(size), offset);

	res.json({ code: 200, data: { list: list.map(normalizeNote), total } });
});

// 笔记详情
router.get('/detail/:id', optionalAuth, (req, res) => {
	const note = db.prepare(
		`SELECT n.*, u.nickname as user_name, u.avatar as user_pic
		 FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE n.id = ?`
	).get(req.params.id);
	if (!note) return res.json({ code: 404, msg: '笔记不存在' });

	const isPartner = checkPartnerAccess(note.user_id, req.userId);
	if (!canViewNote(note, req.userId, isPartner)) {
		return res.json({ code: 403, msg: '无权查看' });
	}

	db.prepare('UPDATE notes SET view_cnt = view_cnt + 1 WHERE id = ?').run(req.params.id);
	note.view_cnt++;
	if (req.userId) {
		const isLiked = !!db.prepare(
			'SELECT 1 FROM likes WHERE user_id = ? AND target_id = ? AND target_type = ?'
		).get(req.userId, req.params.id, 'note');
		const isFaved = !!db.prepare(
			'SELECT 1 FROM favorites WHERE user_id = ? AND target_id = ? AND target_type = ?'
		).get(req.userId, req.params.id, 'note');
		note.is_liked = isLiked ? 1 : 0;
		note.is_faved = isFaved ? 1 : 0;
	}
	res.json({ code: 200, data: normalizeNote(note) });
});

// 编辑笔记
router.put('/update/:id', authMiddleware, (req, res) => {
	const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
	if (!note) return res.json({ code: 403, msg: '无权操作' });

	const { title, content, images, visibility, tags } = req.body;
	const noteTitle = String(title || '').trim();
	if (!noteTitle) return res.json({ code: 400, msg: '标题不能为空' });
	db.prepare(
		`UPDATE notes SET title = ?, content = ?, images = ?, visibility = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	).run(
		noteTitle,
		String(content || ''),
		JSON.stringify(parseJsonField(images, [])),
		visibility || 'public',
		JSON.stringify(parseJsonField(tags, [])),
		req.params.id
	);
	res.json({ code: 200, msg: '更新成功' });
});

// 删除笔记
router.delete('/delete/:id', authMiddleware, (req, res) => {
	const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
	if (!note) return res.json({ code: 403, msg: '无权操作' });

	deleteNoteCascade(db, req.params.id);
	res.json({ code: 200, msg: '删除成功' });
});

module.exports = router;
