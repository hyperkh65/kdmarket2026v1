-- Allow Admins to view all orders (Fixing "Policy already exists" error)

-- 1. Orders Table Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies explicitly using the EXACT names we are about to create
-- and any likely previous names to be safe.
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;

-- Create comprehensive policies
-- Policy for Users: Can view their own orders
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for Admins: Can view ALL orders
CREATE POLICY "Admins can view all orders" 
ON public.orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'PICKER')
  )
);

-- Policy for Admins: Can UPDATE ALL orders (Added this for order management)
CREATE POLICY "Admins can update all orders" 
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'PICKER')
  )
);

-- Policy for Insert (Users only)
CREATE POLICY "Users create own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 2. Order Items Table Policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop correct names here too
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Policy for Users: Can view items of their own orders
CREATE POLICY "Users can view own order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Policy for Admins: Can view ALL order items
CREATE POLICY "Admins can view all order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'PICKER')
  )
);
