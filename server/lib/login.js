function resolveLoginOpenid({ demoUid, code } = {}) {
  return demoUid || code || '';
}

module.exports = {
  resolveLoginOpenid,
};
