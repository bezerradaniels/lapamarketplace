-- Campos novos do cadastro da loja (onboarding):
--   1. Tipo de atendimento: loja física e/ou online (passo 2)
--   2. Categoria principal da loja (passo 1)
-- Rodar no SQL Editor do Supabase do projeto do portal.
-- Até rodar, o onboarding cria a loja normalmente e só não grava estes campos.

-- 1. Tipo de atendimento -------------------------------------------------
alter table public.stores
  add column if not exists service_modes text[] not null
  default array['physical']::text[];

alter table public.stores
  drop constraint if exists stores_service_modes_check;

alter table public.stores
  add constraint stores_service_modes_check
  check (
    cardinality(service_modes) > 0
    and service_modes <@ array['physical', 'online']::text[]
  );

comment on column public.stores.service_modes is
  'Tipo de atendimento: physical (loja física) e/ou online.';

-- 2. Categoria principal --------------------------------------------------
alter table public.stores
  add column if not exists global_category_id uuid
  references public.global_categories (id) on delete set null;

create index if not exists stores_global_category_id_idx
  on public.stores (global_category_id);

comment on column public.stores.global_category_id is
  'Categoria principal da loja (global_categories sem pai).';

-- Opção "Outra": nome digitado pelo lojista (global_category_id fica nulo)
alter table public.stores
  add column if not exists category_other text;

alter table public.stores
  drop constraint if exists stores_category_other_length_check;

alter table public.stores
  add constraint stores_category_other_length_check
  check (category_other is null or char_length(category_other) between 2 and 60);

comment on column public.stores.category_other is
  'Categoria digitada quando o lojista escolhe "Outra".';
