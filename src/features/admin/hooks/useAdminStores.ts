import { useQuery } from '@tanstack/react-query'
import { adminKeys } from '../api/keys'
import { getStoresList } from '../api/queries'

export function useAdminStores() {
  return useQuery({
    queryKey: adminKeys.stores(),
    queryFn: getStoresList,
    staleTime: 30_000,
  })
}
