-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Community Posts

-- SELECT: Everyone can read
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Public posts are viewable by everyone" 
ON public.community_posts FOR SELECT USING (true);

-- INSERT: Authenticated users can create
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts" 
ON public.community_posts FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = author_id);

-- UPDATE: Author or Admin can update
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts" 
ON public.community_posts FOR UPDATE TO authenticated 
USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- DELETE: Author or Admin can delete
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
CREATE POLICY "Users can delete own posts" 
ON public.community_posts FOR DELETE TO authenticated 
USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 2. Policies for Comments

-- SELECT: Everyone can read
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.community_comments;
CREATE POLICY "Public comments are viewable by everyone" 
ON public.community_comments FOR SELECT USING (true);

-- INSERT: Authenticated users can comment
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
CREATE POLICY "Authenticated users can create comments" 
ON public.community_comments FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = author_id);

-- DELETE: Author or Admin can delete comments
DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
CREATE POLICY "Users can delete own comments" 
ON public.community_comments FOR DELETE TO authenticated 
USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 3. RPC for Likes (Security Definer allows anyone to increment without UPDATE permission on table)
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.community_posts 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure award_points exists
CREATE OR REPLACE FUNCTION award_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET points = COALESCE(points, 0) + amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use this to fix existing nulls
UPDATE public.community_posts SET likes = 0 WHERE likes IS NULL;
UPDATE public.profiles SET points = 0 WHERE points IS NULL;
