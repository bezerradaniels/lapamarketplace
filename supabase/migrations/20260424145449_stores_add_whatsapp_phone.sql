-- WhatsApp phone do lojista, armazenado em E.164 (+55DDDNNNNNNNN).
-- Nullable para não quebrar stores já criadas; o app exige no onboarding.

alter table public.stores
  add column if not exists whatsapp_phone text
  check (whatsapp_phone is null or whatsapp_phone ~ '^\+55\d{10,11}$');
