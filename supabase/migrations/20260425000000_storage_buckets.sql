-- Public storage buckets for store branding and product images.
-- Files are namespaced by store_id folder so a single RLS check works for both.
-- Path convention: `{store_id}/{anything}` — the first path segment MUST be the store_id UUID.

insert into storage.buckets (id, name, public)
values
  ('store-logos', 'store-logos', true),
  ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public reads (these are public buckets for the end-customer catalog).
create policy "public_read_store_logos"
  on storage.objects for select
  using (bucket_id = 'store-logos');

create policy "public_read_product_images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Members can write to `{store_id}/...` within their own stores.
create policy "members_write_store_logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'store-logos'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "members_update_store_logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'store-logos'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'store-logos'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "members_delete_store_logos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'store-logos'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "members_write_product_images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "members_update_product_images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'product-images'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "members_delete_product_images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and is_store_member(((storage.foldername(name))[1])::uuid)
  );
