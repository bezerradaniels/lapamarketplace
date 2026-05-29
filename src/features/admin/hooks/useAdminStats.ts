import { useQuery } from '@tanstack/react-query'
import { adminKeys } from '../api/keys'
import { getPlatformStats } from '../api/queries'

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getPlatformStats,
    staleTime: 60_000,
  })
}
