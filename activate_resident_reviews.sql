-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  nickname text,
  residency_period text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Update Reviews Table Schema
-- First drop existing constraint if any
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_shop_id_fkey;
ALTER TABLE reviews ALTER COLUMN shop_id TYPE text;
-- Restore relationship for Supabase Joins
ALTER TABLE reviews ADD CONSTRAINT reviews_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS residency_period text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES reviews(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_owner_reply boolean DEFAULT false;
ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION get_shops_with_distance(user_lat double precision, user_lng double precision)
RETURNS TABLE (
  id text,
  name text,
  category text,
  lat double precision,
  lng double precision,
  distance_meters float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, s.name, s.category, s.lat, s.lng,
    st_distance(
      st_point(s.lng, s.lat)::geography,
      st_point(user_lng, user_lat)::geography
    ) AS distance_meters
  FROM shops s
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- 5. Clear old reviews (optional, for a clean start)
TRUNCATE TABLE reviews CASCADE;

-- 5.1 Add Missing Shops from Mockup
INSERT INTO shops (id, name, category, lat, lng, is_verified)
VALUES 
('shop_mock_sushi', '스시이안앤 청량리역점', '초밥', 37.5803, 127.0485, true),
('shop_mock_ribs', '신가네왕코등갈비', '갈비/숯불', 37.5785, 127.0352, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;

-- 6. Seed 10 Realistic Resident Reviews
INSERT INTO reviews (shop_id, user_id, rating, text, nickname, residency_period, created_at, photo_urls)
VALUES 
('shop_kakao_10848016', NULL, 5, '안동집은 진짜... 비 오는 날이면 무조건 생각나는 곳이에요. 손칼국수 면발이 진짜 쫄깃하고 배추천이랑 같이 먹으면 예술입니다. 주인 아주머니 인심도 좋으셔서 정겨워요.', '제기동토박이', '10년 이상 거주', NOW() - INTERVAL '2 days', ARRAY['https://images.unsplash.com/photo-1617343253967-3901a938f83e?w=400&h=300&fit=crop']),
('shop_kakao_7823482', NULL, 4, '통닭골목에서 여러 군데 가봤는데, 여기 시장 통닭만이 주는 바삭함과 그 감성이 있어요. 양도 푸짐하고 갓 튀겨 나왔을 때 먹으면 맥주가 절로 들어갑니다.', '치킨매니아', '3년 거주', NOW() - INTERVAL '5 days', ARRAY['https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop']),
('shop_kakao_27224213', NULL, 5, '국물 맛이 정말 깊어요. 부모님 모시고 가기에도 좋고, 근처 주민들은 다 아는 숨은 찐맛집입니다. 전골 다 먹고 죽 볶아 먹는 거 잊지 마세요!', '미식가S', '5년 이상 거주', NOW() - INTERVAL '1 day', ARRAY['https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop']),
('shop_kakao_11002231', NULL, 4, '경동시장에 이런 평양냉면 맛집이 있을 줄이야. 육향이 은은하게 올라오면서 메밀면의 향이 살아있어요. 가성비도 좋아서 자주 방문합니다.', '평냉러버', '2년 거주', NOW() - INTERVAL '3 days', ARRAY['https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop']),
('shop_2', NULL, 5, '건어물 살 때는 항상 여기로 와요. 사장님이 설명도 잘 해주시고 상품이 항상 깨끗하고 좋아요. 선물용으로도 포장 잘 해주셔서 추천합니다.', '주부9단', '8년 거주', NOW() - INTERVAL '1 week', ARRAY['https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&h=300&fit=crop']),
('shop_kakao_10848016', NULL, 4, '칼국수 양이 정말 많아요! 배추 겉절이랑 궁합이 환상적입니다. 시장 구경하다가 출출할 때 들르기 딱 좋아요.', '면식수행자', '1 year', NOW() - INTERVAL '4 hours', ARRAY['https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=300&fit=crop']),
('shop_kakao_7823482', NULL, 5, '여기 고구마 튀김 같이 주는 게 별미예요. 옛날 시장 통닭 느낌 그대로라 향수를 자극하는 맛입니다.', '이웃집철수', '4년 이상 거주', NOW() - INTERVAL '12 hours', ARRAY['https://images.unsplash.com/photo-1562967914-608f15822aaa?w=400&h=300&fit=crop']),
('shop_kakao_123456', NULL, 5, '청년몰에 맛있는 곳이 너무 많아요! 분위기도 힙해서 친구들 놀러오면 꼭 데려갑니다. 시장 속의 작은 보석 같은 공간이에요.', 'MZ주민', '2년 거주', NOW() - INTERVAL '6 days', ARRAY['https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400&h=300&fit=crop']),
('shop_kakao_2081091223', NULL, 5, '약재 고를 때 고민되면 항상 전문적이고 친절하게 알려주셔서 믿음이 가요. 오래된 곳이라 단골들이 많습니다.', '약초마스터', '15년 거주', NOW() - INTERVAL '10 days', ARRAY['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop']),
('shop_kakao_27117103', NULL, 4, '나물 종류도 많고 항상 신선해요. 명절 때는 사람 정말 많은데 평소에 가면 서비스도 주시고 참 좋습니다.', '나물귀신', '6년 거주', NOW() - INTERVAL '8 days', ARRAY['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop']),
('shop_mock_sushi', NULL, 5, '초밥 생각날때 이용하는데 가성비가 좋네요. 네타가 정말 신선하고 종류도 다양해서 골라먹는 재미가 있습니다.', '어사도', '4년 이상 거주', NOW() - INTERVAL '1 day', ARRAY['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop']),
('shop_mock_ribs', NULL, 5, '27년 전통 왕코등갈비! 72시간의 기다림 끝에 맛보는 등갈비의 정석입니다. 순두부찌개도 서비스로 나오는데 이게 정말 별미예요.', '맛잘알', '1년 거주', NOW() - INTERVAL '2 days', ARRAY['https://images.unsplash.com/photo-1544025162-d76690b68f11?w=400&h=300&fit=crop']);
