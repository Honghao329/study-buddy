const test = require('node:test');
const assert = require('node:assert/strict');

const { getLocalDateString } = require('../server/lib/date');

test('getLocalDateString uses Asia/Shanghai time by default', () => {
  const utcEvening = new Date('2026-04-08T16:30:00Z');
  assert.equal(getLocalDateString(utcEvening), '2026-04-09');
});

test('getLocalDateString respects the provided timezone', () => {
  const utcEvening = new Date('2026-04-08T16:30:00Z');
  assert.equal(getLocalDateString(utcEvening, 'UTC'), '2026-04-08');
});
