import { useQuery } from '@tanstack/react-query'
import { billingKeys } from '../api/keys'
import { getStoreCatalogStatus } from '../api/queries'

export function useStoreCatalogStatus(storeId: string | undefined) {
  return useQuery({
    queryKey: storeId ? billingKeys.catalogStatus(storeId) : billingKeys.all,
    queryFn: () => getStoreCatalogStatus(storeId!),
    enabled: !!storeId,
  })
}
