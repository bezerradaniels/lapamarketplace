-- Dedicated customers table for CRM features.
-- Replaces the MVP approach of deriving customers from orders on the fly.
-- Customers can be created manually ("Novo cliente") or auto-upserted from
-- incoming orders. The stable identity key is the whatsapp_phone (E.164).

create table if not exists public.customers (
  id                 uuid        primary key default gen_random_uuid(),
  store_id           uuid        not null references public.stores (id) on delete cascade,

  -- Identity
  name               text        not null,
  whatsapp_phone     text        not null,   -- E.164 (+5577999...)
  secondary_phone    text,

  -- Documents
  cpf_cnpj_type      text        not null default 'cpf'
                                 check (cpf_cnpj_type in ('cpf', 'cnpj')),
  cpf_cnpj           text,

  -- Contact
  birthday           text,                   -- "DD/MM"
  email              text,
  website            text,
  social_links       jsonb       not null default '[]'::jsonb,
  avatar_url         text,

  -- CRM
  profile_notes      text,
  seller_id          uuid        references public.profiles (id) on delete set null,
  tags               text[]      not null default '{}',
  category_interests text[]      not null default '{}',
  product_interests  uuid[]      not null default '{}',

  -- Timestamps
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Unique per store: one customer row per phone number per store
create unique index if not exists customers_store_phone_udx
  on public.customers (store_id, whatsapp_phone);

-- Fast lookup by seller
create index if not exists customers_store_seller_idx
  on public.customers (store_id, seller_id)
  where seller_id is not null;

-- Fast birthday filter (week-based queries)
create index if not exists customers_birthday_idx
  on public.customers (birthday)
  where birthday is not null;

-- Auto-update updated_at
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- RLS
alter table public.customers enable row level security;

drop policy if exists customers_member_read on public.customers;
create policy customers_member_read on public.customers
  for select
  using (
    store_id in (
      select store_id from public.store_members where user_id = auth.uid()
    )
  );

drop policy if exists customers_member_write on public.customers;
create policy customers_member_write on public.customers
  for all
  using (
    store_id in (
      select store_id from public.store_members where user_id = auth.uid()
    )
  );
