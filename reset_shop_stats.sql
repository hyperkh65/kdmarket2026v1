-- Migration to add rating, review count, and owner reply count to shops
-- And reset all shops to 0-base for real time aggregation.

ALTER TABLE shops ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 0.0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_reply_count int DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS biz_license_number text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS min_order_price int DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery_time text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS images text[];

-- Reset all shop stats to 0
UPDATE shops 
SET rating = 0.0, 
    review_count = 0,
    owner_reply_count = 0;

-- Clear previous reviews
TRUNCATE TABLE reviews CASCADE;
