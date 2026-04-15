const { parseJsonField } = require('./format');
const { parseTagsInput, normalizeTag } = require('./tagger');
const { getActivePartnerRelation } = require('./partner_room');

function toDateMs(value) {
	const ts = new Date(String(value || '').replace(' ', 'T')).getTime();
	return Number.isFinite(ts) ? ts : Date.now();
}

function getInterestSignals(db, userId) {
	if (!userId) {
		return { tags: new Set(), partnerId: null, isColdStart: true };
	}

	const user = db.prepare('SELECT id, tags FROM users WHERE id = ?').get(userId);
	const tagSet = new Set(parseTagsInput(parseJsonField(user?.tags, [])));
	const relation = getActivePartnerRelation(db, userId);

	if (relation?.partner?.tags) {
		relation.partner.tags.forEach((tag) => {
			const normalized = normalizeTag(tag);
			if (normalized) tagSet.add(normalized);
		});
	}

	return {
		tags: tagSet,
		partnerId: relation?.partner?.id || null,
		isColdStart: tagSet.size === 0,
	};
}

function scoreNote(note, signals) {
	const tags = Array.isArray(note.tags) ? note.tags : parseJsonField(note.tags, []);
	const normalizedTags = tags.map(normalizeTag).filter(Boolean);
	const signalTags = signals.tags || new Set();

	let score = 0;
	score += Number(note.like_cnt || 0) * 4;
	score += Number(note.comment_cnt || 0) * 3;
	score += Number(note.view_cnt || 0) * 0.15;
	score += Array.isArray(note.images) && note.images.length > 0 ? 2 : 0;

	const matchCount = normalizedTags.reduce((count, tag) => count + (signalTags.has(tag) ? 1 : 0), 0);
	score += matchCount * 6;

	const text = `${note.title || ''} ${note.content || ''}`.toLowerCase();
	const looseMatch = [...signalTags].reduce((count, tag) => {
		if (tag && text.includes(String(tag).toLowerCase())) return count + 1;
		return count;
	}, 0);
	score += looseMatch * 1.5;

	if (signals.partnerId && Number(note.user_id) === Number(signals.partnerId)) score += 3;

	const daysAgo = (Date.now() - toDateMs(note.created_at)) / 86400000;
	score += Math.max(0, 14 - daysAgo) * 0.6;

	return score;
}

function sortRecommendedNotes(notes, signals) {
	if (!Array.isArray(notes) || notes.length === 0) return [];

	const list = notes.slice();
	if (!signals || (signals.tags && signals.tags.size === 0 && !signals.partnerId)) {
		return list.sort((a, b) => {
			const hotA = Number(a.like_cnt || 0) * 3 + Number(a.comment_cnt || 0) * 2 + Number(a.view_cnt || 0) * 0.1;
			const hotB = Number(b.like_cnt || 0) * 3 + Number(b.comment_cnt || 0) * 2 + Number(b.view_cnt || 0) * 0.1;
			return hotB - hotA;
		});
	}

	return list.sort((a, b) => scoreNote(b, signals) - scoreNote(a, signals));
}

module.exports = {
	getInterestSignals,
	scoreNote,
	sortRecommendedNotes,
};
