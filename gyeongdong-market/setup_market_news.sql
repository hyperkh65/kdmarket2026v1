-- 1. Create market_news table
CREATE TABLE IF NOT EXISTS public.market_news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'NEWS', -- 'NEWS', 'EVENT'
    url TEXT, -- External link if any
    image_url TEXT, -- Photo for the news
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Public can read market news" ON public.market_news;
CREATE POLICY "Public can read market news" ON public.market_news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage market news" ON public.market_news;
CREATE POLICY "Admins can manage market news" ON public.market_news 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'ADMIN'
    )
);

-- 4. Initial Seed Data (Optional, but good for testing)
-- INSERT INTO public.market_news (title, type) VALUES 
-- ('경동시장, "MZ세대 핫플레이스" 선정 기념 이벤트!', 'EVENT'),
-- ('[공지] 설 명절 연휴 기간 영업 안내', 'NEWS')
-- ON CONFLICT DO NOTHING;
