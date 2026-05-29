// Shared helpers for authenticating callers and enforcing store membership.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** Service-role client for trusted writes (RLS bypass). */
export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** A client that runs queries as the calling user (RLS enforced). */
export function userClient(authHeader: string) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Verifies the caller's JWT and returns the user id. Use for endpoints that
 * only need an authenticated user (no specific store membership).
 * Throws 'missing_authorization' or 'invalid_token' on failure.
 */
export async function requireAuth(req: Request): Promise<{ userId: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('missing_authorization')

  const supabase = userClient(authHeader)
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('invalid_token')

  return { userId: userData.user.id }
}

/**
 * Verifies the JWT, then asserts the user is a member of `storeId`.
 * Throws on failure with a stable message.
 */
export async function requireStoreMember(
  req: Request,
  storeId: string,
): Promise<{ userId: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('missing_authorization')

  const supabase = userClient(authHeader)
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('invalid_token')

  const { data: member, error: memberError } = await supabase
    .from('store_members')
    .select('user_id')
    .eq('store_id', storeId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (memberError) throw memberError
  if (!member) throw new Error('not_a_member')

  return { userId: userData.user.id }
}

/**
 * Verifies store membership AND that the store's active plan has `has_ai_helpers`.
 * Returns 401 if the JWT is invalid, 403 if the plan doesn't allow AI features.
 * Throws with a stable message on failure; callers return the message as the error field.
 */
export async function requireAiHelpers(
  req: Request,
  storeId: string,
): Promise<{ userId: string }> {
  const membership = await requireStoreMember(req, storeId)

  const admin = adminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan_id')
    .eq('store_id', storeId)
    .maybeSingle()

  if (!sub?.plan_id) throw new Error('plan_upgrade_required')

  const { data: features } = await admin
    .from('plan_features')
    .select('has_ai_helpers')
    .eq('plan_id', sub.plan_id)
    .maybeSingle()

  if (!features?.has_ai_helpers) throw new Error('plan_upgrade_required')

  return membership
}
