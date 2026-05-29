import { useStoreBySlug } from '@/features/catalog'
import { resolveStoreSlug } from './resolveStore'

export function useCurrentStore() {
  const slug = resolveStoreSlug()
  const query = useStoreBySlug(slug)
  return { slug, ...query }
}
