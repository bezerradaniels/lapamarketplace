import { useQuery } from '@tanstack/react-query'
import { listCustomersForStore } from '../api/queries'
import { customersKeys } from '../api/keys'

export function useCustomers(storeId: string | undefined) {
  return useQuery({
    queryKey: customersKeys.list(storeId ?? ''),
    queryFn: () => listCustomersForStore(storeId as string),
    enabled: !!storeId,
  })
}
