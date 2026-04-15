const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { notifyPartnerInvite } = require('../lib/notify');
const { fillAvatarsList, normalizeUser, parseJsonField, fillAvatars } = require('../lib/format');
const { trimText, sanitizePage } = require('../lib/validate');
const {
	assertPartnerAvailability,
	getActivePartnerRelation,
	getPartnerStatusBetween,
	getPartnerSummary,
	hasActivePartner,
	makePartnerRoomKey,
} = require('../lib/partner_room');

function mapFeedItem(row, likeMap, commentMap, likedSet) {
	const itemKey = `${row.item_type}:${row.source_id}`;
	return fillAvatars({
		...row,
		item_key: itemKey,
		images: parseJsonField(row.images_json, []),
		like_cnt: likeMap.get(itemKey) || 0,
		comment_cnt: commentMap.get(itemKey) || 0,
		is_liked: likedSet.has(itemKey) ? 1 : 0,
	});
}

function resolveRoomItem(db, room, itemType, itemId) {
	if (!room) return null;

	if (itemType === 'post') {
		return db.prepare(
			'SELECT * FROM partner_space_posts WHERE id = ? AND room_key = ? AND status = 1'
		).get(itemId, room.roomKey);
	}

	if (itemType === 'record') {
		return db.prepare(
			`SELECT cr.*, c.title as checkin_title, c.description as checkin_description
			 FROM checkin_records cr
			 LEFT JOIN checkins c ON c.id = cr.checkin_id
			 WHERE cr.id = ? AND cr.user_id IN (?, ?)`
		).get(itemId, room.relation.user_id, room.relation.target_id);
	}

	return null;
}

function ensureCurrentRoom(req, res) {
	const room = getActivePartnerRelation(db, req.userId);
	if (!room || !room.partner) {
		res.json({ code: 200, data: { relation: null, partner: null, roomKey: '', feed: [], total: 0 } });
		return null;
	}
	return room;
}

