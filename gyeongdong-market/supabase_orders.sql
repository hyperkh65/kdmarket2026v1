-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  shop_id uuid REFERENCES shops(id), -- Optional: if order is per shop? But cart has multiple shops.
  -- If cart is multi-shop, we split orders or have one order with items from multiple shops.
  -- Let's assume one order per checkout for simplicity, but in reality marketplaces split or bundle.
  -- The CartPage loops shopGroups but creates ONE order in the code?
  -- Wait, the code creates one order.
  -- "order_items" link to shop_id.
  
  delivery_type text DEFAULT 'PARCEL', -- 'PARCEL', 'PICKUP'
  address jsonb, -- { address, detail, zip }
  phone text,
  total_estimated int DEFAULT 0,
  status text DEFAULT 'RECEIVED', -- 'RECEIVED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES shops(id),
  name text NOT NULL,
  price_estimated int DEFAULT 0,
  qty int DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own order items" ON order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- 4. DELIVERY TRACKING (Mock for now)
-- We can use status in orders table.
