const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveLoginOpenid } = require('../server/lib/login');
const { resolveFavoriteToggleAction } = require('../server/lib/favorite');

test('resolveLoginOpenid prefers the persistent demo uid over the transient code', () => {
  assert.equal(resolveLoginOpenid({ demoUid: 'demo-123', code: 'wx-code-abc' }), 'demo-123');
  assert.equal(resolveLoginOpenid({ code: 'wx-code-abc' }), 'wx-code-abc');
});

test('resolveFavoriteToggleAction allows deleting a stale favorite even when the note is no longer viewable', () => {
  const note = { id: 1, user_id: 2, visibility: 'private', status: 0 };
  const result = resolveFavoriteToggleAction({
    note,
    existingFavorite: { id: 99 },
    userId: 3,
    isPartner: false,
  });

  assert.deepEqual(result, { action: 'delete' });
});

test('resolveFavoriteToggleAction blocks creating a new favorite when the note is not viewable', () => {
  const note = { id: 1, user_id: 2, visibility: 'private', status: 1 };
  const result = resolveFavoriteToggleAction({
    note,
    existingFavorite: null,
    userId: 3,
    isPartner: false,
  });

  assert.equal(result.error.code, 403);
  assert.equal(result.error.msg, '无权操作');
});
