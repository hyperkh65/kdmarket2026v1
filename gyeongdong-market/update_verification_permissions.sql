-- Ensure owner_verifications table structure and permissions

-- 1. Create table if not exists (including status)
CREATE TABLE IF NOT EXISTS public.owner_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name TEXT,
  biz_registration_number TEXT,
  biz_reg_doc_url TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add status column if it doesn't exist (migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'owner_verifications' AND column_name = 'status') THEN
        ALTER TABLE public.owner_verifications ADD COLUMN status TEXT DEFAULT 'PENDING';
    END IF;
    
    -- Ensure other columns exist too
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'owner_verifications' AND column_name = 'biz_registration_number') THEN
        ALTER TABLE public.owner_verifications ADD COLUMN biz_registration_number TEXT;
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE public.owner_verifications ENABLE ROW LEVEL SECURITY;

-- Reset policies
DROP POLICY IF EXISTS "Users can manage own verifications" ON public.owner_verifications;
DROP POLICY IF EXISTS "Admins can manage all verifications" ON public.owner_verifications;

-- Policy for Users: Can view and insert their own verifications
CREATE POLICY "Users can manage own verifications" 
ON public.owner_verifications 
FOR ALL 
USING (auth.uid() = user_id);

-- Policy for Admins: Can view and update ALL verifications
CREATE POLICY "Admins can manage all verifications" 
ON public.owner_verifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);
