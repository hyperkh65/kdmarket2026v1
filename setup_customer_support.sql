-- Create Customer Support Table
CREATE TABLE IF NOT EXISTS public.customer_support (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    nickname text,
    category text NOT NULL, -- '앱 오류 제보', '상점 정보 수정', '서비스 제안', '기타 문의'
    title text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'PENDING', -- 'PENDING', 'ANSWERED'
    admin_reply text,
    is_private boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_support ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can create inquiries" ON public.customer_support;
CREATE POLICY "Users can create inquiries" ON public.customer_support
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own inquiries" ON public.customer_support;
CREATE POLICY "Users can view own inquiries" ON public.customer_support
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Admins can update inquiries" ON public.customer_support;
CREATE POLICY "Admins can update inquiries" ON public.customer_support
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );
