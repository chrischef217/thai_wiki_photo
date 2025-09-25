-- 테스트용 워킹걸 데이터만 추가
INSERT OR IGNORE INTO working_girls (user_id, nickname, age, height, weight, gender, region, line_id, kakao_id, phone, code, password, is_active, is_recommended) VALUES 
('test1', 'Anna', 25, 165, 50, '여자', '방콕', 'anna_line', 'anna_kakao', '010-1111-1111', 'A001', '1234', 1, 1),
('test2', 'Bella', 23, 160, 48, '여자', '파타야', 'bella_line', 'bella_kakao', '010-2222-2222', 'B002', '5678', 1, 0),
('test3', 'Chloe', 27, 170, 55, '트랜스젠더', '치앙마이', 'chloe_line', 'chloe_kakao', '010-3333-3333', 'C003', '9999', 0, 1);