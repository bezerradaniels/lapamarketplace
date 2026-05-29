-- Campos coletados no onboarding em chat (instagram handle e categoria da loja)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS category  text;
