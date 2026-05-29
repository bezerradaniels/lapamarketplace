import { useQuery } from '@tanstack/react-query'
import { listProductsForStore, listPublicProducts } from '../api/queries'
import { productsKeys } from '../api/keys'

export function useProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: productsKeys.list(storeId ?? ''),
    queryFn: () => listProductsForStore(storeId as string),
    enabled: !!storeId,
  })
}

export function usePublicProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: productsKeys.publicList(storeId ?? ''),
    queryFn: () => listPublicProducts(storeId as string),
    enabled: !!storeId,
    staleTime: 30 * 1000,
  })
}
