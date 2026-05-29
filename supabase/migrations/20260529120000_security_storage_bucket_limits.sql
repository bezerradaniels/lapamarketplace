-- SECURITY (M-3): enforce file type and size limits at the storage layer.
--
-- The client (src/lib/supabase/storage.ts) sniffs magic bytes and caps size at
-- 5 MB, but that is bypassable by calling the Storage API directly. The buckets
-- were created without `file_size_limit` / `allowed_mime_types`, so server-side
-- any authenticated store member could upload arbitrary file types/sizes to a
-- PUBLIC bucket. Pin the limits on the buckets so the server enforces them.

update storage.buckets
set
  file_size_limit = 5242880, -- 5 MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id in ('store-logos', 'product-images');
