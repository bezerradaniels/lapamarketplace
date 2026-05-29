-- Adds the storefront banner image and a public contact e-mail.
-- - `banner_url`: optional hero image rendered above the catalog grid.
-- - `contact_email`: optional support address shown in the storefront footer.
-- Address (rua, cidade, UF, CEP) is captured via existing free-text fields on
-- the dashboard for now; structured address comes in a later slice.

alter table public.stores
  add column if not exists banner_url text,
  add column if not exists contact_email text;

-- Light shape guard on email (full validation happens client-side via Zod).
alter table public.stores
  drop constraint if exists stores_contact_email_check;
alter table public.stores
  add constraint stores_contact_email_check
  check (
    contact_email is null
    or contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
