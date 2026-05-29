-- Seller catalogs: each seller has their own public catalog at /s/{slug}.
-- Separate from store_members (which handles dashboard access).
-- A seller catalog can exist without a linked Zapable user account;
-- dashboard access is opt-in via has_dashboard_access + linked_user_id.

create table if not exists public.seller_catalogs (
  id                   uuid        primary key default gen_random_uuid(),
  store_id             uuid        not null references public.stores (id) on delete cascade,

  -- Catalog identity
  name                 text        not null,
  catalog_slug         text        not null,       -- URL: {store}.zapable.com.br/s/{catalog_slug}
  avatar_url           text,

  -- Contact
  whatsapp_phone       text,                       -- E.164; null = use store phone
  use_store_whatsapp   boolean     not null default true,
  contact_email        text,

  -- Product visibility
  catalog_products     text        not null default 'all'
                                   check (catalog_products in ('all', 'specific')),
  specific_product_ids uuid[]      not null default '{}',

  -- Dashboard access
  has_dashboard_access boolean     not null default false,
  linked_user_id       uuid        references public.profiles (id) on delete set null,

  -- Timestamps
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- One slug per store
create unique index if not exists seller_catalogs_store_slug_udx
  on public.seller_catalogs (store_id, catalog_slug);

drop trigger if exists seller_catalogs_set_updated_at on public.seller_catalogs;
create trigger seller_catalogs_set_updated_at
  before update on public.seller_catalogs
  for each row execute function public.set_updated_at();

alter table public.seller_catalogs enable row level security;

-- Store members can read/write their own store's seller catalogs
drop policy if exists seller_catalogs_member_all on public.seller_catalogs;
create policy seller_catalogs_member_all on public.seller_catalogs
  for all
  using (
    store_id in (
      select store_id from public.store_members where user_id = auth.uid()
    )
  );

-- Public read for the catalog shell (anon reads by slug)
drop policy if exists seller_catalogs_public_read on public.seller_catalogs;
create policy seller_catalogs_public_read on public.seller_catalogs
  for select
  using (true);
