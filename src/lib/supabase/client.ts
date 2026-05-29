import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: ReturnType<typeof createClient<Database>> | null = null

export function createBrowserClient() {
  if (client) return client

  // SECURITY: the session (access + refresh JWT) is persisted in the default
  // origin-isolated localStorage — NOT in a cookie scoped to the parent domain.
  //
  // The previous implementation wrote the token to `document.cookie` with
  // `domain=.lapamarketplace.com.br`, which made it (a) readable by JavaScript
  // (cookies set from JS can never be HttpOnly) and (b) shared with every tenant
  // catalog at `{slug}.lapamarketplace.com.br`. Because each catalog renders
  // store-owner-controlled content (rich-text descriptions, GTM containers), any
  // XSS on any tenant subdomain could read the shared token and take over other
  // accounts — including the platform admin. Origin-isolated storage means a
  // token minted on the dashboard origin is never exposed to catalog subdomains.
  //
  // NOTE: this intentionally removes cross-subdomain auto-login. "Owner mode"
  // preview on a live catalog subdomain must be served from the dashboard origin
  // (or require an explicit login on that subdomain), never by sharing the token.
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'lapa-marketplace-session',
      // default storage = window.localStorage (per-origin, not shared cross-subdomain)
    },
  })
  return client
}
