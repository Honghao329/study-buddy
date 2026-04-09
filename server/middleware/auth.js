const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || process.env.SECRET || 'study_buddy_secret_2025';
if (!process.env.JWT_SECRET && !process.env.SECRET) {
	console.warn('[安全警告] 未设置 JWT_SECRET 环境变量，正在使用默认密钥。生产环境请务必设置！');
}

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

function optionalAuth(req, res, next) {
	const token = req.headers['x-token'] || req.headers['authorization'];
	if (token) {
		try { req.userId = jwt.verify(token.replace('Bearer ', ''), SECRET).userId; } catch (e) {}
	}
	next();
}

function generateToken(payload) {
	return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

module.exports = { authMiddleware, optionalAuth, adminAuth, generateToken, SECRET };
