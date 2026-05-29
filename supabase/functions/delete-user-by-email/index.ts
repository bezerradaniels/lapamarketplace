import { adminClient } from '../_shared/auth.ts'

const ADMIN_DELETE_TOKEN = Deno.env.get('ADMIN_DELETE_TOKEN')

// This is a destructive ops endpoint (deletes auth users + their stores). It is
// not browser-facing, so CORS is locked down rather than wildcarded.
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lapamarketplace.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Vary': 'Origin',
}

/** Constant-time string comparison to avoid leaking the token via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  // Compare a fixed-length digest so length differences don't short-circuit.
  if (ab.length !== bb.length) {
    // Still do work to keep timing uniform, then fail.
    let diff = 1
    for (let i = 0; i < Math.max(ab.length, bb.length); i++) {
      diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
    }
    return diff === 0 && false
  }
  let diff = 0
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i]
  return diff === 0
}

interface DeleteUserRequest {
  email: string
  dryRun?: boolean
  deleteOwnedStores?: boolean
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  if (!ADMIN_DELETE_TOKEN) {
    return json({ error: 'missing_admin_delete_token_secret' }, 500)
  }

  const token = req.headers.get('x-admin-token')
  if (!token || !timingSafeEqual(token, ADMIN_DELETE_TOKEN)) {
    return json({ error: 'unauthorized' }, 401)
  }

  try {
    const { email, dryRun = true, deleteOwnedStores = false }: DeleteUserRequest = await req.json()
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail) {
      return json({ error: 'missing_email' }, 400)
    }

    const admin = adminClient()
    const user = await findUserByEmail(admin, normalizedEmail)

    if (!user) {
      return json({ found: false, email: normalizedEmail, dryRun })
    }

    const { data: ownedStores, error: storesError } = await admin
      .from('stores')
      .select('id, slug, name')
      .eq('owner_id', user.id)

    if (storesError) throw storesError

    if (dryRun) {
      return json({
        found: true,
        dryRun: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
        },
        ownedStores: ownedStores ?? [],
        willRequireDeleteOwnedStores: (ownedStores?.length ?? 0) > 0,
      })
    }

    if ((ownedStores?.length ?? 0) > 0 && !deleteOwnedStores) {
      return json({
        error: 'user_owns_stores',
        message: 'Set deleteOwnedStores=true to delete stores owned by this user before deleting the auth user.',
        ownedStores,
      }, 409)
    }

    const deleted: Record<string, number | string | null> = {}

    const { count: notificationsCount, error: notificationsError } = await admin
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
    if (notificationsError) throw notificationsError
    deleted.notifications = notificationsCount

    const { count: storeMembersCount, error: storeMembersError } = await admin
      .from('store_members')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
    if (storeMembersError) throw storeMembersError
    deleted.store_members = storeMembersCount

    const { count: sellerCatalogsCount, error: sellerCatalogsError } = await admin
      .from('seller_catalogs')
      .update({ linked_user_id: null }, { count: 'exact' })
      .eq('linked_user_id', user.id)
    if (sellerCatalogsError) throw sellerCatalogsError
    deleted.unlinked_seller_catalogs = sellerCatalogsCount

    const { count: customersCount, error: customersError } = await admin
      .from('customers')
      .update({ seller_id: null }, { count: 'exact' })
      .eq('seller_id', user.id)
    if (customersError) throw customersError
    deleted.unlinked_customers = customersCount

    if (deleteOwnedStores) {
      const { count: storesCount, error: deleteStoresError } = await admin
        .from('stores')
        .delete({ count: 'exact' })
        .eq('owner_id', user.id)
      if (deleteStoresError) throw deleteStoresError
      deleted.owned_stores = storesCount
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteUserError) throw deleteUserError

    return json({
      found: true,
      dryRun: false,
      deletedUser: {
        id: user.id,
        email: user.email,
      },
      deleted,
    })
  } catch (err) {
    console.error('delete user by email error:', err)
    const message = err instanceof Error ? err.message : 'internal_error'
    return json({ error: message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function findUserByEmail(admin: ReturnType<typeof adminClient>, email: string) {
  let page = 1
  const perPage = 100

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user

    if (data.users.length < perPage) return null
    page += 1
  }
}
