-- 1. Update shop_products table with 'unit' column
ALTER TABLE public.shop_products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '개'; -- 'g', '돈', '1인분', '박스' 등

-- 2. Add an 'approved_at' and 'approved_by' to verification_requests
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS shop_id TEXT REFERENCES shops(id); -- To link to existing shop upon approval

-- 3. Trigger/Function for Owner Matching (Conceptual/Manual for now, but good to have)
-- This logic should be run when an admin approves a request:
-- UPDATE shops SET owner_id = v.user_id, is_verified = true FROM verification_requests v WHERE shops.id = v.shop_id AND v.id = [ID];
-- UPDATE profiles SET role = 'OWNER' WHERE id = (SELECT user_id FROM verification_requests WHERE id = [ID]);

-- 4. Enable RLS on verification_requests if not already
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON public.verification_requests;
CREATE POLICY "Users can view own requests" ON public.verification_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit requests" ON public.verification_requests;
CREATE POLICY "Users can submit requests" ON public.verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all requests" ON public.verification_requests;
CREATE POLICY "Admins can view all requests" ON public.verification_requests
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));
