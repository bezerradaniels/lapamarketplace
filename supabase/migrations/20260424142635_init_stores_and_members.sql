-- Initial schema for Zapable: multi-tenant foundation.
-- Creates `stores` (one per lojista) and `store_members` (owner/seller bindings),
-- enables RLS, and adds policies so the anon role can read live catalogs by slug
-- while authenticated users can only touch stores they're members of.

create extension if not exists "pgcrypto";

-- =============================================================================
-- stores
-- =============================================================================
create table if not exists public.stores (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique
                  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$'),
  name          text not null check (char_length(name) between 1 and 80),
  owner_id      uuid not null references auth.users(id) on delete restrict,
  slogan        text,
  logo_url      text,
  primary_color text not null default '#25D366'
                  check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists stores_owner_id_idx on public.stores (owner_id);
create index if not exists stores_slug_active_idx
  on public.stores (slug) where deleted_at is null;

-- =============================================================================
-- store_members (user ↔ store with role)
-- =============================================================================
do $$ begin
  create type public.store_role as enum ('owner', 'seller');
exception when duplicate_object then null; end $$;

create table if not exists public.store_members (
  store_id   uuid not null references public.stores(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.store_role not null,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index if not exists store_members_user_id_idx on public.store_members (user_id);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Auto-register the owner as a member on store insert
-- =============================================================================
create or replace function public.register_store_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.store_members (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists stores_register_owner on public.stores;
create trigger stores_register_owner
  after insert on public.stores
  for each row execute function public.register_store_owner();

-- =============================================================================
-- Membership helper (kept security definer to avoid RLS recursion)
-- =============================================================================
create or replace function public.is_store_member(target_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store and user_id = auth.uid()
  );
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.stores         enable row level security;
alter table public.store_members  enable row level security;

-- Public catalog: anon can read live (non-deleted) stores by slug.
drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores
  for select
  to anon, authenticated
  using (deleted_at is null);

-- Owner can insert their own store.
drop policy if exists stores_owner_insert on public.stores;
create policy stores_owner_insert on public.stores
  for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Members can update; only the owner can update `owner_id` / soft-delete.
drop policy if exists stores_member_update on public.stores;
create policy stores_member_update on public.stores
  for update
  to authenticated
  using (public.is_store_member(id))
  with check (public.is_store_member(id));

-- Only the owner can hard-delete; in practice we soft-delete via update.
drop policy if exists stores_owner_delete on public.stores;
create policy stores_owner_delete on public.stores
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- store_members: users see only their own memberships.
drop policy if exists store_members_self_read on public.store_members;
create policy store_members_self_read on public.store_members
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_store_member(store_id));

-- Only the store owner manages memberships.
drop policy if exists store_members_owner_write on public.store_members;
create policy store_members_owner_write on public.store_members
  for all
  to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_members.store_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_members.store_id and s.owner_id = auth.uid()
    )
  );
