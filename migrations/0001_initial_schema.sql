-- 워킹걸 테이블
CREATE TABLE IF NOT EXISTS working_girls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT NOT NULL,
  age INTEGER NOT NULL,
  height INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('여자', '트랜스젠더', '레이디보이')),
  region TEXT NOT NULL CHECK (region IN ('방콕', '파타야', '치앙마이', '푸켓')),
  line_id TEXT,
  kakao_id TEXT,
  phone TEXT,
  code TEXT,
  main_photo TEXT, -- 메인 사진 URL
  is_active BOOLEAN DEFAULT TRUE,
  is_recommended BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 워킹걸 사진 테이블 (최대 10장)
CREATE TABLE IF NOT EXISTS working_girl_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  working_girl_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  upload_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (working_girl_id) REFERENCES working_girls(id) ON DELETE CASCADE
);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL DEFAULT 'admin',
  password TEXT NOT NULL DEFAULT '1127',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 광고 배너 테이블
CREATE TABLE IF NOT EXISTS advertisements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 세션 테이블 (로그인 상태 관리)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_token TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('working_girl', 'admin')),
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_working_girls_user_id ON working_girls(user_id);
CREATE INDEX IF NOT EXISTS idx_working_girls_region ON working_girls(region);
CREATE INDEX IF NOT EXISTS idx_working_girls_active ON working_girls(is_active);
CREATE INDEX IF NOT EXISTS idx_working_girls_recommended ON working_girls(is_recommended);
CREATE INDEX IF NOT EXISTS idx_working_girl_photos_wg_id ON working_girl_photos(working_girl_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 기본 관리자 데이터 삽입
INSERT OR IGNORE INTO admins (username, password) VALUES ('admin', '1127');