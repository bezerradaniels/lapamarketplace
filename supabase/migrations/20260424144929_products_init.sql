-- Products belong to a store. Soft-deleted via `deleted_at`.
-- Public catalog reads only active, non-deleted products for non-deleted stores.
-- Store members can CRUD products of their stores.

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  description    text,
  price_in_cents integer not null check (price_in_cents >= 0),
  images         text[] not null default '{}',
  is_active      boolean not null default true,
  stock          integer check (stock is null or stock >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index if not exists products_store_id_idx on public.products (store_id);
create index if not exists products_store_active_idx
  on public.products (store_id) where deleted_at is null and is_active;
create index if not exists products_created_at_idx on public.products (created_at desc);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Public read: only active products of live stores.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and is_active
    and exists (
      select 1 from public.stores s
      where s.id = products.store_id and s.deleted_at is null
    )
  );

-- Members of the store can see all (including inactive / deleted-within-grace).
drop policy if exists products_member_read on public.products;
create policy products_member_read on public.products
  for select
  to authenticated
  using (public.is_store_member(store_id));

drop policy if exists products_member_write on public.products;
create policy products_member_write on public.products
  for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));
