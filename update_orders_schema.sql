-- 2026-02-18 Order System Update
-- Run this in Supabase SQL Editor to update your database schema.

-- 1. Add missing columns to orders table
DO $$ 
BEGIN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_contact TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS purchase_proof_images TEXT[];
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists, skipping';
END $$;

-- 2. Create products table if it doesn't exist (critical for orders)
CREATE TABLE IF NOT EXISTS shop_products (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT REFERENCES shops(id), -- Assuming 'shops' table exists
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    unit TEXT,
    image_url TEXT,
    description TEXT,
    category TEXT,
    is_sold_out BOOLEAN DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enum Updates (Optional, if status is an enum type, but we use TEXT so no need)
-- Just ensuring the orders table has all standard columns from setup_purchase_agency.sql if you haven't run it yet.
-- See setup_purchase_agency.sql for full schema.
