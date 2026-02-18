-- 1. Create community_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'FREE', 
  image_url text, -- Legacy single image
  images TEXT[] DEFAULT '{}', -- Multi image support
  likes int DEFAULT 0,
  views int DEFAULT 0,
  author_name TEXT DEFAULT '시장메이트',
  comment_count INTEGER DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- 4. Set Public Policies (For easy testing/MVP)
DROP POLICY IF EXISTS "Public read community_posts" ON community_posts;
DROP POLICY IF EXISTS "Public read community_comments" ON community_comments;
DROP POLICY IF EXISTS "Public insert community_posts" ON community_posts;
DROP POLICY IF EXISTS "Public update community_posts" ON community_posts;
DROP POLICY IF EXISTS "Public insert community_comments" ON community_comments;

CREATE POLICY "Public read community_posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Public read community_comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Public insert community_posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update community_posts" ON community_posts FOR UPDATE USING (true);
CREATE POLICY "Public insert community_comments" ON community_comments FOR INSERT WITH CHECK (true);
