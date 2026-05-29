import { useQuery } from '@tanstack/react-query'
import { getCustomerById } from '../api/queries'
import { customersKeys } from '../api/keys'

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customersKeys.detail(id ?? ''),
    queryFn: () => getCustomerById(id as string),
    enabled: !!id,
  })
}
