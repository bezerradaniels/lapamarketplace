import { FunctionsHttpError } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase'
import type { PlanId } from '@/types/domain'

export class BillingFunctionError extends Error {
  code: string
  detail?: string
  constructor(code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'BillingFunctionError'
    this.code = code
    this.detail = detail
  }
}

/**
 * Wraps `supabase.functions.invoke` and surfaces the structured error returned
 * by our Edge Functions (e.g. `{"error":"missing_secret","detail":"..."}`)
 * instead of the opaque "Edge Function returned a non-2xx response" toast.
 */
async function invokeBillingFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.functions.invoke<T>(name, { body })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json()
        const code = (payload?.error as string) ?? 'function_error'
        const detail = (payload?.detail as string) ?? (payload?.message as string)
        throw new BillingFunctionError(code, detail)
      } catch (parseErr) {
        if (parseErr instanceof BillingFunctionError) throw parseErr
        // Body wasn't JSON — fall through.
      }
    }
    throw new BillingFunctionError('function_error', error.message)
  }
  if (!data) throw new BillingFunctionError('empty_response')
  return data
}

export async function startCheckoutSession(
  storeId: string,
  planId: PlanId,
  billingPeriod: 'monthly' | 'annual' = 'monthly',
): Promise<string> {
  const data = await invokeBillingFunction<{ url?: string }>(
    'stripe-checkout-session',
    { storeId, planId, billingPeriod },
  )
  if (!data.url) throw new BillingFunctionError('checkout_session_no_url')
  return data.url
}

export async function openCustomerPortal(storeId: string): Promise<string> {
  const data = await invokeBillingFunction<{ url?: string }>(
    'stripe-portal-session',
    { storeId },
  )
  if (!data.url) throw new BillingFunctionError('portal_session_no_url')
  return data.url
}
