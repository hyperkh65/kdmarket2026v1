-- Add supporting columns for Owner Replies and Stats
ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_reply_count int DEFAULT 0;

-- Enhance reviews table to support replies
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES reviews(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_owner_reply boolean DEFAULT false;

-- Add a trigger or logic to increment owner_reply_count when an owner replies
-- For now, we will handle the logic in the UI/API, but it's good to have the columns.

-- Ensure all current shops have 0 stats
UPDATE shops SET rating = 0.0, review_count = 0, owner_reply_count = 0;
