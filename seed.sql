-- 테스트용 워킹걸 데이터
INSERT OR IGNORE INTO working_girls (
  user_id, password, nickname, age, height, weight, gender, region, 
  line_id, kakao_id, phone, code, main_photo, is_active, is_recommended
) VALUES 
  ('user001', '1234', '나나', 25, 165, 50, '여자', '방콕', 'line_nana', 'kakao_nana', '0901234567', 'VIP001', '/static/photos/nana_main.jpg', TRUE, TRUE),
  ('user002', '2345', '미미', 23, 160, 48, '레이디보이', '파타야', 'line_mimi', 'kakao_mimi', '0902345678', '', '/static/photos/mimi_main.jpg', TRUE, FALSE),
  ('user003', '3456', '소피아', 28, 168, 52, '트랜스젠더', '치앙마이', 'line_sophia', 'kakao_sophia', '0903456789', 'GOLD003', '/static/photos/sophia_main.jpg', FALSE, FALSE),
  ('user004', '4567', '리사', 26, 162, 49, '여자', '푸켓', 'line_lisa', 'kakao_lisa', '0904567890', '', '/static/photos/lisa_main.jpg', TRUE, TRUE);

-- 테스트용 워킹걸 사진 데이터
INSERT OR IGNORE INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order) VALUES 
  (1, '/static/photos/nana_main.jpg', TRUE, 1),
  (1, '/static/photos/nana_2.jpg', FALSE, 2),
  (1, '/static/photos/nana_3.jpg', FALSE, 3),
  (2, '/static/photos/mimi_main.jpg', TRUE, 1),
  (2, '/static/photos/mimi_2.jpg', FALSE, 2),
  (3, '/static/photos/sophia_main.jpg', TRUE, 1),
  (4, '/static/photos/lisa_main.jpg', TRUE, 1),
  (4, '/static/photos/lisa_2.jpg', FALSE, 2);

-- 테스트용 광고 데이터
INSERT OR IGNORE INTO advertisements (image_url, title, display_order, is_active) VALUES 
  ('/static/ads/ad1.jpg', '광고1', 1, TRUE),
  ('/static/ads/ad2.jpg', '광고2', 2, TRUE),
  ('/static/ads/ad3.jpg', '광고3', 3, TRUE);