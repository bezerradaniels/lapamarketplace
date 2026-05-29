-- Records which coupon was applied to which order (if any).

alter table public.orders
  add column if not exists coupon_id uuid references public.store_coupons(id)
    on delete set null,
  add column if not exists coupon_code text,
  add column if not exists discount_in_cents integer not null default 0
    check (discount_in_cents >= 0);

create index if not exists orders_coupon_idx
  on public.orders (coupon_id) where coupon_id is not null;

create or replace function public.record_coupon_usage(target_coupon uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.store_coupons%rowtype;
begin
  select * into c from public.store_coupons where id = target_coupon
    for update;
  if not found then return; end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    raise exception using errcode = 'check_violation', message = 'coupon_max_uses_reached';
  end if;
  update public.store_coupons
    set used_count = used_count + 1
    where id = target_coupon;
end $$;

grant execute on function public.record_coupon_usage(uuid) to anon, authenticated;
