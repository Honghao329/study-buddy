const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { getLocalDateString } = require('../lib/date');
const { sanitizePage, trimText, clampInt } = require('../lib/validate');
const { fillAvatars, fillAvatarsList } = require('../lib/format');
const { sendMessage } = require('../lib/notify');

// 用户创建打卡任务
router.post('/create', authMiddleware, (req, res) => {
	const title = trimText(req.body.title, 100);
	const description = trimText(req.body.description, 500);
	if (!title) return res.json({ code: 400, msg: '请输入标题' });
	const result = db.prepare('INSERT INTO checkins (title, description, creator_id) VALUES (?, ?, ?)')
		.run(title, description, req.userId);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

router.get('/list', (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const { search } = req.query;
	let where = 'WHERE status = 1';
	const params = [];
	if (search) { where += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
	const total = db.prepare(`SELECT COUNT(*) as cnt FROM checkins ${where}`).get(...params).cnt;
	const list = db.prepare(`SELECT * FROM checkins ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, size, offset);
	res.json({ code: 200, data: { list, total } });
});

// 打卡任务详情
router.get('/detail/:id', optionalAuth, (req, res) => {
	const item = db.prepare(
		`SELECT c.*, u.nickname as supervisor_display_name, u.avatar as supervisor_avatar,
		 cu.nickname as creator_name, cu.avatar as creator_avatar
		 FROM checkins c
		 LEFT JOIN users u ON c.supervisor_id = u.id
		 LEFT JOIN users cu ON c.creator_id = cu.id
		 WHERE c.id = ? AND c.status = 1`
	).get(req.params.id);
	if (!item) return res.json({ code: 404, msg: '不存在' });

	item.has_supervisor = !!item.supervisor_id;
	item.is_supervisor = req.userId && item.supervisor_id === req.userId;
	item.is_creator = req.userId && item.creator_id === req.userId;

	let today_done = false, has_participated = false, my_total = 0;
	if (req.userId) {
		const today = getLocalDateString();
		today_done = !!db.prepare('SELECT 1 FROM checkin_records WHERE checkin_id = ? AND user_id = ? AND day = ?').get(req.params.id, req.userId, today);
		my_total = db.prepare('SELECT COUNT(*) as cnt FROM checkin_records WHERE checkin_id = ? AND user_id = ?').get(req.params.id, req.userId).cnt;
		has_participated = my_total > 0;
	}

	item.today_done = today_done;
	item.has_participated = has_participated;
	item.my_total = my_total;
	fillAvatars(item);
	res.json({ code: 200, data: item });
});

// 参与打卡（幂等：今日已打卡则返回成功不重复插入）
router.post('/join', authMiddleware, (req, res) => {
	const { checkinId, content } = req.body;
	const item = db.prepare('SELECT id FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '不存在' });
	const today = getLocalDateString();
	const existing = db.prepare('SELECT id FROM checkin_records WHERE checkin_id = ? AND user_id = ? AND day = ?').get(checkinId, req.userId, today);
	if (existing) return res.json({ code: 200, msg: '今日已打卡', data: { alreadyDone: true } });

	db.prepare('INSERT INTO checkin_records (checkin_id, user_id, day, content) VALUES (?, ?, ?, ?)').run(checkinId, req.userId, today, trimText(content, 2000));
	db.prepare('UPDATE checkins SET join_cnt = join_cnt + 1 WHERE id = ?').run(checkinId);
	res.json({ code: 200, msg: '打卡成功' });
});

// 我参与过的打卡任务ID集合
router.get('/my_joined_ids', authMiddleware, (req, res) => {
	const rows = db.prepare('SELECT DISTINCT checkin_id FROM checkin_records WHERE user_id = ? LIMIT 1000').all(req.userId);
	res.json({ code: 200, data: rows.map(r => r.checkin_id) });
});

// 今日已打卡的任务ID集合
router.get('/today_done_ids', authMiddleware, (req, res) => {
	const today = getLocalDateString();
	const rows = db.prepare('SELECT DISTINCT checkin_id FROM checkin_records WHERE user_id = ? AND day = ?').all(req.userId, today);
	res.json({ code: 200, data: rows.map(r => r.checkin_id) });
});

// 邀请学伴监督（幂等：已有监督人则拒绝）
router.post('/invite_supervisor', authMiddleware, (req, res) => {
	const { checkinId, supervisorId } = req.body;
	const item = db.prepare('SELECT * FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '打卡任务不存在' });
	if (item.creator_id !== req.userId) return res.json({ code: 403, msg: '只有创建者才能邀请监督' });
	if (item.supervisor_id) return res.json({ code: 400, msg: '已有监督人，不能重复邀请' });
	if (Number(supervisorId) === req.userId) return res.json({ code: 400, msg: '不能监督自己' });

	const supervisor = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(supervisorId);
	if (!supervisor) return res.json({ code: 404, msg: '用户不存在' });

	const isPartner = db.prepare(
		'SELECT 1 FROM partners WHERE status = 1 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))'
	).get(req.userId, supervisorId, supervisorId, req.userId);
	if (!isPartner) return res.json({ code: 403, msg: '只能邀请学伴作为监督' });

	// 直接设置监督人（简化流程，毕设够用）
	db.prepare('UPDATE checkins SET supervisor_id = ?, supervisor_name = ? WHERE id = ?')
		.run(supervisorId, supervisor.nickname || '', checkinId);

	// 通知对方
	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.userId);
	sendMessage(supervisorId, req.userId, 'supervisor', '监督邀请',
		(sender ? sender.nickname : '有人') + ' 邀请你监督打卡任务「' + item.title + '」', checkinId);
	res.json({ code: 200, msg: '已设置监督人' });
});

// 监督者评价某条打卡记录（幂等：已评价则拒绝）
router.post('/comment_record', authMiddleware, (req, res) => {
	const { recordId, comment } = req.body;
	const trimmed = trimText(comment, 500);
	if (!trimmed) return res.json({ code: 400, msg: '请输入点评内容' });
	const record = db.prepare(
		`SELECT cr.*, c.supervisor_id FROM checkin_records cr
		 LEFT JOIN checkins c ON cr.checkin_id = c.id WHERE cr.id = ?`
	).get(recordId);
	if (!record) return res.json({ code: 404, msg: '记录不存在' });
	if (record.supervisor_id !== req.userId) return res.json({ code: 403, msg: '只有监督者可以评价' });
	if (record.comment) return res.json({ code: 400, msg: '已评价过了' });

	db.prepare('UPDATE checkin_records SET comment = ? WHERE id = ?').run(trimmed, recordId);
	res.json({ code: 200, msg: '评价成功' });
});

// 监督者催打卡
router.post('/remind', authMiddleware, (req, res) => {
	const { checkinId } = req.body;
	const item = db.prepare('SELECT id, title, supervisor_id, creator_id FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '任务不存在' });
	if (item.supervisor_id !== req.userId) return res.json({ code: 403, msg: '只有监督者可以催打卡' });

	// 检查今天是否已催过（幂等）
	const today = getLocalDateString();
	const alreadyReminded = db.prepare(
		"SELECT 1 FROM messages WHERE from_id = ? AND user_id = ? AND type = 'remind' AND related_id = ? AND date(created_at) = ?"
	).get(req.userId, item.creator_id, checkinId, today);
	if (alreadyReminded) return res.json({ code: 200, msg: '今天已催过了' });

	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.userId);
	sendMessage(item.creator_id, req.userId, 'remind', '打卡提醒',
		(sender ? sender.nickname : '你的监督人') + ' 提醒你完成「' + item.title + '」打卡', checkinId);
	res.json({ code: 200, msg: '提醒已发送' });
});

// 打卡记录时间线
router.get('/records/:id', authMiddleware, (req, res) => {
	const { size, offset } = sanitizePage(req.query);
	const list = db.prepare(
		`SELECT cr.*, u.nickname as user_name, u.avatar as user_avatar
		 FROM checkin_records cr LEFT JOIN users u ON cr.user_id = u.id
		 WHERE cr.checkin_id = ? ORDER BY cr.created_at DESC LIMIT ? OFFSET ?`
	).all(req.params.id, size, offset);
	const total = db.prepare('SELECT COUNT(*) as cnt FROM checkin_records WHERE checkin_id = ?').get(req.params.id).cnt;
	res.json({ code: 200, data: { list: fillAvatarsList(list), total } });
});

// 邀请学伴加入打卡（幂等：同人同任务24小时内只发一次）
router.post('/invite_join', authMiddleware, (req, res) => {
	const { checkinId, targetUserId } = req.body;
	const item = db.prepare('SELECT id, title FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '打卡任务不存在' });

	const isPartner = db.prepare(
		'SELECT 1 FROM partners WHERE status = 1 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))'
	).get(req.userId, targetUserId, targetUserId, req.userId);
	if (!isPartner) return res.json({ code: 403, msg: '只能邀请学伴' });

	// 幂等：24小时内不重复发
	const recent = db.prepare(
		"SELECT 1 FROM messages WHERE from_id = ? AND user_id = ? AND type = 'checkin_invite' AND related_id = ? AND created_at > datetime('now', '-1 day')"
	).get(req.userId, targetUserId, checkinId);
	if (recent) return res.json({ code: 200, msg: '已发送过邀请' });

	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.userId);
	sendMessage(targetUserId, req.userId, 'checkin_invite', '打卡邀请',
		(sender ? sender.nickname : '有人') + ' 邀请你加入打卡任务「' + item.title + '」', checkinId);
	res.json({ code: 200, msg: '邀请已发送' });
});

module.exports = router;
