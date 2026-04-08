const router = require('express').Router();
const db = require('../config/db');

router.get('/list', (req, res) => {
	const { page = 1, size = 10, cate } = req.query;
	const offset = (page - 1) * size;
	let where = 'WHERE status = 1';
	const params = [];
	if (cate) { where += ' AND cate = ?'; params.push(cate); }

	const total = db.prepare(`SELECT COUNT(*) as cnt FROM news ${where}`).get(...params).cnt;
	const list = db.prepare(`SELECT id, title, description, pic, cate, view_cnt, created_at FROM news ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(size), offset);
	list.forEach(item => { item.pic = JSON.parse(item.pic || '[]'); });
	res.json({ code: 200, data: { list, total } });
});

router.get('/detail/:id', (req, res) => {
	const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
	if (!item) return res.json({ code: 404, msg: '不存在' });
	db.prepare('UPDATE news SET view_cnt = view_cnt + 1 WHERE id = ?').run(req.params.id);
	item.pic = JSON.parse(item.pic || '[]');
	res.json({ code: 200, data: item });
});

module.exports = router;
