-- 1. 프로필 테이블 권한 설정
-- 닉네임이 '김현'인 사용자를 관리자(ADMIN)로 설정합니다.
UPDATE public.profiles 
SET role = 'ADMIN' 
WHERE nickname = '김현';

-- 2. 커뮤니티 테이블에 작성자 ID(UUID) 추가 (소유권 확인용)
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id);
ALTER TABLE public.community_comments ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id);

-- 3. RLS (Row Level Security) 정책 강화
-- 관리자는 모든 권한을 가지고, 일반 사용자는 본인 것만 수정/삭제 가능하게 합니다.

-- [community_posts 정책]
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view posts" ON public.community_posts;
CREATE POLICY "Anyone can view posts" ON public.community_posts 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts" ON public.community_posts 
  FOR INSERT WITH CHECK (auth.uid() = author_id OR author_id IS NULL);

DROP POLICY IF EXISTS "Admin or Author can update/delete posts" ON public.community_posts;
CREATE POLICY "Admin or Author can update/delete posts" ON public.community_posts 
  FOR ALL USING (
    auth.uid() = author_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- [community_comments 정책]
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
CREATE POLICY "Anyone can view comments" ON public.community_comments 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
CREATE POLICY "Authenticated users can create comments" ON public.community_comments 
  FOR INSERT WITH CHECK (auth.uid() = author_id OR author_id IS NULL);

DROP POLICY IF EXISTS "Admin or Author can update/delete comments" ON public.community_comments;
CREATE POLICY "Admin or Author can update/delete comments" ON public.community_comments 
  FOR ALL USING (
    auth.uid() = author_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- API 캐시 갱신
NOTIFY pgrst, 'reload schema';
