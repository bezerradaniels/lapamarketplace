-- Public buckets don't need SELECT policies on storage.objects for URL access
-- (the public URL is served by the CDN). Dropping them prevents anon clients
-- from enumerating the bucket via list().
drop policy if exists "public_read_store_logos" on storage.objects;
drop policy if exists "public_read_product_images" on storage.objects;
