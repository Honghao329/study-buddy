const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeAdminCheckinRow,
  normalizeAdminNoteRow,
  normalizeFavoriteRow,
  normalizePartnerRow,
  parseUploadResponse,
} = require('../miniprogram/utils/normalizers');

test('normalizeFavoriteRow maps snake_case api rows to template fields', () => {
  const row = normalizeFavoriteRow({
    id: 7,
    target_id: 11,
    target_type: 'note',
    title: '收藏标题',
    created_at: '2026-04-08 10:00:00',
  });

  assert.equal(row.targetId, 11);
  assert.equal(row.targetType, 'note');
  assert.equal(row.createdAt, '2026-04-08 10:00:00');
  assert.equal(row.title, '收藏标题');
});

test('normalizePartnerRow picks the other participant for the current user', () => {
  const row = normalizePartnerRow({
    id: 5,
    user_id: 9,
    target_id: 3,
    user_name: '发起人',
    user_pic: '/inviter.png',
    target_name: '伙伴',
    target_pic: '/partner.png',
    created_at: '2026-04-08 11:00:00',
  }, 3);

  assert.equal(row.nickName, '发起人');
  assert.equal(row.avatarUrl, '/inviter.png');
  assert.equal(row.createdAt, '2026-04-08 11:00:00');
});

test('normalizeAdminNoteRow maps admin note fields used by the template', () => {
  const row = normalizeAdminNoteRow({
    id: 8,
    title: '笔记',
    user_name: '作者',
    created_at: '2026-04-08 12:00:00',
    view_cnt: 3,
    like_cnt: 2,
    comment_cnt: 1,
  });

  assert.equal(row.authorName, '作者');
  assert.equal(row.createdAt, '2026-04-08 12:00:00');
  assert.equal(row.viewCount, 3);
  assert.equal(row.likeCount, 2);
  assert.equal(row.commentCount, 1);
});

test('normalizeAdminCheckinRow maps admin checkin fields used by the template', () => {
  const row = normalizeAdminCheckinRow({
    id: 9,
    title: '打卡',
    start_date: '2026-04-08',
    end_date: '2026-04-09',
    join_cnt: 18,
  });

  assert.equal(row.startDate, '2026-04-08');
  assert.equal(row.endDate, '2026-04-09');
  assert.equal(row.joinCount, 18);
});

test('parseUploadResponse tolerates invalid json payloads', () => {
  assert.equal(parseUploadResponse('not-json'), null);
  assert.deepEqual(parseUploadResponse('{"code":200,"data":{"url":"/uploads/a.png"}}'), {
    code: 200,
    data: { url: '/uploads/a.png' },
  });
});
