-- Add category targeting and custom URL to store coupons.
-- category_id: optional, restricts coupon to products in a specific category/subcategory
-- custom_url: optional, allows merchants to share a custom URL like /c/PROMO2025

alter table public.store_coupons
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists custom_url text check (custom_url ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$');

-- Index for coupon lookup by custom URL
create index if not exists store_coupons_custom_url_idx
  on public.store_coupons (store_id, custom_url)
  where custom_url is not null and is_active = true;

-- Ensure custom_url is unique per store
alter table public.store_coupons
  drop constraint if exists store_coupons_custom_url_unique;
alter table public.store_coupons
  add constraint store_coupons_custom_url_unique
  unique (store_id, custom_url);

-- Drop existing validate_coupon function to recreate with new return type
drop function if exists public.validate_coupon(uuid, text, integer);

-- Recreate validate_coupon to also accept custom_url instead of code
create function public.validate_coupon(
  target_store uuid,
  coupon_code text,
  subtotal_in_cents integer
)
returns table (
  id uuid,
  code text,
  description text,
  discount_type public.coupon_discount_type,
  discount_value integer,
  discount_in_cents integer,
  min_subtotal_in_cents integer,
  expires_at timestamptz,
  category_id uuid
)
language plpgsql stable security definer set search_path = public as $$
declare
  c public.store_coupons%rowtype;
  computed_discount integer;
begin
  if coupon_code is null or btrim(coupon_code) = '' then
    raise exception using errcode = 'check_violation', message = 'coupon_required';
  end if;

  -- Try to find by code first, then by custom_url
  select * into c
  from public.store_coupons
  where store_id = target_store
    and (code = upper(btrim(coupon_code)) or custom_url = lower(btrim(coupon_code)))
    and is_active = true;

  if not found then
    raise exception using errcode = 'check_violation', message = 'coupon_not_found';
  end if;

  if c.expires_at is not null and c.expires_at < now() then
    raise exception using errcode = 'check_violation', message = 'coupon_expired';
  end if;

  if c.max_uses is not null and c.used_count >= c.max_uses then
    raise exception using errcode = 'check_violation', message = 'coupon_max_uses_reached';
  end if;

  if subtotal_in_cents < c.min_subtotal_in_cents then
    raise exception using errcode = 'check_violation', message = 'coupon_min_subtotal_not_reached';
  end if;

  if c.discount_type = 'percent' then
    computed_discount := (subtotal_in_cents * c.discount_value) / 100;
  else
    computed_discount := least(c.discount_value, subtotal_in_cents);
  end if;

  return query
  select c.id, c.code, c.description, c.discount_type, c.discount_value,
         computed_discount, c.min_subtotal_in_cents, c.expires_at, c.category_id;
end $$;
