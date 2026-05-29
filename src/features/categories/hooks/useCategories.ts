import { useQuery } from '@tanstack/react-query'
import { listCategories } from '../api/queries'
import { categoriesKeys } from '../api/keys'

export function useCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: categoriesKeys.list(storeId ?? ''),
    queryFn: () => listCategories(storeId as string),
    enabled: !!storeId,
  })
}
