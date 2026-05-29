import { useQuery } from '@tanstack/react-query'
import { getStoreBySlug } from '../api/queries'
import { catalogKeys } from '../api/keys'

export function useStoreBySlug(slug: string | null) {
  return useQuery({
    queryKey: catalogKeys.storeBySlug(slug ?? ''),
    queryFn: () => getStoreBySlug(slug as string),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}
