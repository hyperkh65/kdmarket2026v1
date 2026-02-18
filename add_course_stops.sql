-- Add stops column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS stops JSONB DEFAULT '[]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.courses.stops IS 'List of shop stops in the course: [{shop_id, name, note}]';
