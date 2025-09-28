-- VIP 워킹걸 기능 추가
-- 기존 is_recommended 필드 유지, is_vip 필드 추가

-- working_girls 테이블에 is_vip 컬럼 추가
ALTER TABLE working_girls ADD COLUMN is_vip BOOLEAN DEFAULT 0;

-- VIP와 추천 워킹걸을 위한 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_working_girls_vip_recommended_active 
ON working_girls(is_vip DESC, is_recommended DESC, is_active DESC, created_at DESC);

-- 기존 데이터의 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_working_girls_created_at ON working_girls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_working_girls_active ON working_girls(is_active DESC);