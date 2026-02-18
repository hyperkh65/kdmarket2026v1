-- 1. COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'FREE', -- 'FREE', 'QUESTION', 'DEAL'
  image_url text, -- For photo thumbnail
  likes int DEFAULT 0,
  views int DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read community_posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Public read community_comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Users insert community_posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert community_comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. UPDATE SHOPS TABLE
ALTER TABLE shops ADD COLUMN IF NOT EXISTS biz_license_number text;
-- is_verified ALREADY EXISTS (Using for Admin Verification)

-- 5. SEED DATA (4 SHOPS)
DELETE FROM shops; -- Reset for clean state

INSERT INTO shops (id, name, category, lat, lng, is_verified, biz_license_number, hours_text, tags) VALUES 
('s1', '청년몰 1호점', '청년몰', 37.5804, 127.0384, true, '123-45-67890', '10:00-20:00', ARRAY['핫플레이스', '디저트', '데이트']),
('s2', '경동 인삼 도매', '인삼/약재', 37.5806, 127.0386, true, '234-56-78901', '08:00-19:00', ARRAY['6년근', '홍삼', '선물용']),
('s3', '서울 약재상', '약재', 37.5805, 127.0385, false, '345-67-89012', '09:00-18:00', ARRAY['희귀약재', '도매']),
('s4', '할머니 건어물', '건어물', 37.5803, 127.0383, false, NULL, '07:00-18:00', ARRAY['멸치', '오징어', '전통']);

-- 6. SEED DATA (COMMUNITY)
INSERT INTO community_posts (title, content, type, likes, views) VALUES
('경동시장 주차 꿀팁 공유합니다', '제기동역 2번 출구 앞 공영주차장이 제일 저렴해요. 주말에는...', 'FREE', 15, 120),
('인삼 어디서 사는게 좋을까요?', '부모님 선물로 드리려고 하는데 믿을만한 가게 추천해주세요.', 'QUESTION', 5, 45),
('오늘 청년몰에서 플리마켓 한대요!', '오후 2시부터 6시까지 한다고 하니 구경오세요~', 'FREE', 28, 200),
('건어물 공동구매 하실 분 구합니다', '할머니 건어물에서 10kg 사면 할인해준대요. 5명이서 나누면...', 'DEAL', 8, 60);
