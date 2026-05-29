// Fetches public Instagram profile data for a given handle.
// Input: { storeId, handle }
// Output: { displayName?, profileImageUrl? }
//
// Used during onboarding to enrich store context for AI helpers.
// Uses Instagram oEmbed API (no auth required for public profiles).
// Always returns 200 — failures are silently ignored by the caller.
// Requires authenticated store member (no plan check — available during trial).

import { jsonResponse, preflight } from '../_shared/cors.ts'
import { requireStoreMember } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
  }

  let body: { storeId?: string; handle?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 })
  }

  const { storeId, handle } = body
  if (!storeId || !handle) {
    return jsonResponse({ error: 'missing_fields' }, { status: 400 })
  }

  try {
    await requireStoreMember(req, storeId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'forbidden'
    return jsonResponse({ error: message }, { status: 401 })
  }

  const cleanHandle = handle.replace(/^@/, '').trim()
  if (!cleanHandle) return jsonResponse({})

  try {
    const oembedUrl =
      `https://graph.instagram.com/oembed?url=https://www.instagram.com/${encodeURIComponent(cleanHandle)}/&omit_script=true`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Lapa Marketplace/1.0' },
    })
    clearTimeout(timeout)

    if (!res.ok) return jsonResponse({})

    const data = await res.json()
    return jsonResponse({
      displayName: data?.author_name ?? null,
      profileImageUrl: data?.thumbnail_url ?? null,
    })
  } catch {
    // oEmbed failed (private account, rate limit, timeout) — return empty
    return jsonResponse({})
  }
})
