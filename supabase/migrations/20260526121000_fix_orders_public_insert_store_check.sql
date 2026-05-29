-- Keep public checkout inserts independent from SELECT policies on stores.

create or replace function public.can_insert_catalog_order(p_store_id uuid)
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

revoke all on function public.can_insert_catalog_order(uuid) from public;
grant execute on function public.can_insert_catalog_order(uuid) to anon, authenticated;

drop policy if exists "orders_public_insert" on public.orders;

create policy "orders_public_insert" on public.orders
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and source = 'catalog'
    and seller_id is null
    and public.can_insert_catalog_order(store_id)
  );
