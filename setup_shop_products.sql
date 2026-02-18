-- Create Shop Products Table
CREATE TABLE IF NOT EXISTS public.shop_products (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price INTEGER DEFAULT 0,
    unit TEXT DEFAULT '개', -- 'g', '돈', '1인분', '박스' 등
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view products
DROP POLICY IF EXISTS "Anyone can view products" ON public.shop_products;
CREATE POLICY "Anyone can view products" ON public.shop_products
    FOR SELECT USING (true);

-- Admins and Shop Owners can manage products
DROP POLICY IF EXISTS "Admins and Owners can manage products" ON public.shop_products;
CREATE POLICY "Admins and Owners can manage products" ON public.shop_products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR id = (SELECT owner_id FROM shops WHERE id = shop_products.shop_id)))
    );
