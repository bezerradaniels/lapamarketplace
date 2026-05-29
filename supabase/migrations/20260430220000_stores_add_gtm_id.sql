-- Add Google Tag Manager container ID to stores.
-- Lojista preenche o campo (ex: GTM-XXXXXX) no painel;
-- o catálogo público injeta o snippet GTM com esse ID.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS gtm_id TEXT;
