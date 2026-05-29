-- Backfills `plan_features.stripe_price_id` with the live Price IDs created
-- in the Stripe account `acct_1TPiLg1oLw5d2Hz3` (DANI BEZERRA MARKETING DIGITAL).
--
-- These IDs are also set as Edge Function secrets (STRIPE_PRICE_BASICO, etc.)
-- which is the actual source of truth used at Checkout-creation time. Mirroring
-- them here keeps the data consistent and makes ad-hoc verification queries
-- easier (e.g. `select * from plan_features where stripe_price_id = '...'`).

update public.plan_features
set stripe_price_id = 'price_1TQAC11oLw5d2Hz37zjRB0U1'
where plan_id = 'basico';

update public.plan_features
set stripe_price_id = 'price_1TQAEc1oLw5d2Hz3MY7cucqX'
where plan_id = 'pro';

update public.plan_features
set stripe_price_id = 'price_1TQAF01oLw5d2Hz3WNOYl28z'
where plan_id = 'premium';
