/**
 * 通用输入校验工具
 */

function sanitizePage(query) {
	const page = Math.max(1, parseInt(query.page, 10) || 1);
	const size = Math.min(100, Math.max(1, parseInt(query.size, 10) || 20));
	const offset = (page - 1) * size;
	return { page, size, offset };
}

function clampInt(value, min, max, fallback) {
	const n = parseInt(value, 10);
	if (isNaN(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

function checkEnum(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}

function trimText(value, maxLen) {
	const s = String(value || '').trim();
	return maxLen ? s.slice(0, maxLen) : s;
}

module.exports = { sanitizePage, clampInt, checkEnum, trimText };
