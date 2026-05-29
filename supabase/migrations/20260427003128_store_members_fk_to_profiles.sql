-- Adds a parallel FK from store_members.user_id → profiles.id so PostgREST
-- can embed `profiles(email, name)` in the SellersPage query.
-- Safe because profiles.id is keyed off auth.users.id 1:1 via the auth
-- trigger that runs on signup.

insert into public.profiles (id, email, name)
select u.id, u.email, coalesce((u.raw_user_meta_data ->> 'name'), u.email)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

alter table public.store_members
  drop constraint if exists store_members_user_id_profile_fkey;
alter table public.store_members
  add constraint store_members_user_id_profile_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
