-- 1. Fix Community Permissions (Correcting column names and adding Admin full access)
-- Community Posts
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Public posts are viewable by everyone" ON public.community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Community Comments
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.community_comments;
CREATE POLICY "Public comments are viewable by everyone" ON public.community_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
CREATE POLICY "Authenticated users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 2. Notification Settings Table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    keyword_enabled BOOLEAN DEFAULT true,
    purchase_enabled BOOLEAN DEFAULT true,
    community_enabled BOOLEAN DEFAULT true, -- Likes/Comments on my posts
    shop_interest_enabled BOOLEAN DEFAULT true, -- Interested shops' updates
    marketing_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Keywords Table (In case it's missing or for reference)
CREATE TABLE IF NOT EXISTS public.keyword_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    keyword TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, keyword)
);

ALTER TABLE public.keyword_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own keywords" ON public.keyword_settings FOR ALL USING (auth.uid() = user_id);
