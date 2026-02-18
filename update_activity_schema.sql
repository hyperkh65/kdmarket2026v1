-- 1. Update courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);
-- Check if tags exists, if not create logic (it seems it exists based on code)
-- ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 2. Create course_comments table
CREATE TABLE IF NOT EXISTS public.course_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Courses
-- SELECT: Everyone
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (true);

-- INSERT: Authenticated users
DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- UPDATE/DELETE: Author or Admin
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- 5. Policies for Comments
-- SELECT: Everyone
DROP POLICY IF EXISTS "Public course comments are viewable by everyone" ON public.course_comments;
CREATE POLICY "Public course comments are viewable by everyone" ON public.course_comments FOR SELECT USING (true);

-- INSERT: Authenticated users
DROP POLICY IF EXISTS "Authenticated users can create course comments" ON public.course_comments;
CREATE POLICY "Authenticated users can create course comments" ON public.course_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- DELETE: Author or Admin
DROP POLICY IF EXISTS "Users can delete own course comments" ON public.course_comments;
CREATE POLICY "Users can delete own course comments" ON public.course_comments FOR DELETE TO authenticated USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- 6. RPC for Course Likes (to bypass RLS update restriction for everyone)
CREATE OR REPLACE FUNCTION increment_course_likes(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.courses 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
