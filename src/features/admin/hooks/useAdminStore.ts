import { useQuery } from '@tanstack/react-query'
import { adminKeys } from '../api/keys'
import { getStoreDetail } from '../api/queries'

export function useAdminStore(storeId: string) {
  return useQuery({
    queryKey: adminKeys.store(storeId),
    queryFn: () => getStoreDetail(storeId),
    enabled: !!storeId,
    staleTime: 30_000,
  })
}
