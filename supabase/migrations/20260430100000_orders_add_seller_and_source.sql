-- Allow dashboard owners to assign a seller and track order origin.
-- source: 'catalog' = placed via public checkout, 'manual' = created by owner in dashboard.
-- seller_id: nullable FK to profiles (the seller user assigned to this order).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source   text NOT NULL DEFAULT 'catalog';

ALTER TABLE orders
  ADD CONSTRAINT orders_source_check CHECK (source IN ('catalog', 'manual'));

-- Index to filter orders by seller
CREATE INDEX IF NOT EXISTS orders_store_seller_idx ON orders (store_id, seller_id)
  WHERE seller_id IS NOT NULL;
