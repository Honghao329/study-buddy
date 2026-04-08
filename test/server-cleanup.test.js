const test = require('node:test');
const assert = require('node:assert/strict');

const Database = require('../server/node_modules/better-sqlite3');
const { deleteCommentCascade } = require('../server/lib/cleanup');

test('deleteCommentCascade removes dependent likes and decrements note count', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY,
      comment_cnt INTEGER DEFAULT 0
    );

    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      note_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      status INTEGER DEFAULT 1
    );

    CREATE TABLE likes (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      target_type TEXT NOT NULL
    );
  `);

  db.prepare('INSERT INTO notes (id, comment_cnt) VALUES (?, ?)').run(1, 1);
  db.prepare('INSERT INTO comments (id, note_id, user_id, content, status) VALUES (?, ?, ?, ?, ?)').run(1, 1, 2, 'hello', 1);
  db.prepare('INSERT INTO likes (id, user_id, target_id, target_type) VALUES (?, ?, ?, ?)').run(1, 3, 1, 'comment');

  deleteCommentCascade(db, 1);

  assert.equal(db.prepare('SELECT COUNT(*) as cnt FROM comments').get().cnt, 0);
  assert.equal(db.prepare('SELECT COUNT(*) as cnt FROM likes').get().cnt, 0);
  assert.equal(db.prepare('SELECT comment_cnt FROM notes WHERE id = 1').get().comment_cnt, 0);
});
