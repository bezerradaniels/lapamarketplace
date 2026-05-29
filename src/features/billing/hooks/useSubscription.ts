import { useQuery } from '@tanstack/react-query'
import { billingKeys } from '../api/keys'
import { getSubscription } from '../api/queries'

export function useSubscription(storeId: string | undefined) {
  return useQuery({
    queryKey: storeId ? billingKeys.subscription(storeId) : billingKeys.all,
    queryFn: () => getSubscription(storeId!),
    enabled: !!storeId,
  })
}
