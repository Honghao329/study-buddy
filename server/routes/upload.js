const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => cb(null, Date.now() + '_' + Math.random().toString(36).substr(2, 8) + path.extname(file.originalname)),
});
const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (ALLOWED_TYPES.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('仅支持 JPG/PNG/GIF/WebP 图片'));
		}
	}
});

// 简易限流：每用户每分钟最多 10 次上传
const uploadCounts = new Map();
function rateLimit(req, res, next) {
	const key = req.userId || req.ip;
	const now = Date.now();
	let record = uploadCounts.get(key);
	if (!record || now - record.start > 60000) {
		record = { start: now, count: 0 };
		uploadCounts.set(key, record);
	}
	record.count++;
	if (record.count > 10) {
		return res.json({ code: 429, msg: '上传过于频繁，请稍后再试' });
	}
	next();
}

// 定期清理限流记录
setInterval(() => {
	const now = Date.now();
	for (const [key, record] of uploadCounts) {
		if (now - record.start > 120000) uploadCounts.delete(key);
	}
}, 60000);

router.post('/image', authMiddleware, rateLimit, (req, res) => {
	upload.single('file')(req, res, (err) => {
		if (err) {
			const msg = err.code === 'LIMIT_FILE_SIZE' ? '文件不能超过5MB' : (err.message || '上传失败');
			return res.json({ code: 400, msg });
		}
		if (!req.file) return res.json({ code: 400, msg: '请选择文件' });
		const path = '/uploads/' + req.file.filename;
		const origin = `${req.protocol}://${req.get('host')}`;
		res.json({ code: 200, data: { url: `${origin}${path}`, path } });
	});
});

module.exports = router;
