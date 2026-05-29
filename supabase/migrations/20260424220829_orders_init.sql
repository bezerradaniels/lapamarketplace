-- Orders feature: persist checkout before the WhatsApp hand-off so the lojista
-- sees the pedido in the dashboard even if the customer never sends the message.

create type order_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  status order_status not null default 'pending',
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (customer_phone ~ '^\+55\d{10,11}$'),
  customer_notes text check (char_length(customer_notes) <= 500),
  total_in_cents integer not null check (total_in_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_store_id_created_at_idx on orders (store_id, created_at desc);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price_in_cents integer not null check (price_in_cents >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone (anon) can create a pending order against a live (non-deleted) store.
create policy "orders_public_insert" on orders
  for insert
  with check (
    status = 'pending'
    and exists (
      select 1 from stores s
      where s.id = orders.store_id and s.deleted_at is null
    )
  );

-- Members can read/update/delete orders of their store.
create policy "orders_member_read" on orders
  for select using (is_store_member(store_id));

create policy "orders_member_update" on orders
  for update using (is_store_member(store_id)) with check (is_store_member(store_id));

create policy "orders_member_delete" on orders
  for delete using (is_store_member(store_id));

-- Order items: anyone can insert while the parent order is pending (tied to checkout).
create policy "order_items_public_insert" on order_items
  for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.status = 'pending'
    )
  );

create policy "order_items_member_read" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and is_store_member(o.store_id)
    )
  );

-- No public SELECT: the confirmation page receives the order via router state
-- from the insert response. Enumeration is blocked regardless of UUID opacity.
