const db = require('../config/db');

function sendMessage(userId, fromId, type, title, content, relatedId) {
	if (Number(userId) === Number(fromId)) return; // 不给自己发
	db.prepare(
		'INSERT INTO messages (user_id, from_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?, ?)'
	).run(userId, fromId || 0, type, title, content, relatedId || 0);
}

function notifyLike(fromUserId, noteId) {
	const note = db.prepare('SELECT user_id, title FROM notes WHERE id = ?').get(noteId);
	if (!note) return;
	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(fromUserId);
	sendMessage(note.user_id, fromUserId, 'like', '收到点赞',
		(sender ? sender.nickname : '有人') + ' 赞了你的笔记「' + (note.title || '') + '」', noteId);
}

function notifyComment(fromUserId, noteId) {
	const note = db.prepare('SELECT user_id, title FROM notes WHERE id = ?').get(noteId);
	if (!note) return;
	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(fromUserId);
	sendMessage(note.user_id, fromUserId, 'comment', '收到评论',
		(sender ? sender.nickname : '有人') + ' 评论了你的笔记「' + (note.title || '') + '」', noteId);
}

function notifyPartnerInvite(fromUserId, targetUserId) {
	const sender = db.prepare('SELECT nickname FROM users WHERE id = ?').get(fromUserId);
	sendMessage(targetUserId, fromUserId, 'partner', '伙伴邀请',
		(sender ? sender.nickname : '有人') + ' 想和你成为学习伙伴', 0);
}

module.exports = { sendMessage, notifyLike, notifyComment, notifyPartnerInvite };
