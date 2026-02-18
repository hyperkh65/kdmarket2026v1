-- 1. Add images column if missing
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 2. Update RLS Policies for easier testing (Public Access)
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users insert community_posts" ON community_posts;
DROP POLICY IF EXISTS "Users insert community_comments" ON community_comments;
DROP POLICY IF EXISTS "Users update community_posts" ON community_posts;

-- Create more permissive policies for testing
CREATE POLICY "Public insert community_posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update community_posts" ON community_posts FOR UPDATE USING (true);
CREATE POLICY "Public insert community_comments" ON community_comments FOR INSERT WITH CHECK (true);

-- Ensure likes and views can be updated by anyone for now
ALTER TABLE community_posts FORCE ROW LEVEL SECURITY;
ALTER TABLE community_comments FORCE ROW LEVEL SECURITY;
