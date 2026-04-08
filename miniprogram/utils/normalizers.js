function parseUploadResponse(payload) {
  if (payload && typeof payload === 'object') return payload;
  if (typeof payload !== 'string') return null;

  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

function normalizeFavoriteRow(row = {}) {
  const targetType = row.targetType || row.target_type || '';
  const targetId = row.targetId ?? row.target_id ?? '';
  const createdAt = row.createdAt || row.created_at || '';

  return {
    ...row,
    targetId,
    target_id: targetId,
    targetType,
    target_type: targetType,
    createdAt,
    created_at: createdAt,
    title: row.title || '',
  };
}

function normalizePartnerRow(row = {}, currentUserId) {
  const currentId = Number(currentUserId);
  const userId = Number(row.user_id);
  const targetId = Number(row.target_id);
  const currentIsRequester = Number.isFinite(currentId) && Number.isFinite(userId) && currentId === userId;
  const currentIsTarget = Number.isFinite(currentId) && Number.isFinite(targetId) && currentId === targetId;
  const createdAt = row.createdAt || row.created_at || '';

  let nickName = row.target_name || row.user_name || row.nickName || '';
  let avatarUrl = row.target_pic || row.user_pic || row.avatarUrl || '';

  if (currentIsTarget) {
    nickName = row.user_name || row.target_name || row.nickName || '';
    avatarUrl = row.user_pic || row.target_pic || row.avatarUrl || '';
  } else if (currentIsRequester) {
    nickName = row.target_name || row.user_name || row.nickName || '';
    avatarUrl = row.target_pic || row.user_pic || row.avatarUrl || '';
  }

  // partnerId: the OTHER user's id (for profile links)
  let partnerId = targetId;
  if (currentIsTarget) partnerId = userId;

  return {
    ...row,
    nickName,
    avatarUrl,
    partnerId,
    createdAt,
    created_at: createdAt,
  };
}

function normalizePlanPartnerOption(row = {}, currentUserId) {
  const normalized = normalizePartnerRow(row, currentUserId);
  const currentId = Number(currentUserId);
  const targetId = Number(row.target_id);
  const currentIsTarget = Number.isFinite(currentId) && Number.isFinite(targetId) && currentId === targetId;

  let rawId = row.target_id ?? row.user_id;
  if (currentIsTarget) {
    rawId = row.user_id ?? row.target_id;
  }

  const numericId = Number(rawId);

  return {
    ...normalized,
    id: Number.isFinite(numericId) ? numericId : rawId ?? '',
  };
}

function normalizeAdminNoteRow(row = {}) {
  const createdAt = row.createdAt || row.created_at || '';

  return {
    ...row,
    authorName: row.authorName || row.user_name || row.nickName || '',
    nickName: row.nickName || row.authorName || row.user_name || '',
    createdAt,
    created_at: createdAt,
    viewCount: row.viewCount ?? row.view_cnt ?? 0,
    likeCount: row.likeCount ?? row.like_cnt ?? 0,
    commentCount: row.commentCount ?? row.comment_cnt ?? 0,
  };
}

function normalizeAdminCheckinRow(row = {}) {
  const startDate = row.startDate || row.start_date || '';
  const endDate = row.endDate || row.end_date || '';

  return {
    ...row,
    startDate,
    start_date: startDate,
    endDate,
    end_date: endDate,
    joinCount: row.joinCount ?? row.join_cnt ?? 0,
    join_cnt: row.joinCount ?? row.join_cnt ?? 0,
  };
}

module.exports = {
  normalizeAdminCheckinRow,
  normalizeAdminNoteRow,
  normalizeFavoriteRow,
  normalizePlanPartnerOption,
  normalizePartnerRow,
  parseUploadResponse,
};
