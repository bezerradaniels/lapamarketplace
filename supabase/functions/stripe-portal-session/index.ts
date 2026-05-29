// Creates a Stripe Customer Portal session so the lojista can manage payment
// methods, invoices and cancellation. Requires an existing subscription
// linked to a Stripe customer.

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno&deno-std=0.220.0'
import { jsonResponse, preflight } from '../_shared/cors.ts'
import { adminClient, requireStoreMember } from '../_shared/auth.ts'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured')

const APP_URL = Deno.env.get('APP_URL') ?? 'https://lapamarketplace.com.br'

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
  }

  let body: { storeId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 })
  }

  const { storeId } = body
  if (!storeId) {
    return jsonResponse({ error: 'missing_fields' }, { status: 400 })
  }

  try {
    await requireStoreMember(req, storeId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'forbidden'
    return jsonResponse({ error: message }, { status: 401 })
  }

  const admin = adminClient()
  const { data: sub, error } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) {
    return jsonResponse({ error: 'db_error' }, { status: 500 })
  }
  if (!sub?.stripe_customer_id) {
    return jsonResponse({ error: 'no_customer' }, { status: 400 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${APP_URL}/dashboard/assinatura`,
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error('stripe-portal-session error', err)
    return jsonResponse(
      { error: 'stripe_error', message: (err as Error).message },
      { status: 500 },
    )
  }
})
