const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN ?? 'lapamarketplace.com.br'

const RESERVED_PATHS = new Set([
  '',
  'precos',
  'entrar',
  'cadastrar',
  'recuperar-senha',
  'nova-loja',
  'dashboard',
])

/**
 * Extracts the store slug from the first path segment.
 * Returns null when on a reserved route (dashboard, marketing, auth).
 */
export function resolveStoreSlug(): string | null {
  const { pathname } = window.location
  const pathSlug = pathname.split('/').filter(Boolean)[0] ?? ''
  if (pathSlug && !RESERVED_PATHS.has(pathSlug)) return pathSlug
  return null
}

/**
 * Builds the public URL for a given store slug.
 * Produces https://lapamarketplace.com.br/{slug} in production
 * and http://localhost:{port}/{slug} in local dev.
 */
export function buildStoreUrl(slug: string): string {
  const { protocol, hostname, port } = window.location
  const host = hostname === 'localhost' || hostname === '127.0.0.1'
    ? `${hostname}${port ? `:${port}` : ''}`
    : ROOT_DOMAIN
  return `${protocol}//${host}${buildStorePath(slug)}`
}

export function buildStorePath(slug: string, path = ''): string {
  const cleanPath = path.replace(/^\/+/, '')
  return `/${slug}${cleanPath ? `/${cleanPath}` : ''}`
}
