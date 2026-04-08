function parseJsonField(value, fallback) {
	if (Array.isArray(value) || (value && typeof value === 'object')) return value;
	if (value === undefined || value === null || value === '') return fallback;

	try {
		return JSON.parse(value);
	} catch (error) {
		return fallback;
	}
}

function normalizeUser(user) {
	if (!user) return user;

	const normalized = { ...user };
	normalized.nickname = normalized.nickname || normalized.nickName || '';
	normalized.nickName = normalized.nickname;
	normalized.avatar = normalized.avatar || normalized.avatarUrl || '';
	normalized.avatarUrl = normalized.avatar;
	normalized.tags = parseJsonField(normalized.tags, []);
	return normalized;
}

function normalizeNote(note) {
	if (!note) return note;

	const normalized = { ...note };
	normalized.images = parseJsonField(normalized.images, []);
	normalized.tags = parseJsonField(normalized.tags, []);
	normalized.user_name = normalized.user_name || normalized.author_name || '';
	normalized.user_pic = normalized.user_pic || normalized.author_avatar || '';
	normalized.author_name = normalized.user_name;
	normalized.author_avatar = normalized.user_pic;
	return normalized;
}

function normalizeComment(comment) {
	if (!comment) return comment;

	const normalized = { ...comment };
	normalized.user_name = normalized.user_name || normalized.author_name || '';
	normalized.user_pic = normalized.user_pic || normalized.author_avatar || '';
	normalized.author_name = normalized.user_name;
	normalized.author_avatar = normalized.user_pic;
	return normalized;
}

module.exports = {
	normalizeComment,
	normalizeNote,
	normalizeUser,
	parseJsonField,
};
