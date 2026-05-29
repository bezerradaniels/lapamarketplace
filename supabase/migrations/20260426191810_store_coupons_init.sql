-- Store coupons applied by the END CUSTOMER at checkout. Distinct from
-- Stripe coupons which the LOJISTA uses on their own subscription.

do $$ begin
  create type public.coupon_discount_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

create table if not exists public.store_coupons (
  id                       uuid primary key default gen_random_uuid(),
  store_id                 uuid not null references public.stores(id) on delete cascade,
  code                     text not null
                             check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,29}$'),
  description              text,
  discount_type            public.coupon_discount_type not null,
  discount_value           integer not null check (discount_value > 0),
  min_subtotal_in_cents    integer not null default 0
                             check (min_subtotal_in_cents >= 0),
  max_uses                 integer check (max_uses is null or max_uses > 0),
  used_count               integer not null default 0 check (used_count >= 0),
  is_active                boolean not null default true,
  expires_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (store_id, code)
);

create index if not exists store_coupons_store_active_idx
  on public.store_coupons (store_id) where is_active = true;

drop trigger if exists store_coupons_set_updated_at on public.store_coupons;
create trigger store_coupons_set_updated_at
  before update on public.store_coupons
  for each row execute function public.set_updated_at();

alter table public.store_coupons
  drop constraint if exists store_coupons_percent_range;
alter table public.store_coupons
  add constraint store_coupons_percent_range
  check (
    discount_type <> 'percent'
    or (discount_value between 1 and 100)
  );

alter table public.store_coupons enable row level security;

drop policy if exists store_coupons_member_select on public.store_coupons;
create policy store_coupons_member_select on public.store_coupons
  for select to authenticated using (public.is_store_member(store_id));

drop policy if exists store_coupons_member_insert on public.store_coupons;
create policy store_coupons_member_insert on public.store_coupons
  for insert to authenticated with check (public.is_store_member(store_id));

drop policy if exists store_coupons_member_update on public.store_coupons;
create policy store_coupons_member_update on public.store_coupons
  for update to authenticated using (public.is_store_member(store_id))
                             with check (public.is_store_member(store_id));

drop policy if exists store_coupons_member_delete on public.store_coupons;
create policy store_coupons_member_delete on public.store_coupons
  for delete to authenticated using (public.is_store_member(store_id));

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

grant execute on function public.validate_coupon(uuid, text, integer) to anon, authenticated;
