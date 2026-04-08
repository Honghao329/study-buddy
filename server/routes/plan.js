const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { resolvePlanAccessError } = require('../lib/plan_access');
let getLocalDateString;
try { getLocalDateString = require('../lib/date').getLocalDateString; } catch(e) { getLocalDateString = () => new Date().toISOString().split('T')[0]; }

// 创建计划（指定执行者和监督者）
router.post('/create', authMiddleware, (req, res) => {
	const { title, description, frequency, category, partnerId, iAmExecutor, reward, remind_time } = req.body;
	if (!title) return res.json({ code: 400, msg: '请输入计划标题' });
	if (!partnerId) return res.json({ code: 400, msg: '请选择伙伴' });

	const executorId = iAmExecutor ? req.userId : partnerId;
	const supervisorId = iAmExecutor ? partnerId : req.userId;

	const result = db.prepare(
		'INSERT INTO plans (title, description, frequency, category, creator_id, executor_id, supervisor_id, reward, remind_time) VALUES (?,?,?,?,?,?,?,?,?)'
	).run(title, description || '', frequency || 'daily', category || '任意', req.userId, executorId, supervisorId, reward || '', remind_time || '');

	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// 我的计划列表（作为执行者或监督者）
router.get('/my_list', authMiddleware, (req, res) => {
	const list = db.prepare(
		`SELECT p.*,
		 u1.nickname as executor_name, u1.avatar as executor_avatar,
		 u2.nickname as supervisor_name, u2.avatar as supervisor_avatar,
		 (SELECT COUNT(*) FROM plan_records WHERE plan_id = p.id AND user_id = p.executor_id) as checkin_days,
		 (SELECT COALESCE(SUM(score), 0) FROM plan_records WHERE plan_id = p.id) as total_score
		 FROM plans p
		 LEFT JOIN users u1 ON p.executor_id = u1.id
		 LEFT JOIN users u2 ON p.supervisor_id = u2.id
		 WHERE (p.executor_id = ? OR p.supervisor_id = ?) AND p.status = 1
		 ORDER BY p.updated_at DESC`
	).all(req.userId, req.userId);
	res.json({ code: 200, data: list });
});

// 计划详情（仅参与者可见）
router.get('/detail/:id', authMiddleware, (req, res) => {
	const plan = db.prepare(
		`SELECT p.*,
		 u1.nickname as executor_name, u1.avatar as executor_avatar,
		 u2.nickname as supervisor_name, u2.avatar as supervisor_avatar,
		 uc.nickname as creator_name
		 FROM plans p
		 LEFT JOIN users u1 ON p.executor_id = u1.id
		 LEFT JOIN users u2 ON p.supervisor_id = u2.id
		 LEFT JOIN users uc ON p.creator_id = uc.id
		 WHERE p.id = ?`
		).get(req.params.id);

	const accessError = resolvePlanAccessError(plan, req.userId);
	if (accessError) return res.json(accessError);

	// 统计
	const stats = db.prepare(
		`SELECT COUNT(*) as days, COALESCE(SUM(score), 0) as total_score
		 FROM plan_records WHERE plan_id = ? AND user_id = ?`
	).get(plan.id, plan.executor_id);

	plan.checkin_days = stats.days;
	plan.total_score = stats.total_score;

	res.json({ code: 200, data: plan });
});

// 计划日历数据（仅参与者可见）
router.get('/calendar/:id', authMiddleware, (req, res) => {
	const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
	const accessError = resolvePlanAccessError(plan, req.userId);
	if (accessError) return res.json(accessError);
	const { year, month } = req.query;
	const startDay = `${year}-${String(month).padStart(2, '0')}-01`;
	const endMonth = Number(month) === 12 ? 1 : Number(month) + 1;
	const endYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
	const endDay = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

	const list = db.prepare(
		`SELECT pr.*, u.nickname as user_name, u.avatar as user_avatar
		 FROM plan_records pr LEFT JOIN users u ON pr.user_id = u.id
		 WHERE pr.plan_id = ? AND pr.day >= ? AND pr.day < ?
		 ORDER BY pr.day ASC, pr.created_at ASC`
	).all(req.params.id, startDay, endDay);

	list.forEach(item => { item.images = JSON.parse(item.images || '[]'); });
	res.json({ code: 200, data: list });
});

// 打卡（执行者）
router.post('/checkin', authMiddleware, (req, res) => {
	const { planId, content, images } = req.body;
	const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND status = 1').get(planId);
	if (!plan) return res.json({ code: 404, msg: '计划不存在' });
	if (plan.executor_id !== req.userId) return res.json({ code: 403, msg: '只有执行者可以打卡' });

	const today = getLocalDateString();
	const existing = db.prepare('SELECT id FROM plan_records WHERE plan_id = ? AND user_id = ? AND day = ?').get(planId, req.userId, today);
	if (existing) return res.json({ code: 400, msg: '今日已打卡' });

	db.prepare('INSERT INTO plan_records (plan_id, user_id, day, content, images) VALUES (?,?,?,?,?)')
		.run(planId, req.userId, today, content || '', JSON.stringify(images || []));

	// 自动加积分
	db.prepare('UPDATE plans SET points = points + 10, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(planId);

	res.json({ code: 200, msg: '打卡成功' });
});

// 评论/评分（监督者对某条记录）
router.post('/comment', authMiddleware, (req, res) => {
	const { recordId, comment, score } = req.body;
	const record = db.prepare('SELECT pr.*, p.supervisor_id FROM plan_records pr LEFT JOIN plans p ON pr.plan_id = p.id WHERE pr.id = ?').get(recordId);
	if (!record) return res.json({ code: 404, msg: '记录不存在' });
	if (record.supervisor_id !== req.userId) return res.json({ code: 403, msg: '只有监督者可以评价' });

	db.prepare('UPDATE plan_records SET comment = ?, score = ? WHERE id = ?').run(comment || '', score || 0, recordId);
	res.json({ code: 200, msg: '评价成功' });
});

// 打卡记录列表（仅参与者可见）
router.get('/records/:id', authMiddleware, (req, res) => {
	const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
	const accessError = resolvePlanAccessError(plan, req.userId);
	if (accessError) return res.json(accessError);
	const { page = 1, size = 20 } = req.query;
	const offset = (page - 1) * size;
	const list = db.prepare(
		`SELECT pr.*, u.nickname as user_name, u.avatar as user_avatar
		 FROM plan_records pr LEFT JOIN users u ON pr.user_id = u.id
		 WHERE pr.plan_id = ?
		 ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`
	).all(req.params.id, Number(size), offset);

	list.forEach(item => { item.images = JSON.parse(item.images || '[]'); });
	const total = db.prepare('SELECT COUNT(*) as cnt FROM plan_records WHERE plan_id = ?').get(req.params.id).cnt;
	res.json({ code: 200, data: { list, total } });
});

module.exports = router;
