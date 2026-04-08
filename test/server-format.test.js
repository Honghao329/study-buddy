const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeUser, normalizeNote, normalizeComment } = require('../server/lib/format');

test('normalizeUser adds frontend aliases and parses tags', () => {
  const user = normalizeUser({
    id: 1,
    nickname: 'Alice',
    avatar: '/avatar.png',
    tags: '["student","music"]',
  });

  assert.equal(user.nickname, 'Alice');
  assert.equal(user.nickName, 'Alice');
  assert.equal(user.avatar, '/avatar.png');
  assert.equal(user.avatarUrl, '/avatar.png');
  assert.deepEqual(user.tags, ['student', 'music']);
});

test('normalizeNote adds author aliases and parses array fields', () => {
  const note = normalizeNote({
    id: 7,
    user_name: 'Bob',
    user_pic: '/bob.png',
    images: '["a.png","b.png"]',
    tags: '["study"]',
  });

  assert.equal(note.author_name, 'Bob');
  assert.equal(note.author_avatar, '/bob.png');
  assert.deepEqual(note.images, ['a.png', 'b.png']);
  assert.deepEqual(note.tags, ['study']);
});

test('normalizeComment adds author aliases and parses nested fields', () => {
  const comment = normalizeComment({
    id: 12,
    user_name: 'Carol',
    user_pic: '/carol.png',
  });

  assert.equal(comment.author_name, 'Carol');
  assert.equal(comment.author_avatar, '/carol.png');
});
