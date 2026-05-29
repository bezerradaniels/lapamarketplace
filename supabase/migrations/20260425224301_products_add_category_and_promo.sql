-- Adds product category (free-text) and promotional price.
-- - `category`: optional, lowercased + trimmed at write time. Used for the
--    chip-filter row on the public catalog.
-- - `promo_price_in_cents`: optional sale price; must be lower than
--    `price_in_cents` and non-negative when set.

alter table public.products
  add column if not exists category text,
  add column if not exists promo_price_in_cents integer;

-- Constraints: promo must be a non-negative integer strictly below the regular
-- price. `null` is allowed (no promotion).
alter table public.products
  drop constraint if exists products_promo_price_check;
alter table public.products
  add constraint products_promo_price_check
  check (
    promo_price_in_cents is null
    or (
      promo_price_in_cents >= 0
      and promo_price_in_cents < price_in_cents
    )
  );

-- Lightweight category length / shape guard.
alter table public.products
  drop constraint if exists products_category_check;
alter table public.products
  add constraint products_category_check
  check (category is null or char_length(category) between 1 and 40);

-- Index used by the public catalog category-chip filter.
create index if not exists products_store_category_idx
  on public.products (store_id, category)
  where deleted_at is null and is_active = true;
