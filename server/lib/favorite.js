const { canViewNote } = require('./access');

function resolveFavoriteToggleAction({ note, existingFavorite, userId, isPartner = false }) {
  if (existingFavorite) {
    return { action: 'delete' };
  }

  if (!note) {
    return { error: { code: 404, msg: '目标不存在' } };
  }

  if (!canViewNote(note, userId, isPartner)) {
    return { error: { code: 403, msg: '无权操作' } };
  }

  return { action: 'create' };
}

module.exports = {
  resolveFavoriteToggleAction,
};
