-- Stock management upgrade. Run AFTER supabase/schema.sql, in the Supabase SQL editor (or as a migration).
-- Additive and re-runnable: existing products, photos and admins are kept as they are.
--
-- Adds: owner-managed categories, product colour/brand/discount/details fields, draft + reserved statuses,
-- publish dates (for "New arrivals"), a shop_settings row, and an anonymous-safe inquiries log.
-- Security model is unchanged: the public can only READ live products; every write needs public.is_admin().

-- ---------------------------------------------------------------------------------------------
-- Categories (replaces the hard-coded 'Short sleeve' / 'Long sleeve' check)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 2 and 40),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.categories (name, sort_order) values ('Short sleeve', 1), ('Long sleeve', 2)
  on conflict (name) do nothing;
-- Safety net: keep any category already used by a product.
insert into public.categories (name)
  select distinct category from public.products where category not in (select name from public.categories)
  on conflict (name) do nothing;

alter table public.categories enable row level security;
drop policy if exists "public reads categories" on public.categories;
create policy "public reads categories" on public.categories for select using (true);
drop policy if exists "admins write categories" on public.categories;
create policy "admins write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------------------------
-- Products: new columns and constraints
-- ---------------------------------------------------------------------------------------------
alter table public.products add column if not exists color              text    check (color is null or char_length(color) <= 40);
alter table public.products add column if not exists brand              text    check (brand is null or char_length(brand) <= 60);
alter table public.products add column if not exists original_price_kes integer check (original_price_kes is null or (original_price_kes > 0 and original_price_kes <= 1000000));
alter table public.products add column if not exists discount_price_kes integer check (discount_price_kes is null or (discount_price_kes > 0 and discount_price_kes <= 1000000));
alter table public.products add column if not exists details            text    check (details is null or char_length(details) <= 1000);
alter table public.products add column if not exists new_arrival        boolean not null default false;
alter table public.products add column if not exists published_at       timestamptz;

alter table public.products drop constraint if exists products_category_check;
alter table public.products drop constraint if exists products_status_check;
alter table public.products drop constraint if exists products_images_check;

-- Image URLs must be https:// or site-relative (no data:, javascript: etc.).
create or replace function public.images_ok(imgs text[]) returns boolean
  language sql immutable as $$
  select coalesce(bool_and(i ~ '^(https://|/)'), true) from unnest(imgs) as i;
$$;

alter table public.products drop constraint if exists products_status_values;
alter table public.products add constraint products_status_values
  check (status in ('draft', 'available', 'reserved', 'sold', 'archived'));

-- A draft may have no photos yet; anything else needs at least one.
alter table public.products drop constraint if exists products_images_rule;
alter table public.products add constraint products_images_rule
  check ((status = 'draft' or coalesce(array_length(images, 1), 0) >= 1) and public.images_ok(images));

alter table public.products drop constraint if exists products_discount_rule;
alter table public.products add constraint products_discount_rule
  check (discount_price_kes is null or (price_kes is not null and discount_price_kes < price_kes));

alter table public.products drop constraint if exists products_original_rule;
alter table public.products add constraint products_original_rule
  check (original_price_kes is null or original_price_kes > coalesce(price_kes, 0));

do $$ begin
  alter table public.products add constraint products_category_fk
    foreign key (category) references public.categories (name) on update cascade on delete restrict;
exception when duplicate_object then null; end $$;

-- Stamp published_at the first time a product leaves draft. Items already live are not touched.
create or replace function public.stamp_published_at() returns trigger language plpgsql as $$
begin
  if new.status <> 'draft' and new.published_at is null and (tg_op = 'INSERT' or old.status = 'draft') then
    new.published_at := now();
  end if;
  return new;
end $$;
drop trigger if exists products_stamp_published on public.products;
create trigger products_stamp_published before insert or update on public.products
  for each row execute function public.stamp_published_at();

create index if not exists products_status_published_idx on public.products (status, published_at desc);

-- Drafts are visible to admins only (archived already were).
drop policy if exists "public reads live products" on public.products;
create policy "public reads live products" on public.products
  for select using (status not in ('archived', 'draft') or public.is_admin());

-- ---------------------------------------------------------------------------------------------
-- Shop settings: one row, public read, admin write, every field validated by the database
-- ---------------------------------------------------------------------------------------------
create table if not exists public.shop_settings (
  id              smallint primary key default 1 check (id = 1),
  shop_name       text not null default '' check (char_length(shop_name) <= 60),
  slogan          text not null default '' check (char_length(slogan) <= 120),
  logo_url        text not null default '' check (logo_url = '' or logo_url ~ '^(https://|/)'),
  whatsapp_number text not null default '' check (whatsapp_number = '' or whatsapp_number ~ '^[0-9]{9,15}$'),
  instagram_url   text not null default '' check (instagram_url = '' or instagram_url ~* '^https://(www\.)?instagram\.com/[A-Za-z0-9._/-]+/?(\?.*)?$'),
  tiktok_url      text not null default '' check (tiktok_url = '' or tiktok_url ~* '^https://(www\.|vm\.)?tiktok\.com/[A-Za-z0-9@._/-]+/?(\?.*)?$'),
  contact_email   text not null default '' check (contact_email = '' or contact_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  contact_phone   text not null default '' check (contact_phone = '' or contact_phone ~ '^\+?[0-9 -]{7,20}$'),
  announcement    text not null default '' check (char_length(announcement) <= 200),
  description     text not null default '' check (char_length(description) <= 600),
  updated_at      timestamptz not null default now()
);
insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists shop_settings_touch on public.shop_settings;
create trigger shop_settings_touch before update on public.shop_settings
  for each row execute function public.touch_updated_at();

alter table public.shop_settings enable row level security;
drop policy if exists "public reads settings" on public.shop_settings;
create policy "public reads settings" on public.shop_settings for select using (true);
drop policy if exists "admins insert settings" on public.shop_settings;
create policy "admins insert settings" on public.shop_settings for insert with check (public.is_admin());
drop policy if exists "admins update settings" on public.shop_settings;
create policy "admins update settings" on public.shop_settings for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------------------------
-- Inquiries: a log of "Ask on WhatsApp" / "Send request" clicks. No names or phone numbers are stored.
-- Visitors may only INSERT (never read, change or delete); admins manage the rows.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  product_id   text references public.products (id) on delete set null,
  product_name text not null check (char_length(product_name) between 1 and 120),
  sku          text not null default '' check (char_length(sku) <= 24),
  channel      text not null check (channel in ('product-inquiry', 'order-request')),
  handled      boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;
drop policy if exists "anyone logs an inquiry" on public.inquiries;
create policy "anyone logs an inquiry" on public.inquiries for insert to anon, authenticated with check (handled = false);
drop policy if exists "admins read inquiries" on public.inquiries;
create policy "admins read inquiries" on public.inquiries for select using (public.is_admin());
drop policy if exists "admins update inquiries" on public.inquiries;
create policy "admins update inquiries" on public.inquiries for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete inquiries" on public.inquiries;
create policy "admins delete inquiries" on public.inquiries for delete using (public.is_admin());
