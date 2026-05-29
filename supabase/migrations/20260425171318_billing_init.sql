-- Billing schema: plan_features (seed), subscriptions, invoices, billing_events.
-- Stripe is the source of truth for subscription state. Our tables are mirrors,
-- written only by Edge Functions (service_role); the browser only reads.

-- =============================================================================
-- Enums
-- =============================================================================
do $$ begin
  create type public.plan_id as enum ('basico', 'pro', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Mirrors Stripe Subscription.status. We add 'none' for stores that have
  -- never started a subscription (defensive default; in practice every store
  -- starts in 'trialing' via the trigger below).
  create type public.subscription_status as enum (
    'none',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'paused'
  );
exception when duplicate_object then null; end $$;

-- =============================================================================
-- plan_features  (seed-style table; consumed by canUseFeature)
-- =============================================================================
create table if not exists public.plan_features (
  plan_id          public.plan_id primary key,
  name             text not null,
  price_in_cents   integer not null check (price_in_cents >= 0),
  max_products     integer,                  -- null = unlimited
  max_sellers      integer,                  -- null = unlimited
  has_ai_helpers   boolean not null default false,
  has_pdf_export   boolean not null default false,
  has_custom_theme boolean not null default false,
  stripe_price_id  text
);

-- Seed values mirror src/config/plans.ts (the Stripe price_id is filled in
-- per-environment and may be empty in dev).
insert into public.plan_features
  (plan_id, name, price_in_cents, max_products, max_sellers,
   has_ai_helpers, has_pdf_export, has_custom_theme)
values
  ('basico',  'Básico',   499,  30,   1,    false, false, false),
  ('pro',     'Pro',      999,  300,  3,    true,  true,  true),
  ('premium', 'Premium',  2999, null, null, true,  true,  true)
on conflict (plan_id) do update set
  name             = excluded.name,
  price_in_cents   = excluded.price_in_cents,
  max_products     = excluded.max_products,
  max_sellers      = excluded.max_sellers,
  has_ai_helpers   = excluded.has_ai_helpers,
  has_pdf_export   = excluded.has_pdf_export,
  has_custom_theme = excluded.has_custom_theme;

-- =============================================================================
-- subscriptions  (one row per store)
-- =============================================================================
create table if not exists public.subscriptions (
  store_id              uuid primary key references public.stores(id) on delete cascade,
  plan_id               public.plan_id not null default 'pro',
  status                public.subscription_status not null default 'none',
  stripe_customer_id    text,
  stripe_subscription_id text unique,
  current_period_end    timestamptz,
  trial_ends_at         timestamptz,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists subscriptions_status_idx on public.subscriptions (status);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =============================================================================
-- invoices
-- =============================================================================
create table if not exists public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores(id) on delete cascade,
  stripe_invoice_id  text not null unique,
  amount_in_cents    integer not null check (amount_in_cents >= 0),
  status             text not null,         -- mirrors Stripe invoice.status
  hosted_invoice_url text,
  pdf_url            text,
  nfse_url           text,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists invoices_store_idx on public.invoices (store_id, created_at desc);

-- =============================================================================
-- billing_events  (idempotent webhook audit log)
-- =============================================================================
create table if not exists public.billing_events (
  stripe_event_id text primary key,
  type            text not null,
  store_id        uuid references public.stores(id) on delete set null,
  payload         jsonb not null,
  received_at     timestamptz not null default now()
);

create index if not exists billing_events_store_idx
  on public.billing_events (store_id, received_at desc);

-- =============================================================================
-- Auto-create a trial subscription whenever a store is inserted
-- =============================================================================
create or replace function public.start_store_trial()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions
    (store_id, plan_id, status, trial_ends_at)
  values
    (new.id, 'pro', 'trialing', now() + interval '14 days')
  on conflict (store_id) do nothing;
  return new;
end $$;

drop trigger if exists stores_start_trial on public.stores;
create trigger stores_start_trial
  after insert on public.stores
  for each row execute function public.start_store_trial();

-- Backfill: any existing store without a subscription gets a fresh trial.
insert into public.subscriptions (store_id, plan_id, status, trial_ends_at)
select s.id, 'pro', 'trialing', now() + interval '14 days'
from public.stores s
left join public.subscriptions sub on sub.store_id = s.id
where sub.store_id is null;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.plan_features    enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.invoices         enable row level security;
alter table public.billing_events   enable row level security;

-- plan_features: world-readable (catalog of plans is public).
drop policy if exists plan_features_public_read on public.plan_features;
create policy plan_features_public_read on public.plan_features
  for select to anon, authenticated using (true);

-- subscriptions: members of the store can read their own.
-- Writes only via service_role (Edge Functions / Stripe webhook).
drop policy if exists subscriptions_member_read on public.subscriptions;
create policy subscriptions_member_read on public.subscriptions
  for select to authenticated using (public.is_store_member(store_id));

-- For the public catalog: anon needs to know whether a store is currently
-- accessible (trial active or active/past_due/etc.). Expose only the minimum.
-- We do this through a SECURITY DEFINER function rather than opening a row
-- policy on subscriptions, to avoid leaking Stripe IDs to anon.
create or replace function public.store_catalog_status(target_store uuid)
returns table (status public.subscription_status, trial_ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select status, trial_ends_at
  from public.subscriptions
  where store_id = target_store
$$;

grant execute on function public.store_catalog_status(uuid) to anon, authenticated;

-- invoices: members can read.
drop policy if exists invoices_member_read on public.invoices;
create policy invoices_member_read on public.invoices
  for select to authenticated using (public.is_store_member(store_id));

-- billing_events: hidden from clients; only service_role uses it.
-- (No SELECT/INSERT/UPDATE/DELETE policies for authenticated/anon → default deny.)
