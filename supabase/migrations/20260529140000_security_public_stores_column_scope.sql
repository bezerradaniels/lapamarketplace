-- SECURITY (L-3): stop exposing internal/sensitive store columns to anonymous
-- catalog visitors.
--
-- The public read policy (stores_public_read) lets `anon` read every store row,
-- and the catalog client queried `select('*')` — so anon could read `owner_id`
-- (an internal auth.users UUID, useful only for enumeration) and `cnpj` (a tax
-- ID — LGPD-sensitive). Neither is rendered on the public catalog.
--
-- Postgres can't REVOKE a single column from a table-level grant, so we revoke
-- the table-level SELECT for `anon` and re-grant SELECT on every column EXCEPT
-- owner_id and cnpj. `id` and `deleted_at` stay readable so the EXISTS
-- subqueries in other public RLS policies (products/orders) keep working.
--
-- `authenticated` is untouched: owners/members/admin keep full column access.
-- NOTE: the public catalog query was switched off `select('*')` to an explicit
-- column list (src/features/catalog/api/queries.ts) in the same change.

revoke select on public.stores from anon;

grant select (
  id,
  slug,
  name,
  slogan,
  logo_url,
  banner_url,
  gallery_images,
  primary_color,
  category,
  about_us,
  age_restricted,
  cart_enabled,
  currency,
  locale,
  product_sort,
  show_out_of_stock,
  require_cpf,
  require_payment_choice,
  require_shipping_choice,
  accepted_payment_methods,
  accepted_shipping_methods,
  payment_instructions_title,
  payment_instructions_message,
  delivery_hours,
  whatsapp_phone,
  whatsapp_button_enabled,
  contact_phone,
  contact_email,
  instagram,
  social_links,
  custom_links,
  gtm_id,
  address_cep,
  address_street,
  address_number,
  address_complement,
  address_neighborhood,
  address_city,
  address_state,
  slug_last_updated_at,
  created_at,
  updated_at,
  deleted_at
) on public.stores to anon;
