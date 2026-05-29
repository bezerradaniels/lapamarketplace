-- Profiles mirror a subset of auth.users so members can see each other's
-- email/name without granting access to the auth schema.
-- Also adds a SECURITY DEFINER RPC to add a seller to a store by email.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Sync trigger: keep public.profiles in sync with auth.users.
create or replace function public.sync_profile_from_auth()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', null)
  )
  on conflict (id) do update set
    email = excluded.email,
    name  = coalesce(excluded.name, public.profiles.name);
  return new;
end $$;

drop trigger if exists auth_users_sync_profile on auth.users;
create trigger auth_users_sync_profile
  after insert or update on auth.users
  for each row execute function public.sync_profile_from_auth();

-- Backfill existing users into profiles.
insert into public.profiles (id, email, name)
select id, email, coalesce(raw_user_meta_data->>'name', null)
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

-- A user can read profiles of people they share a store with (and their own).
drop policy if exists profiles_self_or_costore on public.profiles;
create policy profiles_self_or_costore on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.store_members me
      join public.store_members other
        on other.store_id = me.store_id
      where me.user_id = auth.uid()
        and other.user_id = profiles.id
    )
  );

-- Add seller by email — only the store owner can call this.
create or replace function public.add_seller_by_email(
  target_store uuid,
  target_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_is_owner boolean;
begin
  select exists (
    select 1 from public.stores
    where id = target_store and owner_id = auth.uid()
  ) into v_is_owner;

  if not v_is_owner then
    raise exception 'Only the store owner can add sellers' using errcode = '42501';
  end if;

  select id into v_user_id
  from public.profiles
  where lower(email) = lower(target_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No user found with this email' using errcode = 'P0002';
  end if;

  insert into public.store_members (store_id, user_id, role)
  values (target_store, v_user_id, 'seller')
  on conflict (store_id, user_id) do nothing;

  return v_user_id;
end $$;

revoke all on function public.add_seller_by_email(uuid, text) from public;
grant execute on function public.add_seller_by_email(uuid, text) to authenticated;
