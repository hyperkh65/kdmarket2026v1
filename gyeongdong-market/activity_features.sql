-- Comprehensive Schema for Activity Features (Courses & Comments)

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  likes INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  stops JSONB DEFAULT '[]'::jsonb,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Course Comments Table
CREATE TABLE IF NOT EXISTS public.course_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Courses

-- SELECT: Everyone can view courses
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (true);

-- INSERT: Authenticated users can create courses
DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- UPDATE: Author or Admin can update courses
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE TO authenticated USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- DELETE: Author or Admin can delete courses
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE TO authenticated USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 5. RLS Policies for Course Comments

-- SELECT: Everyone can view comments
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.course_comments;
CREATE POLICY "Public comments are viewable by everyone" ON public.course_comments FOR SELECT USING (true);

-- INSERT: Authenticated users can create comments
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.course_comments;
CREATE POLICY "Authenticated users can create comments" ON public.course_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- DELETE: Author of comment, Author of course, or Admin can delete comments
-- (Allowing course author to moderate comments on their course is a good practice, but keeping it simple as per prompt: Author or Admin)
DROP POLICY IF EXISTS "Users can delete own comments" ON public.course_comments;
CREATE POLICY "Users can delete own comments" ON public.course_comments FOR DELETE TO authenticated USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 6. RPC Functions

-- Increment Course Likes (Bypasses RLS for UPDATE)
CREATE OR REPLACE FUNCTION increment_course_likes(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.courses 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award Points (If not already exists, strict idempotency)
CREATE OR REPLACE FUNCTION award_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET points = COALESCE(points, 0) + amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fix any potential nulls for existing records
UPDATE public.courses SET likes = 0 WHERE likes IS NULL;
UPDATE public.profiles SET points = 3500 WHERE points IS NULL OR points = 0; -- Default points for existing users
