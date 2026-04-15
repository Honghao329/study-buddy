const test = require('node:test');
const assert = require('node:assert/strict');

const { makePartnerRoomKey } = require('../server/lib/partner_room');

test('makePartnerRoomKey keeps the room key stable regardless of order', () => {
  assert.equal(makePartnerRoomKey(12, 7), '7:12');
  assert.equal(makePartnerRoomKey(7, 12), '7:12');
});
