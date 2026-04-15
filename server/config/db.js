const Database = require('better-sqlite3');
const path = require('path');

const configuredDbPath = process.env.STUDY_BUDDY_DB_PATH || process.env.DB_PATH;
const dbPath = configuredDbPath
	? path.resolve(configuredDbPath)
	: path.join(__dirname, '..', 'data', 'study_buddy.db');
const fs = require('fs');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE NOT NULL,
    nickname TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    mobile TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    bio TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    status INTEGER DEFAULT 1,
    login_cnt INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    visibility TEXT DEFAULT 'public',
    tags TEXT DEFAULT '[]',
    like_cnt INTEGER DEFAULT 0,
    fav_cnt INTEGER DEFAULT 0,
    comment_cnt INTEGER DEFAULT 0,
    view_cnt INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_id, target_type)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    like_cnt INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    status INTEGER DEFAULT 0,
    shared_goals TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS partner_space_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_key TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS partner_space_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_key TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_key, item_type, item_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS partner_space_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_key TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS signs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    status TEXT DEFAULT 'normal',
    content TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    title TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_id, target_type)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_date TEXT,
    end_date TEXT,
    status INTEGER DEFAULT 1,
    join_cnt INTEGER DEFAULT 0,
    view_cnt INTEGER DEFAULT 0,
    creator_id INTEGER DEFAULT 0,
    supervisor_id INTEGER DEFAULT 0,
    supervisor_name TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS checkin_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkin_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    content TEXT DEFAULT '',
    forms TEXT DEFAULT '{}',
    comment TEXT DEFAULT '',
    score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (checkin_id) REFERENCES checkins(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    content TEXT DEFAULT '',
    pic TEXT DEFAULT '[]',
    cate TEXT DEFAULT '',
    view_cnt INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 9999,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT DEFAULT 'daily',
    category TEXT DEFAULT '任意',
    creator_id INTEGER NOT NULL,
    executor_id INTEGER NOT NULL,
    supervisor_id INTEGER NOT NULL,
    status INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    reward TEXT DEFAULT '',
    remind_time TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (executor_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS plan_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    content TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    comment TEXT DEFAULT '',
    score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, user_id, day),
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_plans_executor ON plans(executor_id, status);
  CREATE INDEX IF NOT EXISTS idx_plans_supervisor ON plans(supervisor_id, status);
  CREATE INDEX IF NOT EXISTS idx_plan_records_lookup ON plan_records(plan_id, user_id, day);

  -- 默认管理员由首次启动脚本创建，不再硬编码

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    from_id INTEGER DEFAULT 0,
    type TEXT DEFAULT 'system',
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    related_id INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, is_read, created_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_unique ON users(nickname);

  CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_public ON notes(visibility, status, created_at);
  CREATE INDEX IF NOT EXISTS idx_signs_user_day ON signs(user_id, day);
  CREATE INDEX IF NOT EXISTS idx_comments_note ON comments(note_id, status);
  CREATE INDEX IF NOT EXISTS idx_checkin_records_lookup ON checkin_records(checkin_id, user_id, day);
  CREATE INDEX IF NOT EXISTS idx_partners_target ON partners(target_id, status);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_likes_lookup ON likes(user_id, target_id, target_type);
  CREATE INDEX IF NOT EXISTS idx_partner_space_posts_room ON partner_space_posts(room_key, status, created_at);
  CREATE INDEX IF NOT EXISTS idx_partner_space_comments_item ON partner_space_comments(room_key, item_type, item_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_partner_space_likes_item ON partner_space_likes(room_key, item_type, item_id);
`);

// 迁移：给 users 表加 password 字段
try {
	db.prepare("SELECT password FROM users LIMIT 0").run();
} catch (e) {
	db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''");
}

// 迁移：给 users 表加 username（账号）字段
try {
	db.prepare("SELECT username FROM users LIMIT 0").run();
} catch (e) {
	db.exec("ALTER TABLE users ADD COLUMN username TEXT DEFAULT ''");
	// 给已有用户补充 username = openid 作为默认值
	db.prepare("UPDATE users SET username = openid WHERE username = '' OR username IS NULL").run();
	try { db.exec("CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username != ''"); } catch {}
}

// 迁移：创建 checkin_supervisors 表（用户-任务级别的监督关系）
try {
	db.prepare("SELECT 1 FROM checkin_supervisors LIMIT 0").run();
} catch (e) {
	db.exec(`
		CREATE TABLE checkin_supervisors (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			checkin_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			supervisor_id INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(checkin_id, user_id)
		);
		CREATE INDEX idx_cs_checkin_user ON checkin_supervisors(checkin_id, user_id);
		CREATE INDEX idx_cs_supervisor ON checkin_supervisors(supervisor_id);
	`);
	// 迁移旧数据：把 checkins.supervisor_id 迁移到新表
	const oldRows = db.prepare('SELECT id, creator_id, supervisor_id FROM checkins WHERE supervisor_id > 0').all();
	const ins = db.prepare('INSERT OR IGNORE INTO checkin_supervisors (checkin_id, user_id, supervisor_id) VALUES (?, ?, ?)');
	for (const r of oldRows) ins.run(r.id, r.creator_id, r.supervisor_id);
}

// 首次启动：如果没有任何管理员，自动创建初始管理员
const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM admins').get().cnt;
if (adminCount === 0) {
	const crypto = require('crypto');
	const initPwd = process.env.ADMIN_PASSWORD || '123456';
	const hashed = crypto.createHash('sha256').update(initPwd + '_study_buddy').digest('hex');
	db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hashed);
	console.warn('[初始化] 已创建管理员 admin，密码: ' + initPwd + '（请立即修改）');
}

module.exports = db;
module.exports.dbPath = dbPath;
