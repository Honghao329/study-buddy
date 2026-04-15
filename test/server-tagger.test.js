const test = require('node:test');
const assert = require('node:assert/strict');

const { inferNoteTags, parseTagsInput } = require('../server/lib/tagger');

test('parseTagsInput normalizes manual tags', () => {
  assert.deepEqual(parseTagsInput(['#学习', ' 复盘 ', '学习']), ['学习', '复盘']);
});

test('inferNoteTags extracts hashtags and keyword tags', () => {
  const tags = inferNoteTags({
    title: '今天的学习复盘',
    content: '完成了 #阅读 #123 ，还做了英语单词整理',
    tags: [],
  });

  assert.ok(tags.includes('阅读'));
  assert.ok(tags.includes('123'));
  assert.ok(tags.includes('英语'));
});
