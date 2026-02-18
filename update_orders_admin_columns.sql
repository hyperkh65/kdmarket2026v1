-- Add administration columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_contact TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS purchase_proof_images TEXT[] DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_images TEXT[] DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Enable Realtime for orders table (essential for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
