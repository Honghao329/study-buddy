const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('server db respects DB_PATH override', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-buddy-db-'));
  const dbPath = path.join(tmpDir, 'custom.sqlite');
  const modulePath = path.resolve(__dirname, '..', 'server', 'config', 'db.js');

  const result = spawnSync(process.execPath, ['-e', `const db = require(${JSON.stringify(modulePath)}); console.log(db.dbPath);`], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      DB_PATH: dbPath,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), path.resolve(dbPath));
  assert.ok(fs.existsSync(dbPath));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
