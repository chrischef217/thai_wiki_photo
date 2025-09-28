-- 광고 테이블 기능 향상 마이그레이션
-- 우선순위, 스크롤 시간, 만료일 컬럼 추가

-- 광고 테이블에 새 컬럼들 추가 (link_url은 이미 존재함)
ALTER TABLE advertisements ADD COLUMN scroll_interval INTEGER DEFAULT 3000; -- 스크롤 시간 (밀리초, 기본 3초)
ALTER TABLE advertisements ADD COLUMN expires_at DATETIME; -- 광고 만료일시

-- display_order 컬럼의 기본값을 명확히 설정 (우선순위)
UPDATE advertisements SET display_order = 1 WHERE display_order = 0 OR display_order IS NULL;

-- 광고 설정 테이블 생성 (전역 광고 설정)
CREATE TABLE IF NOT EXISTS advertisement_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 광고 설정 삽입
INSERT OR IGNORE INTO advertisement_settings (setting_key, setting_value) VALUES 
('default_scroll_interval', '3000'), -- 기본 스크롤 시간 3초
('banner_optimal_size', '1200x300'); -- 권장 배너 사이즈