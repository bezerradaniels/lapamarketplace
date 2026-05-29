-- Fixes `column reference "code" is ambiguous` inside the `validate_coupon`
-- RPC. plpgsql's OUT parameters had the same names as `store_coupons` columns
-- (id, code, etc.), so `c.code` couldn't be resolved unambiguously inside
-- `RETURN QUERY`. The directive `#variable_conflict use_column` tells plpgsql
-- to prefer column references when there's a name clash with OUT parameters.

create or replace function public.validate_coupon(
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
  expires_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  c public.store_coupons%rowtype;
  computed_discount integer;
begin
  if coupon_code is null or btrim(coupon_code) = '' then
    raise exception using errcode = 'check_violation', message = 'coupon_required';
  end if;

  select * into c
  from public.store_coupons
  where store_id = target_store
    and code = upper(btrim(coupon_code))
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
         computed_discount, c.min_subtotal_in_cents, c.expires_at;
end $$;
