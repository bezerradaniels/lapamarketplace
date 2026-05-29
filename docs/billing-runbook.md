# Billing runbook

Stripe account: **DANI BEZERRA MARKETING DIGITAL** (`acct_1TPiLg1oLw5d2Hz3`).

## Live products & prices (BRL, monthly)

| Plan    | Product ID                | Price ID                           | Amount    |
| ------- | ------------------------- | ---------------------------------- | --------- |
| Básico  | `prod_UOy89EBfVigDlf`     | `price_1TQAC11oLw5d2Hz37zjRB0U1`   | R$ 4,99   |
| Pro     | `prod_UOyANqNcntMck3`     | `price_1TQAEc1oLw5d2Hz3MY7cucqX`   | R$ 9,99   |
| Premium | `prod_UOyBSIRyJ92Vur`     | `price_1TQAF01oLw5d2Hz3WNOYl28z`   | R$ 29,99  |

These IDs are **already mirrored** into `plan_features` via migration
`20260425220605_billing_seed_stripe_price_ids.sql`.

## One-time setup steps

### 1. Apply migrations and regenerate types

```bash
npm run db:push           # applies billing_init + price-id seed
npm run db:types          # regenerates src/types/database.ts
```

After `db:types` runs, drop the `as any` casts in
`src/features/billing/api/queries.ts` (search for `// NOTE:`).

### 2. Set Edge Function secrets

Get the keys from <https://dashboard.stripe.com/acct_1TPiLg1oLw5d2Hz3/apikeys>.
Use **test keys** for staging and live keys only for production.

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  STRIPE_PRICE_BASICO=price_1TQAC11oLw5d2Hz37zjRB0U1 \
  STRIPE_PRICE_PRO=price_1TQAEc1oLw5d2Hz3MY7cucqX \
  STRIPE_PRICE_PREMIUM=price_1TQAF01oLw5d2Hz3WNOYl28z \
  APP_URL=https://zapable.com.br
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically by Supabase into every Edge Function — no need to set
them.

### 3. Deploy the functions

```bash
supabase functions deploy stripe-checkout-session
supabase functions deploy stripe-portal-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

`stripe-webhook` runs with `--no-verify-jwt` because Stripe doesn't carry a
Supabase JWT — the function verifies the `stripe-signature` header instead.

### 4. Register the webhook in Stripe

In the Stripe Dashboard → **Developers → Webhooks → Add endpoint**:

- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `invoice.finalized`
  - `customer.updated`

Copy the **Signing secret** (`whsec_…`) and set it as `STRIPE_WEBHOOK_SECRET`
(step 2). Re-deploy `stripe-webhook` after the secret changes.

### 5. Enable the Customer Portal

In the Stripe Dashboard → **Settings → Billing → Customer portal**:

1. Turn the portal **on**.
2. Allow customers to **update payment methods**, **cancel subscriptions**
   (mode: at end of billing period — matches CLAUDE.md §13.4), and **switch
   plans** between Básico/Pro/Premium.
3. Set the privacy and ToS URLs.
4. Save.

Without this, `stripe-portal-session` returns a 500.

### 6. Configure payment methods on Checkout

By default Stripe Checkout offers `card` and `boleto`. To accept PIX:

- Stripe Dashboard → **Settings → Payments → Payment methods** → enable PIX.
- The Edge Function passes `payment_method_types: ['card', 'boleto']`. To add
  PIX once it's enabled in your account, change that array to
  `['card', 'boleto', 'pix']` in
  `supabase/functions/stripe-checkout-session/index.ts` and re-deploy.

> Note: recurring PIX is limited; CLAUDE.md §13.3 treats PIX as a one-off per
> cycle. The owner gets a renewal reminder by email each cycle.

## Verifying end-to-end

1. Sign up a new store in the app → trigger creates a `subscriptions` row
   with `status='trialing'`, `plan_id='pro'`, `trial_ends_at = now+14d`.
2. Click **Adicionar método de pagamento** in `/dashboard/assinatura`.
3. Complete Checkout with Stripe test card `4242 4242 4242 4242`, any future
   expiry, any CVC.
4. Stripe fires `checkout.session.completed` → webhook links
   `stripe_customer_id` to the store. Then `customer.subscription.created`
   updates `status` to `active` (or `trialing` if the price has a trial).
5. The page should now show **Gerenciar cobranças** instead of **Adicionar
   método de pagamento**.
6. Visit the public storefront — it should still render (status=active).

## Failure-mode smoke tests

- **Trial expired**: in the Supabase SQL editor, set
  `update subscriptions set trial_ends_at = now() - interval '1 day' where store_id = '<id>';`
  → public catalog renders the "Loja indisponível" screen, dashboard still
  works.
- **Failed payment**: in Stripe test mode, use card `4000 0000 0000 0341`.
  Webhook should set `status='past_due'` on `invoice.payment_failed` (catalog
  stays accessible — past_due is in `ACTIVE_STATUSES`). To suspend on first
  failure, change `canAccessCatalog.ts` and remove `'past_due'`.

## Rotating the webhook secret

If you regenerate the signing secret in Stripe (e.g. after a leak):

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_new
supabase functions deploy stripe-webhook --no-verify-jwt
```

The old signature will fail and Stripe will retry with the new one — no data
loss because of the idempotency key on `stripe_event_id`.
