const router = require('express').Router();
const db = require('../config/db');
const { sanitizePage } = require('../lib/validate');

router.get('/list', (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const { cate } = req.query;
	let where = 'WHERE status = 1';
	const params = [];
	if (cate) { where += ' AND cate = ?'; params.push(cate); }

	const total = db.prepare(`SELECT COUNT(*) as cnt FROM news ${where}`).get(...params).cnt;
	const list = db.prepare(`SELECT id, title, description, pic, cate, view_cnt, created_at FROM news ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`).all(...params, size, offset);
	list.forEach(item => { item.pic = JSON.parse(item.pic || '[]'); });
	res.json({ code: 200, data: { list, total } });
});

router.get('/detail/:id', (req, res) => {
	const item = db.prepare('SELECT * FROM news WHERE id = ? AND status = 1').get(req.params.id);
	if (!item) return res.json({ code: 404, msg: '不存在' });
	db.prepare('UPDATE news SET view_cnt = view_cnt + 1 WHERE id = ?').run(req.params.id);
	item.view_cnt = (item.view_cnt || 0) + 1;
	item.pic = JSON.parse(item.pic || '[]');
	res.json({ code: 200, data: item });
});

module.exports = router;
