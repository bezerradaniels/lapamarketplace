-- Adds `orders` to the supabase_realtime publication so the dashboard can
-- receive live INSERT events when a customer finalizes checkout. RLS still
-- applies to the realtime stream — only members of the `store_id` will
-- actually receive the row.

alter publication supabase_realtime add table public.orders;
