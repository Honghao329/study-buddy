const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { getLocalDateString } = require('../lib/date');
const { sanitizePage, trimText } = require('../lib/validate');
const { fillAvatars, fillAvatarsList } = require('../lib/format');
const { sendMessage } = require('../lib/notify');

// ===== 创建打卡任务 =====
router.post('/create', authMiddleware, (req, res) => {
	const title = trimText(req.body.title, 100);
	const description = trimText(req.body.description, 500);
	if (!title) return res.json({ code: 400, msg: '请输入标题' });
	const result = db.prepare('INSERT INTO checkins (title, description, creator_id) VALUES (?, ?, ?)')
		.run(title, description, req.userId);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// ===== 任务列表 =====
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

// ===== 任务详情 =====
router.get('/detail/:id', optionalAuth, (req, res) => {
	const item = db.prepare(
		`SELECT c.*, cu.nickname as creator_name, cu.avatar as creator_avatar
		 FROM checkins c LEFT JOIN users cu ON c.creator_id = cu.id
		 WHERE c.id = ? AND c.status = 1`
	).get(req.params.id);
	if (!item) return res.json({ code: 404, msg: '不存在' });

	let today_done = false, has_participated = false, my_total = 0;
	let my_supervisor = null;   // 我邀请的监督人
	let supervising_me = null;  // 监督我的人（别人邀请我做监督则 supervising_user）
	let i_supervise = [];       // 我监督的人列表

	if (req.userId) {
		const today = getLocalDateString();
		today_done = !!db.prepare('SELECT 1 FROM checkin_records WHERE checkin_id = ? AND user_id = ? AND day = ?').get(req.params.id, req.userId, today);
		my_total = db.prepare('SELECT COUNT(*) as cnt FROM checkin_records WHERE checkin_id = ? AND user_id = ?').get(req.params.id, req.userId).cnt;
		has_participated = my_total > 0;

		// 我邀请的监督人
		const mySup = db.prepare(
			`SELECT cs.supervisor_id, u.nickname, u.avatar FROM checkin_supervisors cs
			 LEFT JOIN users u ON cs.supervisor_id = u.id
			 WHERE cs.checkin_id = ? AND cs.user_id = ?`
		).get(req.params.id, req.userId);
		if (mySup) {
			my_supervisor = fillAvatars({ id: mySup.supervisor_id, nickname: mySup.nickname, avatar: mySup.avatar });
		}

		// 我监督的人列表
		const supRows = db.prepare(
			`SELECT cs.user_id, u.nickname, u.avatar FROM checkin_supervisors cs
			 LEFT JOIN users u ON cs.user_id = u.id
			 WHERE cs.checkin_id = ? AND cs.supervisor_id = ?`
		).all(req.params.id, req.userId);
		i_supervise = fillAvatarsList(supRows);
	}

	item.today_done = today_done;
	item.has_participated = has_participated;
	item.my_total = my_total;
	item.my_supervisor = my_supervisor;
	item.i_supervise = i_supervise;
	fillAvatars(item);
	res.json({ code: 200, data: item });
});

// ===== 打卡（幂等） =====
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

// ===== 邀请学伴监督我（每人每任务只能有一个监督人，幂等） =====
router.post('/invite_supervisor', authMiddleware, (req, res) => {
	const { checkinId, supervisorId } = req.body;
	const item = db.prepare('SELECT id, title FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '打卡任务不存在' });
	if (Number(supervisorId) === req.userId) return res.json({ code: 400, msg: '不能监督自己' });

	// 检查是否已有监督人
	const existing = db.prepare('SELECT id FROM checkin_supervisors WHERE checkin_id = ? AND user_id = ?').get(checkinId, req.userId);
	if (existing) return res.json({ code: 200, msg: '已有监督人' });

	// 必须是学伴
	const isPartner = db.prepare(
		'SELECT 1 FROM partners WHERE status = 1 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))'
	).get(req.userId, supervisorId, supervisorId, req.userId);
	if (!isPartner) return res.json({ code: 403, msg: '只能邀请学伴作为监督' });

	db.prepare('INSERT INTO checkin_supervisors (checkin_id, user_id, supervisor_id) VALUES (?, ?, ?)').run(checkinId, req.userId, supervisorId);

	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.userId);
	sendMessage(supervisorId, req.userId, 'supervisor', '监督邀请',
		(sender ? sender.nickname : '有人') + ' 邀请你监督TA的打卡任务「' + item.title + '」', checkinId);
	res.json({ code: 200, msg: '已设置监督人' });
});

// ===== 监督者点评打卡记录（幂等） =====
router.post('/comment_record', authMiddleware, (req, res) => {
	const { recordId, comment } = req.body;
	const trimmed = trimText(comment, 500);
	if (!trimmed) return res.json({ code: 400, msg: '请输入点评内容' });
	const record = db.prepare('SELECT * FROM checkin_records WHERE id = ?').get(recordId);
	if (!record) return res.json({ code: 404, msg: '记录不存在' });
	if (record.comment) return res.json({ code: 400, msg: '已评价过了' });

	// 验证：当前用户是该打卡者在该任务上的监督人
	const isSup = db.prepare('SELECT 1 FROM checkin_supervisors WHERE checkin_id = ? AND user_id = ? AND supervisor_id = ?')
		.get(record.checkin_id, record.user_id, req.userId);
	if (!isSup) return res.json({ code: 403, msg: '你不是该用户的监督人' });

	db.prepare('UPDATE checkin_records SET comment = ? WHERE id = ?').run(trimmed, recordId);
	res.json({ code: 200, msg: '评价成功' });
});

// ===== 监督者催打卡（每天限一次） =====
router.post('/remind', authMiddleware, (req, res) => {
	const { checkinId, targetUserId } = req.body;
	const item = db.prepare('SELECT id, title FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '任务不存在' });

	// 验证：当前用户是 targetUserId 在该任务的监督人
	const isSup = db.prepare('SELECT 1 FROM checkin_supervisors WHERE checkin_id = ? AND user_id = ? AND supervisor_id = ?')
		.get(checkinId, targetUserId, req.userId);
	if (!isSup) return res.json({ code: 403, msg: '你不是该用户的监督人' });

	const today = getLocalDateString();
	const alreadyReminded = db.prepare(
		"SELECT 1 FROM messages WHERE from_id = ? AND user_id = ? AND type = 'remind' AND related_id = ? AND date(created_at) = ?"
	).get(req.userId, targetUserId, checkinId, today);
	if (alreadyReminded) return res.json({ code: 200, msg: '今天已催过了' });

	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.userId);
	sendMessage(targetUserId, req.userId, 'remind', '打卡提醒',
		(sender ? sender.nickname : '你的监督人') + ' 提醒你完成「' + item.title + '」打卡', checkinId);
	res.json({ code: 200, msg: '提醒已发送' });
});

// ===== 打卡记录时间线 =====
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

// ===== 邀请学伴加入打卡（幂等：24h内不重复） =====
router.post('/invite_join', authMiddleware, (req, res) => {
	const { checkinId, targetUserId } = req.body;
	const item = db.prepare('SELECT id, title FROM checkins WHERE id = ? AND status = 1').get(checkinId);
	if (!item) return res.json({ code: 404, msg: '打卡任务不存在' });

	const isPartner = db.prepare(
		'SELECT 1 FROM partners WHERE status = 1 AND ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))'
	).get(req.userId, targetUserId, targetUserId, req.userId);
	if (!isPartner) return res.json({ code: 403, msg: '只能邀请学伴' });

	const recent = db.prepare(
		"SELECT 1 FROM messages WHERE from_id = ? AND user_id = ? AND type = 'checkin_invite' AND related_id = ? AND created_at > datetime('now', '-1 day')"
	).get(req.userId, targetUserId, checkinId);
	if (recent) return res.json({ code: 200, msg: '已发送过邀请' });

	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.userId);
	sendMessage(targetUserId, req.userId, 'checkin_invite', '打卡邀请',
		(sender ? sender.nickname : '有人') + ' 邀请你加入打卡任务「' + item.title + '」', checkinId);
	res.json({ code: 200, msg: '邀请已发送' });
});

// ===== 辅助查询 =====
router.get('/my_joined_ids', authMiddleware, (req, res) => {
	const rows = db.prepare('SELECT DISTINCT checkin_id FROM checkin_records WHERE user_id = ? LIMIT 1000').all(req.userId);
	res.json({ code: 200, data: rows.map(r => r.checkin_id) });
});

router.get('/today_done_ids', authMiddleware, (req, res) => {
	const today = getLocalDateString();
	const rows = db.prepare('SELECT DISTINCT checkin_id FROM checkin_records WHERE user_id = ? AND day = ?').all(req.userId, today);
	res.json({ code: 200, data: rows.map(r => r.checkin_id) });
});

module.exports = router;
