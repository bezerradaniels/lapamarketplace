// Stripe → Supabase sync. Subscription state is driven *only* by webhooks
// (per CLAUDE.md §13 — never written by client code). Every event is logged
// idempotently in `billing_events` keyed by `stripe_event_id`.
//
// Events handled:
//   - customer.subscription.created/updated/deleted
//   - invoice.paid / .payment_failed / .finalized
//   - customer.updated
//   - checkout.session.completed (links stripe_customer_id to the store)
//
// IMPORTANT: signature verification is mandatory. The function returns 200
// only after the event was successfully persisted, so Stripe retries safely.

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno&deno-std=0.220.0'
import { adminClient } from '../_shared/auth.ts'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const PLAN_BY_PRICE: Record<string, 'basico' | 'pro' | 'premium'> = {
  [Deno.env.get('STRIPE_PRICE_BASICO') ?? '__missing_basico']: 'basico',
  [Deno.env.get('STRIPE_PRICE_PRO') ?? '__missing_pro']: 'pro',
  [Deno.env.get('STRIPE_PRICE_PREMIUM') ?? '__missing_premium']: 'premium',
}

type SubStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

function tsToIso(seconds: number | null | undefined): string | null {
  if (!seconds) return null
  return new Date(seconds * 1000).toISOString()
}

function planFromSubscription(sub: Stripe.Subscription) {
  const price = sub.items.data[0]?.price
  const id = price?.id ?? ''
  return PLAN_BY_PRICE[id] ?? null
}

function storeIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  return metadata?.store_id ?? null
}

async function sendBillingNotification(
  type: 'subscription_created' | 'subscription_updated' | 'subscription_canceled',
  storeId: string,
  planId?: string,
  status?: string,
) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/billing-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, storeId, planId, status }),
    })
  } catch (err) {
    // Don't fail webhook if notification fails
    console.error('Failed to send billing notification:', err)
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method_not_allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('missing_signature', { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('webhook signature verification failed', err)
    return new Response('invalid_signature', { status: 400 })
  }

  const admin = adminClient()

  // Idempotency: short-circuit if we've already processed this event id.
  const { data: existing } = await admin
    .from('billing_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    return new Response('ok (duplicate)', { status: 200 })
  }

  let storeId: string | null = null

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        storeId = (session.client_reference_id as string | null) ??
          storeIdFromMetadata(session.metadata)

        if (storeId && typeof session.customer === 'string') {
          await admin
            .from('subscriptions')
            .update({ stripe_customer_id: session.customer })
            .eq('store_id', storeId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        storeId = storeIdFromMetadata(sub.metadata)
        if (!storeId) break

        const planId = planFromSubscription(sub)
        const status: SubStatus =
          event.type === 'customer.subscription.deleted'
            ? 'canceled'
            : (sub.status as SubStatus)

        await admin
          .from('subscriptions')
          .update({
            plan_id: planId ?? undefined,
            status,
            stripe_customer_id:
              typeof sub.customer === 'string' ? sub.customer : undefined,
            stripe_subscription_id: sub.id,
            current_period_end: tsToIso(sub.current_period_end),
            trial_ends_at: tsToIso(sub.trial_end),
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq('store_id', storeId)

        // Send notification
        if (event.type === 'customer.subscription.created') {
          await sendBillingNotification('subscription_created', storeId, planId ?? undefined, status)
        } else if (event.type === 'customer.subscription.updated') {
          await sendBillingNotification('subscription_updated', storeId, planId ?? undefined, status)
        } else if (event.type === 'customer.subscription.deleted') {
          await sendBillingNotification('subscription_canceled', storeId, planId ?? undefined, status)
        }
        break
      }

      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice
        storeId =
          storeIdFromMetadata(invoice.subscription_details?.metadata) ??
          storeIdFromMetadata(invoice.metadata)

        if (!storeId) break

        await admin
          .from('invoices')
          .upsert(
            {
              store_id: storeId,
              stripe_invoice_id: invoice.id!,
              amount_in_cents: invoice.amount_paid ?? invoice.amount_due ?? 0,
              status: invoice.status ?? 'unknown',
              hosted_invoice_url: invoice.hosted_invoice_url ?? null,
              pdf_url: invoice.invoice_pdf ?? null,
              paid_at: tsToIso(invoice.status_transitions?.paid_at),
            },
            { onConflict: 'stripe_invoice_id' },
          )

        // First failed payment → suspend the catalog (CLAUDE.md §13.6).
        if (event.type === 'invoice.payment_failed') {
          await admin
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('store_id', storeId)
        }
        break
      }

      case 'customer.updated': {
        // Nothing to mirror locally yet; portal-edited details live on Stripe.
        break
      }

      default:
        // Unhandled event types still get logged below for auditability.
        break
    }

    // Conflict-safe on the stripe_event_id PK: guards against the race where two
    // concurrent retries both pass the SELECT short-circuit above.
    await admin
      .from('billing_events')
      .upsert(
        {
          stripe_event_id: event.id,
          type: event.type,
          store_id: storeId,
          payload: event as unknown as Record<string, unknown>,
        },
        { onConflict: 'stripe_event_id', ignoreDuplicates: true },
      )

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('webhook handler error', err)
    // Returning non-2xx asks Stripe to retry. Make sure transient errors are
    // safe to replay (idempotency check at the top guards us).
    return new Response('handler_error', { status: 500 })
  }
})
