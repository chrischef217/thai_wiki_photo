-- 데이터 백업 시스템을 위한 테이블 생성

-- 백업 메타데이터 테이블
CREATE TABLE IF NOT EXISTS backup_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_name TEXT NOT NULL,
    backup_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    backup_description TEXT,
    backup_size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 백업된 워킹걸 데이터 테이블
CREATE TABLE IF NOT EXISTS backup_working_girls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_id INTEGER NOT NULL,
    original_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    age INTEGER NOT NULL,
    height INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    gender TEXT NOT NULL,
    region TEXT NOT NULL,
    line_id TEXT,
    kakao_id TEXT,
    phone TEXT,
    management_code TEXT NOT NULL,
    agency TEXT,
    conditions TEXT,
    main_photo TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_recommended BOOLEAN DEFAULT 0,
    is_vip BOOLEAN DEFAULT 0,
    fee TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    backed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (backup_id) REFERENCES backup_metadata(id) ON DELETE CASCADE
);

-- 백업된 워킹걸 사진 데이터 테이블
CREATE TABLE IF NOT EXISTS backup_working_girl_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_id INTEGER NOT NULL,
    original_id INTEGER NOT NULL,
    working_girl_id INTEGER NOT NULL,
    photo_data TEXT NOT NULL,
    photo_type TEXT DEFAULT 'image/jpeg',
    photo_size INTEGER DEFAULT 0,
    is_main BOOLEAN DEFAULT 0,
    uploaded_at DATETIME,
    backed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (backup_id) REFERENCES backup_metadata(id) ON DELETE CASCADE
);

-- 백업된 광고 데이터 테이블
CREATE TABLE IF NOT EXISTS backup_advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_id INTEGER NOT NULL,
    original_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_data TEXT,
    link_url TEXT,
    priority_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    start_date DATE,
    end_date DATE,
    created_at DATETIME,
    updated_at DATETIME,
    backed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (backup_id) REFERENCES backup_metadata(id) ON DELETE CASCADE
);

-- 백업 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_backup_working_girls_backup_id ON backup_working_girls(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_working_girl_photos_backup_id ON backup_working_girl_photos(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_advertisements_backup_id ON backup_advertisements(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_backup_date ON backup_metadata(backup_date DESC);

-- 백업 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS backup_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 백업 설정값 삽입
INSERT OR REPLACE INTO backup_settings (setting_key, setting_value) VALUES 
    ('max_backups', '5'),
    ('auto_backup_enabled', '1'),
    ('backup_description_template', '자동 백업 - %Y%m%d_%H%M%S');