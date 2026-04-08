const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 创建笔记
router.post('/create', authMiddleware, (req, res) => {
	const { title, content, images, visibility, tags } = req.body;
	const result = db.prepare(
		'INSERT INTO notes (user_id, title, content, images, visibility, tags) VALUES (?, ?, ?, ?, ?, ?)'
	).run(req.userId, title, content || '', JSON.stringify(images || []), visibility || 'public', JSON.stringify(tags || []));
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

	list.forEach(item => {
		item.images = JSON.parse(item.images || '[]');
		item.tags = JSON.parse(item.tags || '[]');
	});

	res.json({ code: 200, data: { list, total } });
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

	list.forEach(item => {
		item.images = JSON.parse(item.images || '[]');
		item.tags = JSON.parse(item.tags || '[]');
	});

	res.json({ code: 200, data: { list, total } });
});

// 笔记详情
router.get('/detail/:id', (req, res) => {
	const note = db.prepare(
		`SELECT n.*, u.nickname as user_name, u.avatar as user_pic
		 FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE n.id = ?`
	).get(req.params.id);
	if (!note) return res.json({ code: 404, msg: '笔记不存在' });

	db.prepare('UPDATE notes SET view_cnt = view_cnt + 1 WHERE id = ?').run(req.params.id);
	note.view_cnt++;
	note.images = JSON.parse(note.images || '[]');
	note.tags = JSON.parse(note.tags || '[]');
	res.json({ code: 200, data: note });
});

// 编辑笔记
router.put('/update/:id', authMiddleware, (req, res) => {
	const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
	if (!note) return res.json({ code: 403, msg: '无权操作' });

	const { title, content, images, visibility, tags } = req.body;
	db.prepare(
		`UPDATE notes SET title = ?, content = ?, images = ?, visibility = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	).run(title, content || '', JSON.stringify(images || []), visibility || 'public', JSON.stringify(tags || []), req.params.id);
	res.json({ code: 200, msg: '更新成功' });
});

// 删除笔记
router.delete('/delete/:id', authMiddleware, (req, res) => {
	db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
	res.json({ code: 200, msg: '删除成功' });
});

module.exports = router;
