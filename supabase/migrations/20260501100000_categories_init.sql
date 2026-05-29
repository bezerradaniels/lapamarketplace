-- Categories with hierarchy (subcategories via parent_id).
-- Each store has its own list of categories; subcategories reference their parent.
-- Used for product taxonomy and catalog browsing/filtering.

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  parent_id   uuid references public.categories(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  slug        text not null check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$'),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  -- Slug unique per (store_id, parent_id) — top-level uses parent_id is null.
  unique (store_id, parent_id, slug)
);

create index if not exists categories_store_idx
  on public.categories (store_id) where deleted_at is null;
create index if not exists categories_parent_idx
  on public.categories (parent_id) where deleted_at is null;

-- Prevent a category from being its own ancestor (only 2 levels: category > subcategory).
alter table public.categories
  drop constraint if exists categories_parent_not_self;
alter table public.categories
  add constraint categories_parent_not_self
  check (parent_id is null or parent_id <> id);

-- updated_at trigger
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.categories enable row level security;

-- Public can read (for the public catalog)
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select
  to anon, authenticated
  using (deleted_at is null);

-- Members manage categories of their store
drop policy if exists categories_member_write on public.categories;
create policy categories_member_write on public.categories
  for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- Enforce: subcategory's parent must belong to the same store, and parent must be top-level (no nesting beyond 2 levels).
create or replace function public.validate_category_parent()
returns trigger language plpgsql as $$
declare
  parent_store uuid;
  parent_parent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;
  select store_id, parent_id into parent_store, parent_parent
    from public.categories where id = new.parent_id;
  if parent_store is null then
    raise exception 'Parent category not found';
  end if;
  if parent_store <> new.store_id then
    raise exception 'Parent category belongs to a different store';
  end if;
  if parent_parent is not null then
    raise exception 'Subcategories cannot have subcategories (max depth: 2)';
  end if;
  return new;
end $$;

drop trigger if exists categories_validate_parent on public.categories;
create trigger categories_validate_parent
  before insert or update on public.categories
  for each row execute function public.validate_category_parent();
