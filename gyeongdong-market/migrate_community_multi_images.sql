-- Change image_url to images array to support up to 10 photos
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Migration: Copy existing image_url to images array if it exists
UPDATE community_posts 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND (images IS NULL OR array_length(images, 1) IS NULL);
