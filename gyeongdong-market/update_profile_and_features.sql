-- 1. Add fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER'; -- 'USER', 'OWNER', 'ADMIN'

-- Update existing profiles (if any) to have 3500 points for demonstration as shown in mockup
UPDATE public.profiles SET points = 3500 WHERE points = 0;

-- 2. Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id TEXT NOT NULL, -- Compatible with shops.id (text)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, shop_id)
);

-- 3. Keyword settings table
CREATE TABLE IF NOT EXISTS public.keyword_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, keyword)
);

-- 4. Enhance owner_verifications
ALTER TABLE public.owner_verifications ADD COLUMN IF NOT EXISTS biz_registration_number TEXT;
ALTER TABLE public.owner_verifications ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE public.owner_verifications ADD COLUMN IF NOT EXISTS shop_category TEXT;
ALTER TABLE public.owner_verifications ADD COLUMN IF NOT EXISTS shop_lat DOUBLE PRECISION;
ALTER TABLE public.owner_verifications ADD COLUMN IF NOT EXISTS shop_lng DOUBLE PRECISION;
ALTER TABLE public.owner_verifications ADD COLUMN IF NOT EXISTS shop_address TEXT;
-- Change shop_id type to text to match shops.id and allow null
ALTER TABLE public.owner_verifications ALTER COLUMN shop_id TYPE text;
ALTER TABLE public.owner_verifications ALTER COLUMN shop_id DROP NOT NULL;

-- 5. RLS Policies
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own keywords" ON public.keyword_settings;
CREATE POLICY "Users can manage own keywords" ON public.keyword_settings
  FOR ALL USING (auth.uid() = user_id);

-- Ensure owner_verifications RLS
ALTER TABLE public.owner_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own verifications" ON public.owner_verifications;
CREATE POLICY "Users can manage own verifications" ON public.owner_verifications
  FOR ALL USING (auth.uid() = user_id);
