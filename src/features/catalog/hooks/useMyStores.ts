import { useQuery } from '@tanstack/react-query'
import { listMyStores } from '../api/queries'
import { catalogKeys } from '../api/keys'

export function useMyStores(enabled = true) {
  return useQuery({
    queryKey: catalogKeys.myStores(),
    queryFn: listMyStores,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
