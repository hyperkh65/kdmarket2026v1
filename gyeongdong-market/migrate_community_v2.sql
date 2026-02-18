-- Ensure community_posts has all needed columns for the new UI
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
