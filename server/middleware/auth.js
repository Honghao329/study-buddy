const jwt = require('jsonwebtoken');
const SECRET = 'study_buddy_secret_2025';

function authMiddleware(req, res, next) {
	const token = req.headers['x-token'] || req.headers['authorization'];
	if (!token) return res.json({ code: 401, msg: '未登录' });

	try {
		const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET);
		req.userId = decoded.userId;
		req.userInfo = decoded;
		next();
	} catch (e) {
		return res.json({ code: 401, msg: 'token无效' });
	}
}

function adminAuth(req, res, next) {
	const token = req.headers['x-admin-token'];
	if (!token) return res.json({ code: 401, msg: '未登录' });

	try {
		const decoded = jwt.verify(token, SECRET);
		if (!decoded.isAdmin) return res.json({ code: 403, msg: '无权限' });
		req.adminId = decoded.adminId;
		next();
	} catch (e) {
		return res.json({ code: 401, msg: 'token无效' });
	}
}

function generateToken(payload) {
	return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

module.exports = { authMiddleware, adminAuth, generateToken, SECRET };
