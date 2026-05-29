-- Catalog-level settings declared by the lojista.

do $$ begin
  create type public.payment_method as enum (
    'cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'boleto', 'payment_link'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shipping_method as enum (
    'delivery', 'pickup_in_store', 'room_service', 'digital'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_sort_order as enum (
    'recent', 'name_asc', 'name_desc', 'price_asc', 'price_desc'
  );
exception when duplicate_object then null; end $$;

alter table public.stores
  add column if not exists cnpj text,
  add column if not exists about_us text,
  add column if not exists age_restricted boolean not null default false,
  add column if not exists locale text not null default 'pt-BR',
  add column if not exists currency text not null default 'BRL',
  add column if not exists show_out_of_stock boolean not null default false,
  add column if not exists product_sort public.product_sort_order not null default 'recent',
  add column if not exists cart_enabled boolean not null default true,
  add column if not exists whatsapp_button_enabled boolean not null default true,
  add column if not exists accepted_payment_methods text[] not null default
    array['cash', 'pix', 'credit_card']::text[],
  add column if not exists accepted_shipping_methods text[] not null default
    array['delivery', 'pickup_in_store']::text[],
  add column if not exists address_cep text,
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists address_neighborhood text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists payment_instructions_title text,
  add column if not exists payment_instructions_message text,
  add column if not exists require_cpf boolean not null default false,
  add column if not exists require_shipping_choice boolean not null default false,
  add column if not exists require_payment_choice boolean not null default false,
  add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.stores
  drop constraint if exists stores_locale_check;
alter table public.stores
  add constraint stores_locale_check check (locale in ('pt-BR'));

alter table public.stores
  drop constraint if exists stores_currency_check;
alter table public.stores
  add constraint stores_currency_check check (currency in ('BRL'));

alter table public.stores
  drop constraint if exists stores_address_state_check;
alter table public.stores
  add constraint stores_address_state_check
  check (address_state is null or char_length(address_state) = 2);
