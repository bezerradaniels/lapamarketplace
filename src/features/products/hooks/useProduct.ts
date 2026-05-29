import { useQuery } from '@tanstack/react-query'
import { getProductById } from '../api/queries'
import { productsKeys } from '../api/keys'

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productsKeys.byId(id ?? ''),
    queryFn: () => getProductById(id as string),
    enabled: !!id,
  })
}
