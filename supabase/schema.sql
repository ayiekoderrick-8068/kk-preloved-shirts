-- KK Preloved Shirts - Supabase schema. Run in the Supabase SQL editor (or as a migration).
-- Security model: the public (anon) role can only READ non-archived products.
-- Every write requires a signed-in user who is listed in public.admins. Enforced by RLS, not by the frontend.

create table if not exists public.products (
  id           text primary key default gen_random_uuid()::text,
  sku          text not null unique check (sku ~ '^[A-Za-z0-9-]{2,24}$'),
  name         text not null check (char_length(name) between 2 and 120),
  category     text not null check (category in ('Short sleeve', 'Long sleeve')),
  description  text not null default '' check (char_length(description) <= 1000),
  price_kes    integer check (price_kes is null or (price_kes > 0 and price_kes <= 1000000)), -- null = price to confirm
  size         text check (size is null or char_length(size) <= 16),
  measurements jsonb,
  condition    text check (condition is null or condition in ('Like new', 'Very good', 'Good', 'Fair')),
  flaws        text check (flaws is null or char_length(flaws) <= 1000),
  quantity     integer check (quantity is null or (quantity >= 0 and quantity <= 999)),
  status       text not null default 'available' check (status in ('available', 'sold', 'archived')),
  images       text[] not null check (array_length(images, 1) >= 1),
  featured     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Admin allow-list. Add yourself after creating your user in Supabase Auth (see README).
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.products enable row level security;
alter table public.admins enable row level security;

drop policy if exists "public reads live products" on public.products;
create policy "public reads live products" on public.products
  for select using (status <> 'archived' or public.is_admin());

drop policy if exists "admins insert" on public.products;
create policy "admins insert" on public.products for insert with check (public.is_admin());

drop policy if exists "admins update" on public.products;
create policy "admins update" on public.products for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete" on public.products;
create policy "admins delete" on public.products for delete using (public.is_admin());

drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins for select using (user_id = auth.uid());

-- Product photos: public read, admin-only write, 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "admins write product images" on storage.objects;
create policy "admins write product images" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- After creating your admin user in Authentication > Users, run (replace the email):
--   insert into public.admins (user_id) select id from auth.users where email = 'owner@example.com';
