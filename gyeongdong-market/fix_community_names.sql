-- 1. community_comments 테이블에 이름 정보 추가
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT '익명';
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS author_id UUID;

-- 2. 기존 댓글들에 대해 작성자 이름 설정 (혹시 있다면)
UPDATE community_comments SET author_name = '경동이' WHERE author_name IS NULL OR author_name = '익명';

-- 3. community_posts 테이블에도 author_id 추가 (프로필과 연동 대비)
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS author_id UUID;

-- 4. RLS 정책 업데이트 (이미 되어있을 수 있지만 확실히 하기 위해)
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert comments" ON community_comments;
CREATE POLICY "Anyone can insert comments" ON community_comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
CREATE POLICY "Anyone can view comments" ON community_comments
  FOR SELECT USING (true);
