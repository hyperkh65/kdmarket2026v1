-- 1. Ensure profiles has a role column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Reports Table for UGC Moderation
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) NOT NULL,
    reported_user_id UUID REFERENCES auth.users(id), -- The user being reported (optional)
    content_type TEXT NOT NULL, -- 'post', 'comment', 'course', 'user'
    content_id TEXT NOT NULL, -- UUID of the post/comment/course
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add explicit Foreign Key to profiles for easy joining in Supabase client
-- This assumes profiles.id references auth.users.id
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_reporter_id_profiles_fkey,
ADD CONSTRAINT reports_reporter_id_profiles_fkey 
FOREIGN KEY (reporter_id) REFERENCES public.profiles(id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Reports
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" 
    ON public.reports FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );
    
DROP POLICY IF EXISTS "Admins can update all reports" ON public.reports;
CREATE POLICY "Admins can update all reports" 
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- 4. Ensure relevant tables allow Admin deletion
-- This is already partially handled in setup_notifications_and_admin_perms.sql
-- but let's be thorough for the community tables.

-- Community Posts
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_posts') THEN
        DROP POLICY IF EXISTS "Admins can delete posts" ON public.community_posts;
        CREATE POLICY "Admins can delete posts" ON public.community_posts FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
        );
    END IF;
END $$;

-- Community Comments
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_comments') THEN
        DROP POLICY IF EXISTS "Admins can delete comments" ON public.community_comments;
        CREATE POLICY "Admins can delete comments" ON public.community_comments FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
        );
    END IF;
END $$;
