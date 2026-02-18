-- 1. Add points column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 2. Update the new user trigger function to give 1000 points
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url, points)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '새로운 주민'),
    new.raw_user_meta_data->>'avatar_url',
    1000
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add hashtags to community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS hashtags TEXT[];

-- 4. Function to award points safely
CREATE OR REPLACE FUNCTION award_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET points = points + amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permission
GRANT EXECUTE ON FUNCTION award_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION award_points(UUID, INTEGER) TO service_role;
