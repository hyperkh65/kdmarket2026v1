-- Ensure Profiles are readable by everyone
-- This is critical for fetching author information in community and activity feeds.

-- 1. Enable RLS on profiles if not already enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public Read Access
-- Drop existing policy if any to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create new policy
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 3. Ensure users can update their own profiles (if not already set)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Fix potential infinite recursion if policies were circular (should be fine with simple SELECT true)
