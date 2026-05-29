-- Tabelas de referência para localização brasileira.
-- `states`: os 27 estados + DF, semeados aqui.
-- `cities`: estrutura criada vazia; dados carregados via API do IBGE no cliente.
-- Sem store_id — são dados globais de referência.
-- RLS: leitura pública, sem escrita por usuários.

create table if not exists public.states (
  id   smallint primary key,
  uf   char(2)  not null unique,
  name text     not null
);

alter table public.states enable row level security;

drop policy if exists states_public_read on public.states;
create policy states_public_read on public.states
  for select to anon, authenticated using (true);

create table if not exists public.cities (
  id       integer  primary key,
  name     text     not null,
  state_id smallint not null references public.states(id)
);

create index if not exists cities_state_id_idx on public.cities (state_id);

alter table public.cities enable row level security;

drop policy if exists cities_public_read on public.cities;
create policy cities_public_read on public.cities
  for select to anon, authenticated using (true);

-- Seed: 27 estados brasileiros (códigos IBGE)
insert into public.states (id, uf, name) values
  (12, 'AC', 'Acre'),
  (27, 'AL', 'Alagoas'),
  (16, 'AP', 'Amapá'),
  (13, 'AM', 'Amazonas'),
  (29, 'BA', 'Bahia'),
  (23, 'CE', 'Ceará'),
  (53, 'DF', 'Distrito Federal'),
  (32, 'ES', 'Espírito Santo'),
  (52, 'GO', 'Goiás'),
  (21, 'MA', 'Maranhão'),
  (51, 'MT', 'Mato Grosso'),
  (50, 'MS', 'Mato Grosso do Sul'),
  (31, 'MG', 'Minas Gerais'),
  (15, 'PA', 'Pará'),
  (25, 'PB', 'Paraíba'),
  (41, 'PR', 'Paraná'),
  (26, 'PE', 'Pernambuco'),
  (22, 'PI', 'Piauí'),
  (33, 'RJ', 'Rio de Janeiro'),
  (24, 'RN', 'Rio Grande do Norte'),
  (43, 'RS', 'Rio Grande do Sul'),
  (11, 'RO', 'Rondônia'),
  (14, 'RR', 'Roraima'),
  (42, 'SC', 'Santa Catarina'),
  (35, 'SP', 'São Paulo'),
  (28, 'SE', 'Sergipe'),
  (17, 'TO', 'Tocantins')
on conflict do nothing;
