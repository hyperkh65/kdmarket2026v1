-- Sample Seed Data for Gyeongdong Market MVP
-- Run this in Supabase SQL Editor after running the main schema

-- 1. Insert Zones (Market Sectors)
INSERT INTO zones (name, type, priority) VALUES
('건어물 거리', 'SEARCH', 1),
('한약재 시장', 'SEARCH', 2),
('농산물 구역', 'SEARCH', 3),
('중앙 광장', 'SEARCH', 4);

-- 2. Insert POIs (Points of Interest)
-- Note: Using approximate coordinates near Gyeongdong Market (Cheongnyangni)
INSERT INTO pois (name, type, lat, lng) VALUES
('1번 출구', 'GATE', 37.5804, 127.0384),
('중앙 화장실', 'RESTROOM', 37.5806, 127.0386),
('인기 건어물 코너', 'HOTSPOT', 37.5805, 127.0385),
('픽업 대기소', 'PICKUP', 37.5803, 127.0383);

-- 3. Insert Sample Shops
INSERT INTO shops (name, category, lat, lng, hours_text, payment_methods, tags, delivery_friendliness_score) VALUES
('경동 건어물', '건어물', 37.5804, 127.0384, '09:00-19:00', ARRAY['현금', '카드', '계좌이체'], ARRAY['인기', '친절'], 8),
('한약방 김씨네', '한약재', 37.5806, 127.0386, '08:00-20:00', ARRAY['현금', '카드'], ARRAY['전문가'], 6),
('청량리 견과류', '견과/차재료', 37.5805, 127.0385, '10:00-18:00', ARRAY['현금'], ARRAY['저렴'], 7),
('동대문 마른나물', '건나물', 37.5803, 127.0383, '09:00-18:00', ARRAY['현금', '계좌이체'], ARRAY['신선'], 9);

-- 4. Insert Sample Shop Photos (using placeholder URLs)
-- In production, these would be actual Supabase Storage URLs
INSERT INTO shop_photos (shop_id, url) 
SELECT id, 'https://via.placeholder.com/400x300?text=' || name 
FROM shops 
LIMIT 4;

-- Success message
SELECT 'Seed data inserted successfully!' as message;
