-- Move RLS helper functions out of the exposed public API schema.

create schema if not exists private;

create or replace function private.can_insert_catalog_order(p_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.stores s
    where s.id = p_store_id
      and s.deleted_at is null
  );
$$;

create or replace function private.can_insert_catalog_order_item(p_order_id uuid)
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

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

revoke all on function private.can_insert_catalog_order(uuid) from public;
revoke all on function private.can_insert_catalog_order_item(uuid) from public;
grant execute on function private.can_insert_catalog_order(uuid) to anon, authenticated;
grant execute on function private.can_insert_catalog_order_item(uuid) to anon, authenticated;

drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "order_items_public_insert" on public.order_items;

create policy "orders_public_insert" on public.orders
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and source = 'catalog'
    and seller_id is null
    and private.can_insert_catalog_order(store_id)
  );

create policy "order_items_public_insert" on public.order_items
  for insert
  to anon, authenticated
  with check (private.can_insert_catalog_order_item(order_id));

drop function if exists public.can_insert_catalog_order(uuid);
drop function if exists public.can_insert_catalog_order_item(uuid);
