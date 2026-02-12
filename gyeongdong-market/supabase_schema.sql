-- Enable PostGIS for geographical queries (if supported by your plan, otherwise stick to simple lat/lng)
create extension if not exists postgis;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Define Enums for status integrity
create type zone_type as enum ('SEARCH', 'PICKING');
create type poi_type as enum ('GATE', 'RESTROOM', 'HOTSPOT', 'PICKUP');
create type wiki_status_type as enum ('PENDING', 'APPROVED', 'REJECTED');
create type owner_post_type as enum ('NOTICE', 'PR');
create type order_status_type as enum ('RECEIVED', 'PICKING', 'SUB_PENDING', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED');
create type delivery_type as enum ('QUICK', 'PARCEL');
create type picker_event_type as enum ('OUT_OF_STOCK', 'SUB_SUGGESTED', 'PURCHASED', 'PACKED');
create type claim_type as enum ('MISSING', 'DAMAGED', 'WRONG', 'DELAY', 'QUALITY');
create type claim_status_type as enum ('OPEN', 'RESOLVED', 'REJECTED');

-- 1. ZONES (Area definitions)
create table zones (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type zone_type not null default 'SEARCH',
  polygon geography(POLYGON, 4326), -- Use geometry if postgis is enabled
  priority int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. POIS (Points of Interest)
create table pois (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type poi_type not null,
  lat double precision not null,
  lng double precision not null,
  zone_id uuid references zones(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SHOPS (Core Data)
create table shops (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text, 
  lat double precision not null,
  lng double precision not null,
  zone_id uuid references zones(id),
  phone text,
  hours_text text,
  payment_methods text[], -- ['CASH', 'CARD', 'TRANSFER']
  tags text[],
  delivery_friendliness_score int default 0,
  is_verified boolean default false,
  owner_id uuid references auth.users(id), -- Link to owner
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SHOP PHOTOS
create table shop_photos (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  url text not null,
  uploader_user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. WIKI REVISIONS (Community Edits)
create table wiki_revisions (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  editor_user_id uuid references auth.users(id) not null,
  diff_json jsonb not null, -- Stores changes { field: "new_value" }
  evidence_photo_urls text[],
  status wiki_status_type default 'PENDING',
  reviewer_user_id uuid references auth.users(id), -- Admin who approved/rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. REVIEWS
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  rating smallint check (rating >= 1 and rating <= 5),
  tags text[],
  text text,
  photo_urls text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. OWNER VERIFICATIONS
create table owner_verifications (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) not null,
  user_id uuid references auth.users(id) not null,
  biz_reg_doc_url text not null,
  sign_photo_url text, -- Store sign photo
  bank_verified boolean default false,
  status text default 'PENDING', -- PENDING, APPROVED, REJECTED
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. OWNER POSTS (Notices)
create table owner_posts (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) not null,
  owner_user_id uuid references auth.users(id) not null,
  type owner_post_type default 'NOTICE',
  title text not null,
  content text,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ORDERS (Commerce Core)
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  status order_status_type default 'RECEIVED',
  delivery_type delivery_type not null,
  address jsonb not null, -- { address: "", detail: "", zip: "" }
  phone text not null,
  total_estimated int not null,
  total_final int, -- Updated after picking/substitution
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ORDER ITEMS
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  shop_id uuid references shops(id), -- Items belong to shops
  name text not null,
  option_text text,
  qty int default 1,
  price_estimated int not null,
  price_final int,
  status text default 'PENDING' -- PENDING, PICKED, SUB_PENDING, OUT_OF_STOCK
);

-- 11. SUBSTITUTION RULES
create table substitution_rules (
  order_id uuid references orders(id) on delete cascade primary key,
  allow_sub boolean default true,
  price_cap_pct int default 10, -- Allow +10% price variation
  qty_tolerance int default 0,
  sensitive_flags jsonb -- { "no_sugar": true, "organic_only": false }
);

-- 12. PICKER EVENTS (SOP Tracking)
create table picker_events (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  type picker_event_type not null,
  photo_url text,
  note text,
  picker_user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. CLAIMS
create table claims (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) not null,
  type claim_type not null,
  description text,
  photo_urls text[],
  status claim_status_type default 'OPEN',
  resolution text, -- "Refunded 5000 KRW"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. REPORTS (Moderation)
create table reports (
  id uuid default uuid_generate_v4() primary key,
  target_type text not null, -- 'REVIEW', 'WIKI', 'SHOP'
  target_id uuid not null,
  reporter_user_id uuid references auth.users(id),
  reason text,
  status text default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- RLS POLICIES (Minimum setup for MVP Security)

-- Enable RLS on all tables
alter table zones enable row level security;
alter table pois enable row level security;
alter table shops enable row level security;
alter table shop_photos enable row level security;
alter table wiki_revisions enable row level security;
alter table reviews enable row level security;
alter table owner_verifications enable row level security;
alter table owner_posts enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table substitution_rules enable row level security;
alter table picker_events enable row level security;
alter table claims enable row level security;

-- Public Read Policies (Map Data)
create policy "Public read zones" on zones for select using (true);
create policy "Public read pois" on pois for select using (true);
create policy "Public read shops" on shops for select using (true);
create policy "Public read shop_photos" on shop_photos for select using (true);
create policy "Public read reviews" on reviews for select using (true);
create policy "Public read owner_posts" on owner_posts for select using (true);

-- Authenticated User Writes
create policy "Users can update own profile" on auth.users for update using (auth.uid() = id);

-- Wiki Revisions
create policy "Users can see their own wiki edits" on wiki_revisions for select using (auth.uid() = editor_user_id);
create policy "Users can create wiki edits" on wiki_revisions for insert with check (auth.uid() = editor_user_id);
-- (Admin approval policy needs role check, skipped for simplicity, assume backend/admin view handles it)

-- Orders
create policy "Users manage own orders" on orders for select using (auth.uid() = user_id);
create policy "Users create own orders" on orders for insert with check (auth.uid() = user_id);

-- Order Items
create policy "Users manage own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- Admin/Picker Access
-- For MVP, you might use Service Role Key in backend or add a 'role' column to public.profiles and check it here.
-- Example: create policy "Admins see all orders" on orders for select using ( (select role from profiles where id = auth.uid()) in ('ADMIN', 'PICKER') );

