-- Force add missing columns and constraints to courses table (in case it existed before with old schema)

-- 1. Ensure columns exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS stops JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Ensure foreign key constraint
-- Drop existing constraint if named differently to standardize
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_author_id_fkey'
    ) THEN
        ALTER TABLE public.courses DROP CONSTRAINT courses_author_id_fkey;
    END IF;
END $$;

ALTER TABLE public.courses 
ADD CONSTRAINT courses_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 3. Ensure profiles RLS policies are correct for public viewing (again, just to be safe)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


-- 4. Ensure courses RLS policies are correct
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
