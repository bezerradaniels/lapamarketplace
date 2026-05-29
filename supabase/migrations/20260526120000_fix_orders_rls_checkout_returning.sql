-- Fix checkout RLS without requiring public SELECT on sensitive order rows.
-- Public checkout inserts rows without `select=*`; dashboard/manual flows keep
-- using member SELECT policies for their own store.

create or replace function public.can_insert_catalog_order_item(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.status = 'pending'
      and o.source = 'catalog'
      and o.created_at > now() - interval '30 minutes'
  );
$$;

revoke all on function public.can_insert_catalog_order_item(uuid) from public;
grant execute on function public.can_insert_catalog_order_item(uuid) to anon, authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "orders_member_insert" on public.orders;
drop policy if exists "order_items_public_insert" on public.order_items;
drop policy if exists "order_items_member_insert" on public.order_items;

create policy "orders_public_insert" on public.orders
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and source = 'catalog'
    and seller_id is null
    and exists (
      select 1
      from public.stores s
      where s.id = orders.store_id
        and s.deleted_at is null
    )
  );

create policy "orders_member_insert" on public.orders
  for insert
  to authenticated
  with check (
    status = 'pending'
    and source = 'manual'
    and is_store_member(store_id)
  );

create policy "order_items_public_insert" on public.order_items
  for insert
  to anon, authenticated
  with check (public.can_insert_catalog_order_item(order_id));

create policy "order_items_member_insert" on public.order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and is_store_member(o.store_id)
    )
  );
