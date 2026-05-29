-- Add installment payment fields to products
-- Allows store owners to display installment info (e.g. "10x de R$ 39,90")

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS installment_count       smallint  NULL CHECK (installment_count  IS NULL OR installment_count  BETWEEN 2 AND 24),
  ADD COLUMN IF NOT EXISTS installment_total_in_cents integer NULL CHECK (installment_total_in_cents IS NULL OR installment_total_in_cents > 0);

COMMENT ON COLUMN products.installment_count         IS 'Max installments offered (2–24). NULL = no installment info.';
COMMENT ON COLUMN products.installment_total_in_cents IS 'Total price when paying in installments (in cents). Per-installment value = total / count.';
