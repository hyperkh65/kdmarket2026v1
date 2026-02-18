-- Create shop_likes table for wishlist functionality
CREATE TABLE IF NOT EXISTS shop_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shop_id TEXT REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, shop_id)
);

-- Enable RLS
ALTER TABLE shop_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own likes" ON shop_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own likes" ON shop_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON shop_likes FOR DELETE USING (auth.uid() = user_id);

-- Update shops table to include phone numbers if missing from seed (if needed, but contact exists)
-- This script is for the user to run in Supabase SQL Editor.
