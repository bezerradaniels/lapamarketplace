// Creates a Stripe Checkout Session for the lojista to start (or change) their
// plan subscription. Returns the Checkout URL; the SPA redirects to it.
//
// Price ID resolution order:
//   1. Env var (STRIPE_PRICE_BASICO/PRO/PREMIUM or STRIPE_PRICE_BASICO_ANNUAL/etc) — preferred for prod overrides
//   2. plan_features.stripe_price_monthly / stripe_price_annual from DB
//
// Supports billingPeriod: 'monthly' (default) | 'annual'

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno&deno-std=0.220.0'
import { corsHeaders, jsonResponse, preflight } from '../_shared/cors.ts'
import { adminClient, requireStoreMember } from '../_shared/auth.ts'

type PlanId = 'basico' | 'pro' | 'premium'
type BillingPeriod = 'monthly' | 'annual'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const APP_URL = Deno.env.get('APP_URL') ?? 'https://lapamarketplace.com.br'

const PRICE_BY_PLAN_ENV: Record<PlanId, { monthly?: string; annual?: string }> = {
  basico: {
    monthly: Deno.env.get('STRIPE_PRICE_BASICO'),
    annual: Deno.env.get('STRIPE_PRICE_BASICO_ANNUAL'),
  },
  pro: {
    monthly: Deno.env.get('STRIPE_PRICE_PRO'),
    annual: Deno.env.get('STRIPE_PRICE_PRO_ANNUAL'),
  },
  premium: {
    monthly: Deno.env.get('STRIPE_PRICE_PREMIUM'),
    annual: Deno.env.get('STRIPE_PRICE_PREMIUM_ANNUAL'),
  },
}

async function resolvePriceId(planId: PlanId, period: BillingPeriod): Promise<string | null> {
  const fromEnv = period === 'annual'
    ? PRICE_BY_PLAN_ENV[planId].annual
    : PRICE_BY_PLAN_ENV[planId].monthly
  if (fromEnv) return fromEnv

  const admin = adminClient()
  const { data, error } = await admin
    .from('plan_features')
    .select('stripe_price_monthly, stripe_price_annual, stripe_price_id')
    .eq('plan_id', planId)
    .maybeSingle()
  if (error || !data) return null

  if (period === 'annual' && data.stripe_price_annual) return data.stripe_price_annual
  return data.stripe_price_monthly ?? data.stripe_price_id ?? null
}

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
  }

  if (!STRIPE_SECRET_KEY) {
    return jsonResponse(
      { error: 'missing_secret', detail: 'STRIPE_SECRET_KEY' },
      { status: 500 },
    )
  }

  let body: { storeId?: string; planId?: PlanId; billingPeriod?: BillingPeriod }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 })
  }

  const { storeId, planId, billingPeriod = 'monthly' } = body
  if (!storeId || !planId) {
    return jsonResponse({ error: 'missing_fields' }, { status: 400 })
  }

  const priceId = await resolvePriceId(planId, billingPeriod)
  if (!priceId) {
    return jsonResponse(
      {
        error: 'plan_not_configured',
        detail: `No price configured for plan '${planId}' (${billingPeriod}). Set STRIPE_PRICE_${planId.toUpperCase()}${billingPeriod === 'annual' ? '_ANNUAL' : ''} or seed plan_features.`,
      },
      { status: 400 },
    )
  }

  try {
    await requireStoreMember(req, storeId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'forbidden'
    return jsonResponse({ error: message }, { status: 401 })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  // Re-use existing Stripe customer if we have one; otherwise Checkout creates
  // one and the webhook backfills `stripe_customer_id`.
  const admin = adminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('store_id', storeId)
    .maybeSingle()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: ['card', 'boleto'],
      customer: sub?.stripe_customer_id ?? undefined,
      client_reference_id: storeId,
      metadata: { store_id: storeId, plan_id: planId },
      subscription_data: {
        metadata: { store_id: storeId, plan_id: planId },
      },
      success_url: `${APP_URL}/dashboard/assinatura?checkout=success`,
      cancel_url: `${APP_URL}/dashboard/assinatura?checkout=cancel`,
      allow_promotion_codes: true,
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error('stripe-checkout-session error', err)
    return jsonResponse(
      { error: 'stripe_error', message: (err as Error).message },
      { status: 500, headers: corsHeaders },
    )
  }
})
