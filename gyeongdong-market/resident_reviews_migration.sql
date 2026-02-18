-- Migration for Real Resident Reviews and User Profiles

-- 1. Create a profiles table if it doesn't exist
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  nickname text,
  residency_period text, -- e.g., '2년 이상 거주', '5년 거주'
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add residency info to reviews for historical reference
alter table reviews add column if not exists residency_period text;
alter table reviews add column if not exists nickname text; -- snapshot nickname

-- Enable RLS on profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- 3. SQL Function for distance sorting (PostGIS ST_Distance replacement if needed, but PostGIS is enabled)
-- This function calculates the distance between a shop and a given lat/lng
create or replace function get_shops_with_distance(user_lat double precision, user_lng double precision)
returns table (
  id uuid,
  name text,
  category text,
  lat double precision,
  lng double precision,
  distance_meters float
) as $$
begin
  return query
  select 
    s.id, s.name, s.category, s.lat, s.lng,
    st_distance(
      st_point(s.lng, s.lat)::geography,
      st_point(user_lng, user_lat)::geography
    ) as distance_meters
  from shops s
  order by distance_meters asc;
end;
$$ language plpgsql;

-- 4. Insert 10 Realistic Resident Reviews
-- We'll need some real shop IDs. I'll fetch them or use the ones from seed_mz_shops.sql if I can assume they exist.
-- I'll use placeholders for user_id assuming the user might want to test with their own account later, 
-- but for now I'll create semi-realistic UUIDs or just use a dummy one if allowable by RLS/FKs.

-- Note: Since reviews.user_id references auth.users, and I can't easily create auth users via SQL without admin,
-- I will create a dummy 'system_user' if possible or just use the current user's ID if I had it.
-- Actually, it's better to just provide the INSERT script that the user can run or I can try if I find a valid user_id.
