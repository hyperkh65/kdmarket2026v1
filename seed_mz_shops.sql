-- 6. STORAGE BUCKET SETUP
-- Note: This usually requires superuser rights. If it fails, create 'images' bucket in Supabase Dashboard.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

-- 0. DDL (Recreate tables to ensure correct schema)
DROP TABLE IF EXISTS wiki_pages;
DROP TABLE IF EXISTS verification_requests;
DROP TABLE IF EXISTS community_posts;
DROP TABLE IF EXISTS market_news;
DROP TABLE IF EXISTS course_likes;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS shops CASCADE;

CREATE TABLE shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_verified BOOLEAN DEFAULT false,
  biz_license_number TEXT,
  hours_text TEXT,
  tags TEXT[],
  description TEXT,
  images TEXT[],
  min_order_price INTEGER DEFAULT 0,
  delivery_time TEXT DEFAULT '30-40분',
  rating NUMERIC DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0, -- Added view_count
  owner_id UUID -- Link to auth.users
);

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Market News Table
CREATE TABLE IF NOT EXISTS market_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID, -- Link to admin user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Recommended Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps JSONB, -- Array of objects: { shop_id, description, order }
  image_url TEXT,
  author_id UUID,
  tags TEXT[],
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS course_likes (
  user_id UUID,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, course_id)
);

-- 1. CLEANUP
DELETE FROM shops;
DELETE FROM community_posts;
DELETE FROM market_news;
DELETE FROM courses;

