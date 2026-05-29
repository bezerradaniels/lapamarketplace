import { useQuery } from '@tanstack/react-query'
import { billingKeys } from '../api/keys'
import { listInvoicesForStore } from '../api/queries'

export function useInvoices(storeId: string | undefined) {
  return useQuery({
    queryKey: storeId ? billingKeys.invoices(storeId) : billingKeys.all,
    queryFn: () => listInvoicesForStore(storeId!),
    enabled: !!storeId,
  })
}
