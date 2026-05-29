// Checks for trials that have ended and sends notifications
// This function should be called daily (e.g., via external cron job or Supabase pg_cron)
import { adminClient } from '../_shared/auth.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Only allow service role key for security
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('unauthorized', { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace('Bearer ', '')
  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('forbidden', { status: 403, headers: corsHeaders })
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('method_not_allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const admin = adminClient()

    // Find trials that ended in the last 24 hours and haven't been notified yet.
    // Owner email/name come from `profiles`, joined to `stores` via owner_id.
    const { data: completedTrials, error } = await admin
      .from('subscriptions')
      .select(`
        store_id,
        plan_id,
        trial_ends_at,
        stores!inner (
          name,
          owner:profiles!stores_owner_id_fkey ( email, name )
        )
      `)
      .eq('status', 'trialing')
      .lte('trial_ends_at', new Date().toISOString())
      .gte('trial_ends_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) throw error

    if (!completedTrials || completedTrials.length === 0) {
      return new Response(JSON.stringify({ message: 'No completed trials found', count: 0 }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    let notifiedCount = 0

    for (const trial of completedTrials) {
      const store = trial.stores as { name?: string; owner?: { email?: string; name?: string } }

      // Check if we already notified for this trial end
      const { data: existingEvent } = await admin
        .from('billing_events')
        .select('id')
        .eq('store_id', trial.store_id)
        .eq('type', 'trial_ended')
        .gte('received_at', new Date(new Date(trial.trial_ends_at).getTime() - 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (existingEvent) {
        continue // Already notified
      }

      // Log the notification event
      await admin.from('billing_events').insert({
        stripe_event_id: `trial_ended_${trial.store_id}_${Date.now()}`,
        type: 'trial_ended',
        store_id: trial.store_id,
        payload: {
          store_name: store.name,
          owner_email: store.owner?.email,
          owner_name: store.owner?.name,
          plan_id: trial.plan_id,
        },
      })

      // Send notification via billing-notification edge function
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/billing-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'trial_ended',
            storeId: trial.store_id,
            planId: trial.plan_id,
            status: 'past_due',
          }),
        })

        // Update subscription status
        await admin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('store_id', trial.store_id)

        notifiedCount++
      } catch (err) {
        console.error('Failed to send trial completion notification:', err)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Trial completion check completed',
        total_found: completedTrials.length,
        notified: notifiedCount,
      }),
      { status: 200, headers: corsHeaders },
    )
  } catch (err) {
    console.error('check-trial-completions error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
