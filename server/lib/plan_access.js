function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function resolvePlanAccessError(plan, userId) {
  if (!plan) {
    return { code: 404, msg: '计划不存在' };
  }

  const currentUserId = toFiniteNumber(userId);
  const participantIds = [plan.executor_id, plan.supervisor_id, plan.creator_id]
    .map(toFiniteNumber)
    .filter(id => id !== null);

  if (currentUserId === null || !participantIds.includes(currentUserId)) {
    return { code: 403, msg: '无权查看该计划' };
  }

  return null;
}

module.exports = {
  resolvePlanAccessError,
};
