-- 프로덕션용 샘플 사진 데이터 추가
INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order, created_at) VALUES
-- Nana의 사진들 (3장) - ID: 403
(403, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-1 day')),
(403, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-1 day')),
(403, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-1 day')),

-- Lisa의 사진들 (2장) - ID: 404
(404, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-2 hours')),
(404, 'https://images.unsplash.com/photo-1548142813-039e6b10a8a9?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-2 hours')),

-- Mimi의 사진들 (4장) - ID: 405
(405, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-3 hours')),
(405, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-3 hours')),
(405, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-3 hours')),
(405, 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=400&h=600&fit=crop&crop=face', 0, 4, datetime('now', '-3 hours')),

-- Amy의 사진들 (2장) - ID: 406
(406, 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-4 hours')),
(406, 'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-4 hours')),

-- Jenny의 사진들 (3장) - ID: 407
(407, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-5 hours')),
(407, 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-5 hours')),
(407, 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-5 hours')),

-- Kate의 사진들 (1장) - ID: 408
(408, 'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-6 hours')),

-- Nina의 사진들 (3장) - ID: 409
(409, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-7 hours')),
(409, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-7 hours')),
(409, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-7 hours')),

-- Sara의 사진들 (2장) - ID: 410
(410, 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-8 hours')),
(410, 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-8 hours')),

-- Lily의 사진들 (2장) - ID: 411
(411, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-9 hours')),
(411, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-9 hours')),

-- Rose의 사진들 (4장) - ID: 412
(412, 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=600&fit=crop&crop=face', 1, 1, datetime('now', '-10 hours')),
(412, 'https://images.unsplash.com/photo-1522075469751-3847ae2c8c81?w=400&h=600&fit=crop&crop=face', 0, 2, datetime('now', '-10 hours')),
(412, 'https://images.unsplash.com/photo-1553514029-1318c9127859?w=400&h=600&fit=crop&crop=face', 0, 3, datetime('now', '-10 hours')),
(412, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face', 0, 4, datetime('now', '-10 hours'));