const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => cb(null, Date.now() + '_' + Math.random().toString(36).substr(2, 8) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/image', upload.single('file'), (req, res) => {
	if (!req.file) return res.json({ code: 400, msg: '请选择文件' });
	const url = '/uploads/' + req.file.filename;
	res.json({ code: 200, data: { url } });
});

module.exports = router;
