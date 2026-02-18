-- Enable storage extension
-- (Usually enabled by default)

-- 1. Create a public bucket for shop photos
insert into storage.buckets (id, name, public) values ('shop-photos', 'shop-photos', true);

-- 2. Create a public bucket for wiki evidence
insert into storage.buckets (id, name, public) values ('wiki-evidence', 'wiki-evidence', true);

-- 3. Policy: Public Read from both buckets
create policy "Public Access Shop Photos" on storage.objects for select using ( bucket_id = 'shop-photos' );
create policy "Public Access Wiki Evidence" on storage.objects for select using ( bucket_id = 'wiki-evidence' );

-- 4. Policy: Authenticated User Upload (MVP: Anyone logged in)
create policy "Authenticated User Upload Shop Photos" on storage.objects for insert with check ( bucket_id = 'shop-photos' and auth.role() = 'authenticated' );
create policy "Authenticated User Upload Wiki Evidence" on storage.objects for insert with check ( bucket_id = 'wiki-evidence' and auth.role() = 'authenticated' );
