-- 샘플 워킹걸 데이터 추가 (무한 스크롤 테스트용)

-- 기존 데이터 삭제
DELETE FROM working_girl_photos;
DELETE FROM working_girls;

-- 샘플 워킹걸 데이터 삽입
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

-- 샘플 사진 데이터 추가 (Unsplash 이미지 사용)
INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order, created_at) VALUES
-- Nana의 사진들 (3장)
(1, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-1 day')),
(1, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-1 day')),
(1, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-1 day')),

-- Lisa의 사진들 (2장)
(2, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-2 hours')),
(2, 'https://images.unsplash.com/photo-1548142813-039e6b10a8a9?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-2 hours')),

-- Mimi의 사진들 (4장)
(3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-3 hours')),
(3, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-3 hours')),
(3, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-3 hours')),
(3, 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=400&h=600&fit=crop&crop=face', 0, 4, datetime('now', '-3 hours')),

-- Amy의 사진들 (2장)
(4, 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-4 hours')),
(4, 'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-4 hours')),

-- Jenny의 사진들 (3장)
(5, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-5 hours')),
(5, 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-5 hours')),
(5, 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-5 hours')),

-- Kate의 사진들 (1장)
(6, 'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-6 hours')),

-- Nina의 사진들 (3장)
(7, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-7 hours')),
(7, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-7 hours')),
(7, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-7 hours')),

-- Sara의 사진들 (2장)
(8, 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-8 hours')),
(8, 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-8 hours')),

-- Lily의 사진들 (2장)
(9, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-9 hours')),
(9, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-9 hours')),

-- Rose의 사진들 (4장)
(10, 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-10 hours')),
(10, 'https://images.unsplash.com/photo-1522075469751-3847ae2c8c81?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-10 hours')),
(10, 'https://images.unsplash.com/photo-1553514029-1318c9127859?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-10 hours')),
(10, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face', 0, 4, datetime('now', '-10 hours'));