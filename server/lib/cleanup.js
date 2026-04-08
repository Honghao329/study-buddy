function deleteNoteCascade(db, noteId) {
	const remove = db.transaction((id) => {
		db.prepare('DELETE FROM likes WHERE target_type = ? AND target_id = ?').run('note', id);
		db.prepare('DELETE FROM favorites WHERE target_type = ? AND target_id = ?').run('note', id);

		const commentIds = db.prepare('SELECT id FROM comments WHERE note_id = ?').all(id).map((row) => row.id);
		for (const commentId of commentIds) {
			db.prepare('DELETE FROM likes WHERE target_type = ? AND target_id = ?').run('comment', commentId);
		}

		db.prepare('DELETE FROM comments WHERE note_id = ?').run(id);
		return db.prepare('DELETE FROM notes WHERE id = ?').run(id);
	});

	return remove(noteId);
}

function deleteCommentCascade(db, commentId) {
	const remove = db.transaction((id) => {
		const comment = db.prepare('SELECT id, note_id FROM comments WHERE id = ?').get(id);
		if (!comment) return null;

		db.prepare('DELETE FROM likes WHERE target_type = ? AND target_id = ?').run('comment', id);
		db.prepare('DELETE FROM comments WHERE id = ?').run(id);
		db.prepare(
			'UPDATE notes SET comment_cnt = CASE WHEN comment_cnt > 0 THEN comment_cnt - 1 ELSE 0 END WHERE id = ?'
		).run(comment.note_id);
		return comment;
	});

	return remove(commentId);
}

function deleteCheckinCascade(db, checkinId) {
	const remove = db.transaction((id) => {
		db.prepare('DELETE FROM checkin_records WHERE checkin_id = ?').run(id);
		return db.prepare('DELETE FROM checkins WHERE id = ?').run(id);
	});

	return remove(checkinId);
}

module.exports = {
	deleteCheckinCascade,
	deleteCommentCascade,
	deleteNoteCascade,
};
