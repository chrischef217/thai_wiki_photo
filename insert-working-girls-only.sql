-- 샘플 워킹걸 데이터만 삽입
INSERT INTO working_girls (
    user_id, password, nickname, age, height, weight, gender, region,
    line_id, kakao_id, phone, management_code, conditions, is_active, is_recommended, created_at
) VALUES
-- 추천 워킹걸들
('nana01', '1234', 'Nana', 23, 165, 50, '여자', '방콕', 'nana_line', 'nana_kakao', '081-234-5678', 'VIP001', '시간당 3000바트
오버나이트 15000바트
마사지 포함', 1, 1, datetime('now', '-1 day')),

('lisa02', '5678', 'Lisa', 25, 168, 52, '여자', '파타야', 'lisa_line', 'lisa_kakao', '082-345-6789', 'VIP002', '시간당 2500바트
오버나이트 12000바트
GFE 서비스', 1, 1, datetime('now', '-2 hours')),

('mimi03', '9012', 'Mimi', 22, 162, 48, '여자', '방콕', 'mimi_line', 'mimi_kakao', '083-456-7890', 'VIP003', '시간당 2800바트
오버나이트 14000바트
일본어 가능', 1, 1, datetime('now', '-3 hours')),

-- 일반 워킹걸들
('amy04', '3456', 'Amy', 24, 160, 49, '여자', '치앙마이', 'amy_line', 'amy_kakao', '084-567-8901', 'REG004', '시간당 2000바트
오버나이트 10000바트
영어 가능', 1, 0, datetime('now', '-4 hours')),

('jenny05', '7890', 'Jenny', 26, 170, 55, '여자', '푸켓', 'jenny_line', 'jenny_kakao', '085-678-9012', 'REG005', '시간당 2200바트
오버나이트 11000바트
수영장 데이트 가능', 1, 0, datetime('now', '-5 hours')),

('kate06', '2345', 'Kate', 21, 158, 46, '여자', '방콕', 'kate_line', 'kate_kakao', '086-789-0123', 'REG006', '시간당 1800바트
오버나이트 9000바트
신입', 1, 0, datetime('now', '-6 hours')),

('nina07', '6789', 'Nina', 27, 166, 53, '트랜스젠더', '파타야', 'nina_line', 'nina_kakao', '087-890-1234', 'TG007', '시간당 2500바트
오버나이트 12500바트
완전한 여성', 1, 0, datetime('now', '-7 hours')),

('sara08', '0123', 'Sara', 23, 164, 51, '여자', '방콕', 'sara_line', 'sara_kakao', '088-901-2345', 'REG008', '시간당 2300바트
오버나이트 11500바트
한국어 조금 가능', 0, 0, datetime('now', '-8 hours')),

('lily09', '4567', 'Lily', 28, 172, 56, '레이디보이', '치앙마이', 'lily_line', 'lily_kakao', '089-012-3456', 'LB009', '시간당 2100바트
오버나이트 10500바트
댄스 가능', 1, 0, datetime('now', '-9 hours')),

('rose10', '8901', 'Rose', 25, 161, 49, '여자', '푸켓', 'rose_line', 'rose_kakao', '080-123-4567', 'REG010', '시간당 2400바트
오버나이트 12000바트
요가 강사', 1, 0, datetime('now', '-10 hours'));