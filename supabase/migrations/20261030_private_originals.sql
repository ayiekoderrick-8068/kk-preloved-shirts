-- Private storage for original, full-resolution product photos. Run AFTER 20261029_stock_management.sql.
-- Additive and re-runnable.
--
-- The storefront only ever uses the resized copies in the public `product-images` bucket. The camera original
-- is kept here, in a PRIVATE bucket: there is no public URL and no policy for visitors, so only a signed-in admin
-- (public.is_admin()) can list, download (via a short-lived signed link), replace or delete it.
-- An original is linked to its photo by name: products/<id>-1600.webp  <->  products/<id>-original
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-originals', 'product-originals', false, 26214400, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins manage product originals" on storage.objects;
create policy "admins manage product originals" on storage.objects
  for all using (bucket_id = 'product-originals' and public.is_admin())
  with check (bucket_id = 'product-originals' and public.is_admin());
