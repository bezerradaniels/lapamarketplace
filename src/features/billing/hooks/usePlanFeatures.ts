import { useQuery } from '@tanstack/react-query'
import { billingKeys } from '../api/keys'
import { listPlanFeatures } from '../api/queries'

export function usePlanFeatures() {
  return useQuery({
    queryKey: billingKeys.planFeatures(),
    queryFn: listPlanFeatures,
    staleTime: 5 * 60 * 1000, // plans rarely change
  })
}
