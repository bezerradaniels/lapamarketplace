-- Lojista pode editar a PRÓPRIA loja (Painel → Configurações).
-- Sem esta política, o UPDATE do dono não dá erro: só altera 0 linhas e nada
-- é salvo. Plano, selo e dono continuam protegidos pelo gatilho
-- trg_protect_store_admin_fields (supabase/security/2026-11-11_hardening.sql).
-- Políticas são permissivas (OR): se já existir uma equivalente, esta não muda nada.
-- Rodar no SQL Editor do Supabase do projeto do portal.

drop policy if exists stores_owner_update on public.stores;

create policy stores_owner_update on public.stores
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Conferência (opcional): políticas de UPDATE ativas em stores
-- select policyname, roles, qual, with_check
--   from pg_policies
--  where schemaname = 'public' and tablename = 'stores' and cmd = 'UPDATE';
