-- Add premium seed data for community feed
INSERT INTO community_posts (title, content, type, image_url, likes, views, author_name, created_at)
VALUES 
(
  '오늘 경동시장 청년몰에서 인생 타코 발견!', 
  '여긴 진짜 타코에 진심인 곳이네요. 청년몰 2층인데 분위기도 좋고 맛은 더 대박... 경동시장 오면 꼭 들러보세요! #타코맛집 #청년몰 #경동시장', 
  'FREE', 
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop', 
  24, 
  152, 
  '시장돌이',
  NOW()
),
(
  '스타벅스 경동1960점, 주말 아침이라 여유롭네요', 
  '폐극장을 개조해서 그런지 층고도 높고 웅장함이 남달라요. 커피 한 잔 하면서 책 읽기 너무 좋은 곳. 오전 10시 전엔 사람도 별로 없어서 추천합니다!', 
  'FREE', 
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&auto=format&fit=crop', 
  45, 
  320, 
  '카페마니아',
  NOW() - INTERVAL '2 hours'
),
(
  '제철 딸기 진짜 달아요! 가성비 최고 🍓', 
  '시장 안쪽 과일가게에서 한 팩에 5천원에 득템했어요. 알도 크고 당도가 미쳤습니다. 역시 과일은 시장이 정답이네요.', 
  'DEAL', 
  'https://images.unsplash.com/photo-1464965811125-17574bc3dd44?w=800&auto=format&fit=crop', 
  82, 
  410, 
  '비타민뿜뿜',
  NOW() - INTERVAL '5 hours'
),
(
  '오늘 경동시장 플리마켓 분위기 핫해요!', 
  '예쁜 수제 굿즈들도 많고 먹거리도 다양하네요. 날씨도 좋아서 데이트하기 딱 좋습니다. 오후 6시까지 한다니까 서두르세요!', 
  'FREE', 
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop', 
  12, 
  88, 
  '주말여행자',
  NOW() - INTERVAL '1 day'
);
