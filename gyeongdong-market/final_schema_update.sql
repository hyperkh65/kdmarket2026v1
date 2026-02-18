-- Consolidated Schema Update (Run this to fix everything)

-- 1. Profiles: Ensure Points & Roles exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';
UPDATE public.profiles SET points = 3500 WHERE points = 0; -- Default points

-- 2. Community Posts: Standardize on author_id
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  images TEXT[] DEFAULT '{}',
  likes int DEFAULT 0,
  views int DEFAULT 0,
  author_name TEXT,
  author_id UUID REFERENCES public.profiles(id),
  comment_count INTEGER DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration: Ensure author_id exists (if user_id was used previously)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'user_id') THEN
        ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);
        UPDATE public.community_posts SET author_id = user_id WHERE author_id IS NULL;
    ELSE
        ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);
    END IF;
    
    -- Ensure images column exists
    ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
END $$;

-- 3. Community Comments: Standardize on author_id
CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name TEXT,
  author_id UUID REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration: Ensure author_id exists for comments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_comments' AND column_name = 'user_id') THEN
        ALTER TABLE public.community_comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);
        UPDATE public.community_comments SET author_id = user_id WHERE author_id IS NULL;
    ELSE
         ALTER TABLE public.community_comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 4. Activity (Courses): Ensure Table Exists
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

-- 5. Course Comments
CREATE TABLE IF NOT EXISTS public.course_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. RPC Functions (Idempotent)
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.community_posts 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_course_likes(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.courses 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION award_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET points = COALESCE(points, 0) + amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies
-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- Clear old policies
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;

DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.community_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;

DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;

DROP POLICY IF EXISTS "Public course comments are viewable by everyone" ON public.course_comments;
DROP POLICY IF EXISTS "Authenticated users can create course comments" ON public.course_comments;
DROP POLICY IF EXISTS "Users can delete own course comments" ON public.course_comments;

-- Re-create Policies

-- Community Posts
CREATE POLICY "Public posts are viewable by everyone" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Community Comments
CREATE POLICY "Public comments are viewable by everyone" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Courses
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Course Comments
CREATE POLICY "Public course comments are viewable by everyone" ON public.course_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create course comments" ON public.course_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own course comments" ON public.course_comments FOR DELETE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
