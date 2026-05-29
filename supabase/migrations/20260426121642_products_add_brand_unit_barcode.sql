-- Adds brand / unit / barcode metadata to products. All optional — used by
-- the rich product-detail layout on the public catalog. Stored as free-text
-- so the lojista isn't forced into a fixed taxonomy.
--   - brand:   manufacturer / marca (e.g. "Optimum Nutrition")
--   - unit:    sale unit (e.g. "Pacote", "300g", "Unidade", "Caixa com 12")
--   - barcode: EAN/UPC code, mostly EAN-13 in Brazil

alter table public.products
  add column if not exists brand text,
  add column if not exists unit text,
  add column if not exists barcode text;

alter table public.products
  drop constraint if exists products_brand_check;
alter table public.products
  add constraint products_brand_check
  check (brand is null or char_length(brand) between 1 and 60);

alter table public.products
  drop constraint if exists products_unit_check;
alter table public.products
  add constraint products_unit_check
  check (unit is null or char_length(unit) between 1 and 30);

alter table public.products
  drop constraint if exists products_barcode_check;
alter table public.products
  add constraint products_barcode_check
  check (barcode is null or char_length(barcode) between 4 and 20);

-- Lookup index for "find related by brand".
create index if not exists products_store_brand_idx
  on public.products (store_id, brand)
  where deleted_at is null and is_active = true;
