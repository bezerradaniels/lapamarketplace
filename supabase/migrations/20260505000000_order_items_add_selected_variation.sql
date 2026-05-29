-- Add selected_variation to order_items so the lojista can see exactly which
-- variant the customer chose (e.g. "Azul", "G") in the dashboard and WhatsApp message.
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS selected_variation text;
