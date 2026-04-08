function canViewNote(note, userId, isPartner = false) {
	if (!note) return false;

	if (userId && Number(note.user_id) === Number(userId)) return true;
	if (Number(note.status || 1) !== 1) return false;

	switch (note.visibility || 'public') {
		case 'private':
			return false;
		case 'partner':
			return !!isPartner;
		case 'public':
		default:
			return true;
	}
}

module.exports = {
	canViewNote,
};
