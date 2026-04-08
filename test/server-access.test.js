const test = require('node:test');
const assert = require('node:assert/strict');

const { canViewNote } = require('../server/lib/access');

test('public notes are visible to everyone', () => {
  assert.equal(canViewNote({ visibility: 'public', status: 1, user_id: 2 }, null, false), true);
  assert.equal(canViewNote({ visibility: 'public', status: 1, user_id: 2 }, 99, false), true);
});

test('private notes are only visible to the owner', () => {
  assert.equal(canViewNote({ visibility: 'private', status: 1, user_id: 2 }, 2, false), true);
  assert.equal(canViewNote({ visibility: 'private', status: 1, user_id: 2 }, 99, false), false);
});

test('partner notes are visible to the owner or approved partners', () => {
  assert.equal(canViewNote({ visibility: 'partner', status: 1, user_id: 2 }, 2, false), true);
  assert.equal(canViewNote({ visibility: 'partner', status: 1, user_id: 2 }, 99, true), true);
  assert.equal(canViewNote({ visibility: 'partner', status: 1, user_id: 2 }, 99, false), false);
});