-- 3. SEED SHOPS (Benchmark Style: Rich Data)
INSERT INTO shops (id, name, category, lat, lng, is_verified, biz_license_number, hours_text, tags, description, min_order_price, delivery_time, rating, review_count, view_count, images) VALUES 
(
  'shop_1',
  '경동다방 (Kyungdong Cafe)',
  '카페/디저트',
  37.5804, 127.0384,
  true,
  '123-45-00001',
  '매일 11:00 - 21:00',
  ARRAY['#뉴트로', '#쌍화차라떼', '#힙플레이스'],
  '할머니의 레시피를 재해석한 🎈쌍화차 라떼와 수제 약과 디저트가 있는 공간입니다. 시장 2층 청년몰의 힙한 분위기를 즐겨보세요.',
  12000, '20-30분', 0, 0, 1500,
  ARRAY['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=500', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500']
),
(
  'shop_2',
  '더 말린 (The Dried)',
  '건어물',
  37.5806, 127.0386,
  true,
  '234-56-00002',
  '월-토 09:00 - 18:00',
  ARRAY['#프리미엄건어물', '#와인안주', '#선물용'],
  '프리미엄 건어물 편집샵 🍷 와인과 어울리는 건어물 페어링을 제안합니다. 깔끔한 소포장으로 선물하기 좋아요.',
  25000, '택배배송', 0, 0, 890,
  ARRAY['https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=500']
),
(
  'shop_3',
  '서울인삼 1988',
  '한약재/인삼',
  37.5805, 127.0385,
  true,
  '345-67-00003',
  '매일 08:30 - 19:00',
  ARRAY['#6년근', '#부모님선물', '#보자기포장'],
  '3대를 이어온 정직한 인삼 🎁 백화점 납품 퀄리티를 시장 가격에 만나보세요. 고급 보자기 포장 서비스 무료.',
  50000, '택배배송', 0, 0, 450,
  ARRAY['https://images.unsplash.com/photo-1567327613485-fbc7bf196198?auto=format&fit=crop&w=500']
),
(
  'shop_4',
  '그린 바스켓 (Green Basket)',
  '청과/채소',
  37.5803, 127.0383,
  false,
  NULL,
  '새벽 05:00 - 14:00',
  ARRAY['#새벽직송', '#비건', '#샐러드용'],
  '오늘 아침 가락시장에서 경매받은 🥬 신선한 채소만 취급합니다. 샐러드용 특수야채 전문.',
  15000, '40-50분', 0, 0, 120,
  ARRAY['https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=500']
),
(
  'shop_5',
  '호랭이 떡볶이',
  '분식/음식',
  37.5802, 127.0382,
  false,
  NULL,
  '매일 11:00 - 20:00',
  ARRAY['#쌀떡', '#매운맛', '#시장맛집'],
  '방앗간에서 갓 뽑은 가래떡으로 만드는 🌶 꾸덕꾸덕한 쌀떡볶이. 튀김은 주문 즉시 튀겨드립니다.',
  10000, '20-30분', 0, 0, 2300,
  ARRAY['https://images.unsplash.com/photo-1580651315530-69c8e0026377?auto=format&fit=crop&w=500']
),
(
  'shop_6',
  '영천 맵단 떡볶이',
  '분식/음식',
  37.5801, 127.0381,
  true,
  '111-22-33333',
  '매일 10:00 - 22:00',
  ARRAY['#원조', '#착한가격', '#배달맛집'],
  '우리동네 원조 떡볶이! 🌟 좋은 재료와 착한 가격으로 모십니다. 리뷰 이벤트 진행중!',
  8000, '30-40분', 4.8, 512, 1800,
  ARRAY['https://images.unsplash.com/photo-1548848221-0c2e497ed557?auto=format&fit=crop&w=500']
),
(
  'shop_7',
  '서이네 생선가게',
  '수산물',
  37.5808, 127.0388,
  true,
  '444-55-66666',
  '매일 06:00 - 18:00',
  ARRAY['#당일손질', '#제철생선', '#산지직송'],
  '매일 아침 들어오는 싱싱한 생선 🐟 먹기 좋게 손질해서 보내드립니다. 구이용/조림용 선택 가능.',
  20000, '40-50분', 4.9, 340, 670,
  ARRAY['https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=500']
),
(
  'shop_8',
  '제기동 할매 쭈꾸미',
  '맛집/음식',
  37.5785, 127.0348,
  true,
  '999-88-77777',
  '매일 10:00 - 22:00',
  ARRAY['#용두동쭈꾸미', '#매운맛', '#제기동역'],
  '40년 전통의 매운맛 🔥 스트레스 풀리는 화끈한 쭈꾸미 볶음. 포장 시 양 2배!',
  14000, '배달가능', 4.7, 1205, 3500,
  ARRAY['https://images.unsplash.com/photo-1548848221-0c2e497ed557?auto=format&fit=crop&w=500']
),
(
  'shop_9',
  '약령시 한방 삼계탕',
  '맛집/음식',
  37.5815, 127.0375,
  true,
  '888-77-66666',
  '매일 10:00 - 21:00',
  ARRAY['#보양식', '#한방육수', '#약령시'],
  '약령시의 좋은 약재만 골라 푹 고아낸 🐓 진한 한방 삼계탕. 몸보신에 최고입니다.',
  16000, '30분', 4.6, 310, 920,
  ARRAY['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500']
),
(
  'shop_10',
  '청량리 청과물 도매',
  '청과/채소',
  37.5795, 127.0405,
  false,
  NULL,
  '새벽 04:00 - 15:00',
  ARRAY['#도매가', '#박스단위', '#과일'],
  '전국 산지 직송 🍎🍓 제철 과일 도매가 판매. 박스 단위 구매 환영합니다.',
  20000, '택배배송', 4.5, 45, 300,
  ARRAY['https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=500']
),
(
  'shop_11',
  '스타벅스 경동1960',
  '카페/디저트',
  37.5800, 127.0388,
  true,
  '777-66-55555',
  '매일 09:00 - 20:00',
  ARRAY['#폐극장개조', '#핫플', '#베이커리'],
  '1960년대 극장을 개조한 특별한 스타벅스 📽️ 레트로한 공간에서 고품질 커피를 즐겨보세요.',
  5000, '포장가능', 4.8, 5600, 12000,
  ARRAY['https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=500']
),
(
  'shop_12',
  '금성전파사 새로고침 센터',
  '활동/체험',
  37.5801, 127.0389,
  true,
  '666-55-44444',
  '매일 11:00 - 19:00',
  ARRAY['#LG전자', '#체험관', '#굿즈'],
  'LG전자와 함께하는 레트로 감성 체험관 📺 다양한 굿즈와 체험 프로그램이 준비되어 있습니다.',
  0, '방문필수', 4.9, 1200, 8900,
  ARRAY['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500']
),
(
  'shop_13',
  '황해도 순대국',
  '맛집/음식',
  37.5809, 127.0395,
  true,
  '555-44-33333',
  '24시간 영업',
  ARRAY['#노포', '#순대국', '#해장'],
  '진한 사골 육수의 전통 순대국 🥘 찹쌀순대와 내장이 듬뿍 들어갑니다.',
  9000, '15-20분', 4.4, 890, 2100,
  ARRAY['https://images.unsplash.com/photo-1548943487-a2e4e43b485c?auto=format&fit=crop&w=500']
),
(
  'shop_14',
  '제기동 웰빙 마트',
  '생필품',
  37.5790, 127.0360,
  false,
  NULL,
  '매일 08:00 - 23:00',
  ARRAY['#동네마트', '#배달', '#세일'],
  '우리 동네 알뜰 장보기 🛒 매일매일 신선한 상품을 저렴하게 판매합니다.',
  10000, '30분내', 4.2, 56, 150,
  ARRAY['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500']
),
(
  'shop_15',
  '약령 족발',
  '맛집/음식',
  37.5818, 127.0380,
  true,
  '333-22-11111',
  '매일 14:00 - 23:00',
  ARRAY['#한방족발', '#콜라겐', '#야식'],
  '한약재를 넣고 삶아 잡내 없는 쫄깃한 족발 🍖 매운 불족발도 인기 만점!',
  32000, '30-40분', 4.6, 230, 780,
  ARRAY['https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=500']
);

-- Seed Market News
INSERT INTO market_news (title, content, image_url, created_at) VALUES
(
  '🎉 경동시장, "MZ세대 핫플레이스" 선정 기념 이벤트!',
  '경동시장이 서울시가 선정한 MZ세대가 사랑하는 핫플레이스로 선정되었습니다. 이를 기념하여 이번 주말 방문 고객 전원에게 장바구니를 증정합니다. 많은 방문 부탁드립니다.',
  'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=500',
  NOW()
),
(
  '📢 [공지] 설 명절 연휴 기간 영업 안내',
  '이번 설 명절 연휴 기간 (2월 9일 ~ 2월 12일) 동안 경동시장은 정상 영업합니다. 다만, 일부 점포는 개별 휴무일 수 있으니 방문 전 확인 부탁드립니다.',
  NULL,
  NOW() - INTERVAL '3 days'
),
(
  '🍓 제철 딸기 입하! 산지 직송 특가 판매',
  '논산에서 갓 수확한 싱싱한 딸기가 도착했습니다. 당도 최고 킹스베리 딸기를 파격적인 가격에 만나보세요. 청과물 도매 시장 C동 앞에서 진행됩니다.',
  'https://images.unsplash.com/photo-1589403815340-9709848f572c?w=500',
  NOW() - INTERVAL '7 days'
);

-- Seed Recommended Courses
INSERT INTO courses (title, description, steps, image_url, likes, tags, created_at) VALUES
(
  '🍜 경동시장 먹방 풀코스',
  '시장의 맛집만 쏙쏙 골라 다니는 배터지는 코스입니다. 떡볶이로 시작해서 족발로 끝내는 완벽한 하루!',
  '[
    {"shop_id": "shop_6", "description": "에피타이저로 맵단 떡볶이 한 접시!", "order": 1},
    {"shop_id": "shop_13", "description": "점심은 든든하게 순대국 한 그릇", "order": 2},
    {"shop_id": "shop_1", "description": "경동다방에서 쌍화차 라떼로 입가심", "order": 3},
    {"shop_id": "shop_15", "description": "저녁엔 족발 포장해서 집에서 파티!", "order": 4}
  ]'::jsonb,
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500',
  128,
  ARRAY['#먹방', '#데이트', '#하루종일'],
  NOW()
),
(
  '☕ 레트로 감성 힙플레이스 투어',
  '요즘 뜨는 경동시장의 힙한 공간들을 모았습니다. 인스타 인생샷 건지러 가실 분?',
  '[
    {"shop_id": "shop_11", "description": "스타벅스 경동1960에서 웅장한 극장 감성 느끼기", "order": 1},
    {"shop_id": "shop_12", "description": "금성전파사에서 레트로 체험하고 굿즈 구경", "order": 2},
    {"shop_id": "shop_1", "description": "경동다방에서 청년몰 구경하며 휴식", "order": 3}
  ]'::jsonb,
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500',
  352,
  ARRAY['#레트로', '#인스타각', '#카페투어'],
  NOW() - INTERVAL '5 days'
);

-- 5. VERIFICATION SYSTEM
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Link to auth.users
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  contact_number TEXT,
  business_license_file TEXT,
  shop_image_file TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5.1 WIKI SYSTEM
CREATE TABLE IF NOT EXISTS wiki_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT REFERENCES shops(id) ON DELETE CASCADE,
  content TEXT,
  last_edited_by UUID, -- auth.users id
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
