function parseJsonField(value, fallback) {
	if (Array.isArray(value) || (value && typeof value === 'object')) return value;
	if (value === undefined || value === null || value === '') return fallback;

	try {
		return JSON.parse(value);
	} catch (error) {
		return fallback;
	}
}

// 生成默认头像 PNG（纯色圆形 + 人形剪影）
// 使用服务器地址 + 静态文件，小程序可直接加载
const PORT = Number(process.env.PORT || 3900);
const SERVER_ORIGIN = 'http://127.0.0.1:' + PORT;

function defaultAvatar(id) {
	const idx = ((id || 0) % 3) + 1;
	return SERVER_ORIGIN + '/public/avatars/default_' + idx + '.png';
}

function normalizeUser(user) {
	if (!user) return user;

	const normalized = { ...user };
	delete normalized.password;
	normalized.nickname = normalized.nickname || normalized.nickName || '';
	normalized.nickName = normalized.nickname;
	const raw = normalized.avatar || normalized.avatarUrl || '';
	normalized.avatar = isValidAvatar(raw) ? raw : defaultAvatar(normalized.id);
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
	const rawPic = normalized.user_pic || normalized.author_avatar || '';
	normalized.user_pic = isValidAvatar(rawPic) ? rawPic : defaultAvatar(normalized.user_id || normalized.id);
	normalized.author_name = normalized.user_name;
	normalized.author_avatar = normalized.user_pic;
	return normalized;
}

function normalizeComment(comment) {
	if (!comment) return comment;

	const normalized = { ...comment };
	normalized.user_name = normalized.user_name || normalized.author_name || '';
	const rawPic = normalized.user_pic || normalized.author_avatar || '';
	normalized.user_pic = isValidAvatar(rawPic) ? rawPic : defaultAvatar(normalized.user_id || normalized.id);
	normalized.author_name = normalized.user_name;
	normalized.author_avatar = normalized.user_pic;
	return normalized;
}

// 判断头像 URL 是否有效
function isValidAvatar(url) {
	if (!url) return false;
	if (url.includes('/tmp/') || url.includes('__tmp__')) return false;
	if (url.includes('wxfile://') && !url.startsWith('http')) return false;
	return true;
}

// 给任意对象的头像字段填充默认值
function fillAvatars(obj) {
	if (!obj) return obj;
	const id = obj.user_id || obj.id || 1;
	const fields = ['avatar', 'avatarUrl', 'user_pic', 'user_avatar', 'author_avatar',
		'from_avatar', 'target_pic', 'supervisor_avatar', 'executor_avatar'];
	fields.forEach(f => {
		if (f in obj && !isValidAvatar(obj[f])) obj[f] = defaultAvatar(id);
	});
	return obj;
}

// 批量处理数组
function fillAvatarsList(list) {
	if (!Array.isArray(list)) return list;
	return list.map(fillAvatars);
}

module.exports = {
	normalizeComment,
	normalizeNote,
	normalizeUser,
	defaultAvatar,
	fillAvatars,
	fillAvatarsList,
	parseJsonField,
};
