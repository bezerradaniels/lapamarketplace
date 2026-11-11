-- =====================================================================
-- Lapa Marketplace — Endurecimento de segurança (RLS + triggers)
-- Projeto Supabase: epflkufatjvaqdqsfbfi
-- Rodar no SQL Editor do projeto. É idempotente (pode rodar mais de uma vez).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. AUDITORIA (somente leitura) — rode antes e guarde o resultado.
--    Procure políticas com qual = 'true' em tabelas sensíveis e políticas
--    de UPDATE/INSERT em products/store_stories que NÃO comparem owner_id.
-- ---------------------------------------------------------------------
-- select tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies where schemaname = 'public' order by tablename, cmd;
--
-- select c.relname, c.relrowsecurity as rls_ativo
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'r' order by 1;

-- ---------------------------------------------------------------------
-- 1. Helpers
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- true quando a requisição vem de um usuário final pela API (chave anon/
-- sessão do usuário). SQL Editor e service_role retornam false.
create or replace function public.is_end_user_request()
returns boolean
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) in ('anon', 'authenticated');
$$;

-- ---------------------------------------------------------------------
-- 2. profiles.role — impede auto-promoção a admin
--    Usuário comum só pode ir de customer -> merchant (onboarding).
--    Promover a admin: UPDATE pelo SQL Editor (ver final do arquivo).
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role = 'admin'
       and coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') <> 'service_role' then
      new.role := 'customer';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
     and public.is_end_user_request()
     and not public.is_admin() then
    if not (coalesce(old.role::text, 'customer') = 'customer'
            and new.role::text = 'merchant') then
      raise exception 'Alteração de papel não permitida.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- 3. profiles — leitura só do próprio perfil (ou admin)
--    Hoje a chave anon lê whatsapp/endereço/role de todos os perfis.
--    O app só lê o perfil do próprio usuário, então isto não quebra nada.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;

create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 4. stores — plano, selo e dono só mudam por admin
-- ---------------------------------------------------------------------
create or replace function public.protect_store_admin_fields()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_end_user_request() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan_tier := 'free';
    new.is_verified := false;
    if new.owner_id is distinct from auth.uid() then
      raise exception 'owner_id inválido.' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.plan_tier is distinct from old.plan_tier
     or new.is_verified is distinct from old.is_verified
     or new.owner_id is distinct from old.owner_id then
    raise exception 'Somente administradores alteram plano, selo ou dono da loja.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_store_admin_fields on public.stores;
create trigger trg_protect_store_admin_fields
  before insert or update on public.stores
  for each row execute function public.protect_store_admin_fields();

-- ---------------------------------------------------------------------
-- 5. Políticas de escrita para admin (painel /master)
--    ATENÇÃO: políticas são permissivas (OR). Se a auditoria mostrar uma
--    política que já libera escrita a qualquer usuário nessas tabelas,
--    remova-a — estas abaixo não restringem nada sozinhas.
-- ---------------------------------------------------------------------
-- Remove políticas legadas redundantes (usavam is_super_admin)
drop policy if exists "Super Admin categorias" on public.global_categories;
drop policy if exists "Super Admin bairros" on public.neighborhoods;

drop policy if exists stores_admin_update on public.stores;
create policy stores_admin_update on public.stores
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists global_categories_admin_write on public.global_categories;
create policy global_categories_admin_write on public.global_categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists neighborhoods_admin_write on public.neighborhoods;
create policy neighborhoods_admin_write on public.neighborhoods
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. Promover o administrador (rodar aqui no SQL Editor)
-- ---------------------------------------------------------------------
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'daniel.ddsb@gmail.com');
