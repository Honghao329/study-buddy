const { normalizeUser, parseJsonField } = require('./format');

function makePartnerRoomKey(a, b) {
	const id1 = Number(a) || 0;
	const id2 = Number(b) || 0;
	const [low, high] = id1 <= id2 ? [id1, id2] : [id2, id1];
	return `${low}:${high}`;
}

function getActivePartnerRelation(db, userId) {
	const relation = db.prepare(
		`SELECT p.*,
		 CASE WHEN p.user_id = ? THEN p.target_id ELSE p.user_id END as partner_id,
		 u.nickname as partner_name,
		 u.avatar as partner_avatar,
		 u.bio as partner_bio,
		 u.tags as partner_tags
		 FROM partners p
		 LEFT JOIN users u ON u.id = CASE WHEN p.user_id = ? THEN p.target_id ELSE p.user_id END
		 WHERE p.status = 1 AND (p.user_id = ? OR p.target_id = ?)
		 ORDER BY p.updated_at DESC, p.created_at DESC
		 LIMIT 1`
	).get(userId, userId, userId, userId);

	if (!relation) return null;

	return {
		...relation,
		roomKey: makePartnerRoomKey(relation.user_id, relation.target_id),
		partner: relation.partner_id
			? normalizeUser({
				id: relation.partner_id,
				nickname: relation.partner_name,
				avatar: relation.partner_avatar,
				bio: relation.partner_bio,
				tags: parseJsonField(relation.partner_tags, []),
			})
			: null,
	};
}

function hasActivePartner(db, userId, excludeRelationId = null) {
	const query = excludeRelationId
		? 'SELECT 1 FROM partners WHERE status = 1 AND id != ? AND (user_id = ? OR target_id = ?) LIMIT 1'
		: 'SELECT 1 FROM partners WHERE status = 1 AND (user_id = ? OR target_id = ?) LIMIT 1';
	const params = excludeRelationId ? [excludeRelationId, userId, userId] : [userId, userId];
	return !!db.prepare(query).get(...params);
}

function getPartnerStatusBetween(db, userId, targetId) {
	const relation = db.prepare(
		`SELECT status FROM partners
		 WHERE ((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?))
		 AND status IN (0, 1)
		 ORDER BY status DESC, updated_at DESC, created_at DESC
		 LIMIT 1`
	).get(userId, targetId, targetId, userId);

	if (!relation) return 'none';
	return relation.status === 1 ? 'accepted' : 'pending';
}

function assertPartnerAvailability(db, userId, targetId, excludeRelationId = null) {
	if (Number(userId) === Number(targetId)) {
		return { code: 400, msg: '不能邀请自己' };
	}

	const current = getActivePartnerRelation(db, userId);
	if (current && current.id !== excludeRelationId) {
		return { code: 400, msg: '你已有伙伴，请先解除当前关系' };
	}

	const target = getActivePartnerRelation(db, targetId);
	if (target && target.id !== excludeRelationId) {
		return { code: 400, msg: '对方已有伙伴' };
	}

	return null;
}

function getPartnerSummary(db, userId) {
	const user = db.prepare('SELECT id, nickname, avatar, bio, tags, created_at FROM users WHERE id = ?').get(userId);
	if (!user) return null;

	const stats = db.prepare(`SELECT
		(SELECT COUNT(*) FROM notes WHERE user_id = ? AND status = 1) as noteCount,
		(SELECT COUNT(*) FROM signs WHERE user_id = ?) as signDays,
		(SELECT COUNT(*) FROM checkin_records WHERE user_id = ?) as checkinCount
	`).get(userId, userId, userId);

	return normalizeUser({
		...user,
		tags: parseJsonField(user.tags, []),
		note_cnt: stats.noteCount || 0,
		sign_days: stats.signDays || 0,
		checkin_cnt: stats.checkinCount || 0,
	});
}

module.exports = {
	assertPartnerAvailability,
	getActivePartnerRelation,
	getPartnerStatusBetween,
	getPartnerSummary,
	hasActivePartner,
	makePartnerRoomKey,
};
