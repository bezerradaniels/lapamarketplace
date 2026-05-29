-- SECURITY (H-1 + M-2): add an immutable platform_admins table as the primary
-- admin gate, fix the admin e-mail to the controlled lapamarketplace.com.br
-- domain, and pin search_path on the admin SECURITY DEFINER fns.
--
-- Previously is_admin() compared auth.email() against an address on a domain NOT
-- controlled by the project (the live domain is lapamarketplace.com.br), so anyone
-- able to receive mail there could become admin. We now (a) require the admin
-- e-mail to be on the controlled domain (manager@lapamarketplace.com.br), and
-- (b) support a platform_admins allow-list so additional admins can be added
-- without code/SQL email changes.

-- ─── platform_admins (allow-list) ─────────────────────────────────────────────
create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

-- RLS on, with NO policies: the table is readable/writable only by the service
-- role and by SECURITY DEFINER functions (which run as the table owner and
-- bypass RLS). Regular users can never read the admin list.
alter table public.platform_admins enable row level security;

-- ─── is_admin(): controlled-domain admin e-mail OR platform_admins allow-list ──
-- `auth` is added to search_path because we call auth.email().
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    lower(coalesce(auth.email(), '')) = 'manager@lapamarketplace.com.br'
    or exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
$$;

-- ─── Pin search_path on the remaining admin definer functions (advisor: mutable) ─
alter function public.admin_get_platform_stats()      set search_path = public;
alter function public.admin_get_stores_list()          set search_path = public;
alter function public.admin_get_store_detail(uuid)     set search_path = public;

-- ─── Adding MORE admins (optional) ────────────────────────────────────────────
-- manager@lapamarketplace.com.br is already an admin via the e-mail check above —
-- no seeding required. To grant admin to additional users, add them to the
-- allow-list (service role / SQL editor):
--
--   insert into public.platform_admins (user_id, note)
--   select id, 'note' from auth.users where email = 'OUTRO_ADMIN@lapamarketplace.com.br'
--   on conflict (user_id) do nothing;
--
-- Confirm the manager@lapamarketplace.com.br mailbox is under your control.
