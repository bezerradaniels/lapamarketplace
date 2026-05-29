-- SECURITY (M-4): least privilege for the `seller` role within a store.
--
-- Before: every store_member (owner OR seller) had full read/write to ALL
-- customers (incl. CPF/CNPJ, phone, email — LGPD-sensitive), orders and
-- products of the store. A seller should only handle their *assigned* records.
--
-- After:
--   * Owners keep full access to everything in their store.
--   * Sellers can only read/update customers and orders where they are the
--     assigned seller (seller_id = auth.uid()), and may only create manual
--     orders assigned to themselves.
--   * Catalog checkout is unaffected: it runs via the SECURITY DEFINER RPC
--     (create_catalog_order), which bypasses RLS.
--
-- Note: catalog orders are created with seller_id = NULL (unassigned) and are
-- therefore visible to the OWNER only until the owner assigns them to a seller.

-- ─── Owner helper (role-aware; definer to avoid RLS recursion on store_members) ─
create or replace function public.is_store_owner(target_store uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- ============================================================================
-- customers
-- ============================================================================
drop policy if exists customers_member_read  on public.customers;
drop policy if exists customers_member_write  on public.customers;

create policy customers_owner_all on public.customers
  for all
  to authenticated
  using (public.is_store_owner(store_id))
  with check (public.is_store_owner(store_id));

create policy customers_seller_scoped on public.customers
  for all
  to authenticated
  using (public.is_store_member(store_id) and seller_id = auth.uid())
  with check (public.is_store_member(store_id) and seller_id = auth.uid());

-- ============================================================================
-- orders
-- ============================================================================
drop policy if exists orders_member_read   on public.orders;
drop policy if exists orders_member_update  on public.orders;
drop policy if exists orders_member_delete  on public.orders;
drop policy if exists orders_member_insert  on public.orders;

-- Read: owner sees all store orders; seller sees only orders assigned to them.
create policy orders_select on public.orders
  for select
  to authenticated
  using (
    public.is_store_owner(store_id)
    or (public.is_store_member(store_id) and seller_id = auth.uid())
  );

-- Manual insert: owner for any; seller only assigned to self.
-- (Catalog orders are inserted by the SECURITY DEFINER RPC and bypass RLS.)
create policy orders_manual_insert on public.orders
  for insert
  to authenticated
  with check (
    status = 'pending'
    and source = 'manual'
    and (
      public.is_store_owner(store_id)
      or (public.is_store_member(store_id) and seller_id = auth.uid())
    )
  );

create policy orders_update on public.orders
  for update
  to authenticated
  using (
    public.is_store_owner(store_id)
    or (public.is_store_member(store_id) and seller_id = auth.uid())
  )
  with check (
    public.is_store_owner(store_id)
    or (public.is_store_member(store_id) and seller_id = auth.uid())
  );

-- Delete: owners only.
create policy orders_delete on public.orders
  for delete
  to authenticated
  using (public.is_store_owner(store_id));

-- ============================================================================
-- order_items: scope reads to the parent order's visibility
-- ============================================================================
drop policy if exists order_items_member_read on public.order_items;

create policy order_items_select on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_store_owner(o.store_id)
          or (public.is_store_member(o.store_id) and o.seller_id = auth.uid())
        )
    )
  );

-- order_items_member_insert (created in 20260526120000) is kept: a member may
-- insert items for an order they just created; the order INSERT policy above is
-- the gate that constrains which orders a seller can create.
