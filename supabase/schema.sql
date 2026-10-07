-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists brands (id text primary key, name text not null);
create table if not exists products (
  id text primary key,
  name text not null,
  brand text not null,
  category text not null default 'Other',
  price numeric not null check (price >= 0),
  description text not null default '',
  image text not null default '',
  video text not null default '',
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists settings (id text primary key, data jsonb not null default '{}');
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  name text not null, location text not null, items jsonb not null, total numeric not null,
  created_at timestamptz not null default now()
);
create table if not exists admins (user_id uuid primary key references auth.users(id) on delete cascade);

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

alter table brands enable row level security;
alter table products enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;
alter table admins enable row level security;  -- no policies: only is_admin() can read it

create policy "public read brands" on brands for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read settings" on settings for select using (true);
create policy "admin write brands" on brands for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin write products" on products for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin write settings" on settings for all to authenticated using (is_admin()) with check (is_admin());

-- Anyone can place an order (well-formed only); only admins can read them
create policy "anyone can create order" on orders for insert to anon, authenticated
  with check (char_length(name) <= 100 and char_length(location) <= 200
    and jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50);
create policy "admin read orders" on orders for select to authenticated using (is_admin());
create policy "admin delete orders" on orders for delete to authenticated using (is_admin());

-- Image bucket: public read, admin-only upload (max 3 MB, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
create policy "admin upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.is_admin());
create policy "admin update images" on storage.objects for update to authenticated
  using (bucket_id = 'images' and public.is_admin());
create policy "admin delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'images' and public.is_admin());
