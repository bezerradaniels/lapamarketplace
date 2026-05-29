-- SECURITY (H-3): remove the public direct-INSERT policies on orders/order_items.
--
-- Public catalog checkout MUST go through public.create_catalog_order(), a
-- SECURITY DEFINER RPC that validates store, prices, stock and coupons
-- server-side. Because it runs as the definer it bypasses RLS and does NOT
-- need an anon INSERT policy.
--
-- The old `orders_public_insert` / `order_items_public_insert` policies let any
-- anonymous client POST directly to PostgREST with arbitrary totals, product
-- names and prices — bypassing every RPC validation, enabling order/notification
-- spam (store_id is enumerable via the public stores read) and fabricated data.
--
-- Member/manual paths keep their own policies (orders_member_insert,
-- order_items_member_insert) and are unaffected.

drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "order_items_public_insert" on public.order_items;

-- These helpers were only used by the dropped public policies. Revoke anon/authenticated
-- execute so the now-unused functions are not callable from the client.
revoke execute on function public.can_insert_catalog_order(uuid) from anon, authenticated;
revoke execute on function public.can_insert_catalog_order_item(uuid) from anon, authenticated;
