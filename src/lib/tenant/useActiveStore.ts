import { useMyStores } from '@/features/catalog'
import { useSession } from '@/features/auth'

/**
 * Returns the owner's "active" store in the dashboard context.
 * For MVP we assume a single store per user — the first one is used.
 * (Multi-store switching can be layered on later via a Zustand store.)
 */
export function useActiveStore() {
  const { session } = useSession()
  const query = useMyStores(!!session)
  const store = query.data?.[0] ?? null
  return { ...query, store }
}
