const test = require('node:test');
const assert = require('node:assert/strict');

const { resolvePlanAccessError } = require('../server/lib/plan_access');

test('resolvePlanAccessError returns 404 when the plan does not exist', () => {
  assert.deepEqual(resolvePlanAccessError(null, 1), { code: 404, msg: '计划不存在' });
});

test('resolvePlanAccessError returns 403 when the user is not a participant', () => {
  assert.deepEqual(
    resolvePlanAccessError({ executor_id: 2, supervisor_id: 3, creator_id: 4 }, 9),
    { code: 403, msg: '无权查看该计划' }
  );
});

test('resolvePlanAccessError allows participants to access the plan', () => {
  assert.equal(
    resolvePlanAccessError({ executor_id: 2, supervisor_id: 3, creator_id: 4 }, 3),
    null
  );
});
