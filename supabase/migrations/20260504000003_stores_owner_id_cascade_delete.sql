-- Change stores.owner_id FK from ON DELETE RESTRICT to ON DELETE CASCADE
-- so that deleting a user from auth.users also deletes their store and all
-- associated data (cascaded through store_id FKs on child tables).

alter table public.stores
  drop constraint if exists stores_owner_id_fkey;

alter table public.stores
  add constraint stores_owner_id_fkey
    foreign key (owner_id)
    references auth.users(id)
    on delete cascade;