// 发送邀请
router.post('/invite', authMiddleware, (req, res) => {
	const { targetId } = req.body;
	const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
	if (!target) return res.json({ code: 404, msg: '用户不存在' });
	if (Number(targetId) === req.userId) return res.json({ code: 400, msg: '不能邀请自己' });

	const partnerError = assertPartnerAvailability(db, req.userId, Number(targetId));
	if (partnerError) return res.json(partnerError);

	const existing = db.prepare(
		`SELECT id, status FROM partners
		 WHERE ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))
		 AND status IN (0, 1)
		 ORDER BY status DESC, updated_at DESC, created_at DESC
		 LIMIT 1`
	).get(req.userId, targetId, targetId, req.userId);
	if (existing) {
		if (existing.status === 1) return res.json({ code: 200, msg: '已是学伴' });
		return res.json({ code: 200, msg: '邀请已发送，等待对方确认' });
	}

	// 清除旧的拒绝记录，允许重新邀请
	db.prepare(
		`DELETE FROM partners
		 WHERE ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?)) AND status NOT IN (0, 1)`
	).run(req.userId, targetId, targetId, req.userId);

	const result = db.prepare('INSERT INTO partners (user_id, target_id, status) VALUES (?, ?, 0)').run(req.userId, targetId);
	notifyPartnerInvite(req.userId, targetId);
	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// 接受邀请
router.post('/accept', authMiddleware, (req, res) => {
	const { id } = req.body;
	const invitation = db.prepare(
		'SELECT * FROM partners WHERE id = ? AND target_id = ? AND status = 0'
	).get(id, req.userId);
	if (!invitation) return res.json({ code: 404, msg: '邀请不存在' });

	const partnerError = assertPartnerAvailability(db, invitation.user_id, invitation.target_id, invitation.id);
	if (partnerError) return res.json(partnerError);

	db.prepare('UPDATE partners SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND target_id = ? AND status = 0').run(id, req.userId);
	res.json({ code: 200, msg: '已接受' });
});

// 拒绝邀请
router.post('/reject', authMiddleware, (req, res) => {
	const { id } = req.body;
	db.prepare('UPDATE partners SET status = 8, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND target_id = ? AND status = 0').run(id, req.userId);
	res.json({ code: 200, msg: '已拒绝' });
});

// 解除伙伴
router.post('/dissolve', authMiddleware, (req, res) => {
	const { id } = req.body;
	db.prepare('UPDATE partners SET status = 9, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (user_id = ? OR target_id = ?)').run(id, req.userId, req.userId);
	res.json({ code: 200, msg: '已解除' });
});

// 当前伙伴
router.get('/current', authMiddleware, (req, res) => {
	const room = getActivePartnerRelation(db, req.userId);
	if (!room) return res.json({ code: 200, data: { relation: null, partner: null, roomKey: '' } });
	res.json({
		code: 200,
		data: {
			relation: room,
			partner: room.partner ? getPartnerSummary(db, room.partner.id) : null,
			roomKey: room.roomKey,
		},
	});
});

// 我的伙伴列表（当前只保留一个活跃伙伴）
router.get('/my_list', authMiddleware, (req, res) => {
	const list = db.prepare(
		`SELECT p.*,
		 u1.nickname as user_name, u1.avatar as user_pic,
		 u2.nickname as target_name, u2.avatar as target_pic
		 FROM partners p
		 LEFT JOIN users u1 ON p.user_id = u1.id
		 LEFT JOIN users u2 ON p.target_id = u2.id
		 WHERE (p.user_id = ? OR p.target_id = ?) AND p.status = 1
		 ORDER BY p.updated_at DESC, p.created_at DESC
		 LIMIT 1`
	).all(req.userId, req.userId);
	res.json({ code: 200, data: fillAvatarsList(list) });
});

// 待处理邀请
router.get('/pending_list', authMiddleware, (req, res) => {
	const list = db.prepare(
		`SELECT p.*, u.nickname as user_name, u.avatar as user_pic
		 FROM partners p LEFT JOIN users u ON p.user_id = u.id
		 WHERE p.target_id = ? AND p.status = 0 ORDER BY p.created_at DESC`
	).all(req.userId);
	res.json({ code: 200, data: fillAvatarsList(list) });
});

// 批量查询伙伴状态
router.post('/batch_status', authMiddleware, (req, res) => {
	const { userIds } = req.body;
	if (!Array.isArray(userIds) || userIds.length === 0) return res.json({ code: 200, data: {} });

	const active = getActivePartnerRelation(db, req.userId);
	const result = {};

	userIds.forEach((rawId) => {
		const otherId = Number(rawId);
		if (!otherId) return;
		if (active) {
			if (Number(active.partner?.id || 0) === otherId) {
				result[otherId] = 'accepted';
				return;
			}
			result[otherId] = 'occupied';
			return;
		}
		result[otherId] = getPartnerStatusBetween(db, req.userId, otherId);
	});

	res.json({ code: 200, data: result });
});

// 伙伴空间
router.get('/room', authMiddleware, (req, res) => {
	const room = ensureCurrentRoom(req, res);
	if (!room) return;

	const { size, offset } = sanitizePage(req.query);
	const roomKey = room.roomKey;
	const pairIds = [room.relation.user_id, room.relation.target_id];
	const feedRows = db.prepare(
		`SELECT * FROM (
			SELECT 'record' as item_type,
			       CAST(cr.id AS TEXT) as item_id,
			       cr.id as source_id,
			       cr.checkin_id,
			       cr.user_id,
			       cr.content,
			       cr.comment as supervisor_comment,
			       cr.score,
			       cr.day,
			       cr.created_at,
			       c.title as source_title,
			       c.description as source_description,
			       u.nickname as user_name,
			       u.avatar as user_avatar,
			       '[]' as images_json
			  FROM checkin_records cr
			  LEFT JOIN checkins c ON c.id = cr.checkin_id
			  LEFT JOIN users u ON u.id = cr.user_id
			 WHERE cr.user_id IN (?, ?)
			UNION ALL
			SELECT 'post' as item_type,
			       CAST(p.id AS TEXT) as item_id,
			       p.id as source_id,
			       0 as checkin_id,
			       p.user_id,
			       p.content,
			       '' as supervisor_comment,
			       0 as score,
			       '' as day,
			       p.created_at,
			       '' as source_title,
			       '' as source_description,
			       u.nickname as user_name,
			       u.avatar as user_avatar,
			       p.images as images_json
			  FROM partner_space_posts p
			  LEFT JOIN users u ON u.id = p.user_id
			 WHERE p.room_key = ? AND p.status = 1
		) feed
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?`
	).all(pairIds[0], pairIds[1], roomKey, size, offset);

	const total = db.prepare(
		`SELECT
			(SELECT COUNT(*) FROM checkin_records WHERE user_id IN (?, ?)) +
			(SELECT COUNT(*) FROM partner_space_posts WHERE room_key = ? AND status = 1) as cnt`
	).get(pairIds[0], pairIds[1], roomKey).cnt;
	const recordTotal = db.prepare(
		'SELECT COUNT(*) as cnt FROM checkin_records WHERE user_id IN (?, ?)'
	).get(pairIds[0], pairIds[1]).cnt;
	const postTotal = db.prepare(
		'SELECT COUNT(*) as cnt FROM partner_space_posts WHERE room_key = ? AND status = 1'
	).get(roomKey).cnt;
	const likeTotal = db.prepare(
		'SELECT COUNT(*) as cnt FROM partner_space_likes WHERE room_key = ?'
	).get(roomKey).cnt;
	const commentTotal = db.prepare(
		'SELECT COUNT(*) as cnt FROM partner_space_comments WHERE room_key = ?'
	).get(roomKey).cnt;

	const likeRows = db.prepare(
		`SELECT item_type, item_id, COUNT(*) as cnt
		 FROM partner_space_likes
		 WHERE room_key = ?
		 GROUP BY item_type, item_id`
	).all(roomKey);
	const commentRows = db.prepare(
		`SELECT item_type, item_id, COUNT(*) as cnt
		 FROM partner_space_comments
		 WHERE room_key = ?
		 GROUP BY item_type, item_id`
	).all(roomKey);
	const likedRows = db.prepare(
		`SELECT item_type, item_id
		 FROM partner_space_likes
		 WHERE room_key = ? AND user_id = ?`
	).all(roomKey, req.userId);

	const likeMap = new Map(likeRows.map((row) => [`${row.item_type}:${row.item_id}`, row.cnt]));
	const commentMap = new Map(commentRows.map((row) => [`${row.item_type}:${row.item_id}`, row.cnt]));
	const likedSet = new Set(likedRows.map((row) => `${row.item_type}:${row.item_id}`));
	const feed = feedRows.map((row) => mapFeedItem(row, likeMap, commentMap, likedSet));

	res.json({
		code: 200,
		data: {
			relation: room.relation,
			partner: room.partner ? getPartnerSummary(db, room.partner.id) : null,
			roomKey,
			total,
			summary: {
				recordTotal,
				postTotal,
				likeTotal,
				commentTotal,
			},
			list: feed,
		},
	});
});

// 发布伙伴空间动态
router.post('/room/post', authMiddleware, (req, res) => {
	const room = getActivePartnerRelation(db, req.userId);
	if (!room || !room.partner) return res.json({ code: 403, msg: '暂无伙伴' });

	const content = trimText(req.body.content, 1000);
	const images = parseJsonField(req.body.images, []);
	if (!content && images.length === 0) {
		return res.json({ code: 400, msg: '请输入内容或上传图片' });
	}

	const result = db.prepare(
		'INSERT INTO partner_space_posts (room_key, user_id, content, images) VALUES (?, ?, ?, ?)'
	).run(room.roomKey, req.userId, content, JSON.stringify(images));

	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

// 点赞/取消点赞
router.post('/room/like', authMiddleware, (req, res) => {
	const room = getActivePartnerRelation(db, req.userId);
	if (!room || !room.partner) return res.json({ code: 403, msg: '暂无伙伴' });

	const { itemType, itemId } = req.body;
	const item = resolveRoomItem(db, room, itemType, itemId);
	if (!item) return res.json({ code: 404, msg: '内容不存在' });

	const existing = db.prepare(
		'SELECT id FROM partner_space_likes WHERE room_key = ? AND item_type = ? AND item_id = ? AND user_id = ?'
	).get(room.roomKey, itemType, itemId, req.userId);

	if (existing) {
		db.prepare('DELETE FROM partner_space_likes WHERE id = ?').run(existing.id);
		return res.json({ code: 200, data: { liked: 0 } });
	}

	db.prepare(
		'INSERT INTO partner_space_likes (room_key, item_type, item_id, user_id) VALUES (?, ?, ?, ?)'
	).run(room.roomKey, itemType, itemId, req.userId);
	res.json({ code: 200, data: { liked: 1 } });
});

// 评论列表
router.get('/room/comments', authMiddleware, (req, res) => {
	const room = getActivePartnerRelation(db, req.userId);
	if (!room || !room.partner) return res.json({ code: 403, msg: '暂无伙伴' });

	const { itemType, itemId } = req.query;
	const item = resolveRoomItem(db, room, itemType, itemId);
	if (!item) return res.json({ code: 404, msg: '内容不存在' });

	const list = db.prepare(
		`SELECT c.*, u.nickname as user_name, u.avatar as user_avatar
		 FROM partner_space_comments c
		 LEFT JOIN users u ON c.user_id = u.id
		 WHERE c.room_key = ? AND c.item_type = ? AND c.item_id = ?
		 ORDER BY c.created_at ASC`
	).all(room.roomKey, itemType, itemId);

	res.json({ code: 200, data: fillAvatarsList(list) });
});

// 发表评论
router.post('/room/comment', authMiddleware, (req, res) => {
	const room = getActivePartnerRelation(db, req.userId);
	if (!room || !room.partner) return res.json({ code: 403, msg: '暂无伙伴' });

	const { itemType, itemId, content } = req.body;
	const text = trimText(content, 500);
	if (!text) return res.json({ code: 400, msg: '请输入评论内容' });

	const item = resolveRoomItem(db, room, itemType, itemId);
	if (!item) return res.json({ code: 404, msg: '内容不存在' });

	const result = db.prepare(
		'INSERT INTO partner_space_comments (room_key, item_type, item_id, user_id, content) VALUES (?, ?, ?, ?, ?)'
	).run(room.roomKey, itemType, itemId, req.userId, text);

	res.json({ code: 200, data: { id: result.lastInsertRowid } });
});

module.exports = router;
