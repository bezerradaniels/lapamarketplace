/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_ROOT_DOMAIN: string
  readonly VITE_DEFAULT_LOCALE: string
  readonly VITE_DEFAULT_CURRENCY: string
  readonly VITE_DEFAULT_TIMEZONE: string
  readonly VITE_DEFAULT_COUNTRY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  dataLayer?: unknown[]
  __gtmLoaded?: boolean
}
