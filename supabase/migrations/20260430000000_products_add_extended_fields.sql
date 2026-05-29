-- Add extended product fields to support the enhanced product creation form.
-- Includes: SKU management, product condition, variations (attribute-only),
-- cost price (for margin calculation), subcategory, barcode type, and purchase recurrence.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku              text,
  ADD COLUMN IF NOT EXISTS auto_sku         boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS barcode_type     text,
  ADD COLUMN IF NOT EXISTS condition        text        NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS purchase_recurrence text,
  ADD COLUMN IF NOT EXISTS subcategory      text,
  ADD COLUMN IF NOT EXISTS has_no_brand     boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_in_cents    integer,
  ADD COLUMN IF NOT EXISTS has_variations   boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS variation_type   text,
  ADD COLUMN IF NOT EXISTS variation_label  text,
  ADD COLUMN IF NOT EXISTS variation_options jsonb;

-- Constraints
ALTER TABLE products
  ADD CONSTRAINT products_condition_check
    CHECK (condition IN ('new', 'used', 'refurbished')),
  ADD CONSTRAINT products_variation_type_check
    CHECK (variation_type IS NULL OR variation_type IN ('color', 'size', 'other')),
  ADD CONSTRAINT products_cost_check
    CHECK (cost_in_cents IS NULL OR cost_in_cents >= 0),
  ADD CONSTRAINT products_sku_length
    CHECK (sku IS NULL OR (char_length(sku) BETWEEN 1 AND 40));
